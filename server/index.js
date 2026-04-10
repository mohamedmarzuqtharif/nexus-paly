import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ─── Room State ────────────────────────────────────────────────
const activeRooms = {};
// Shape: {
//   code, host, players: [{id, name}],
//   game: null | 'ttt' | 'ipl',
//   ttt: { board: Array(9), turn: id, winner: null },
//   ipl: {
//     players: [...], currentIndex: 0,
//     currentBid: 1000000, highBidder: null,
//     budgets: { [socketId]: 125e7 },
//     timer: null, timeLeft: 10,
//     processing: false  ← RACE CONDITION GUARD
//   }
// }

const IPL_PLAYERS = [
  { id: 1, name: 'Yashasvi Jaiswal',  role: 'Opener',      team: 'RR',  basePrice: 1400, stats: { runs: 1254, avg: 62.7, sr: 158.4 } },
  { id: 2, name: 'Sameer Rizvi',      role: 'Middle Order', team: 'CSK', basePrice: 800,  stats: { runs: 482,  avg: 40.1, sr: 145.2 } },
  { id: 3, name: 'Jasprit Bumrah',    role: 'Pacer',        team: 'MI',  basePrice: 1800, stats: { wkts: 89,   eco: 6.7,  avg: 17.2 } },
  { id: 4, name: 'Riyan Parag',       role: 'All-Rounder',  team: 'RR',  basePrice: 900,  stats: { runs: 573,  avg: 47.8, sr: 152.3 } },
  { id: 5, name: 'Tilak Varma',       role: 'Middle Order', team: 'MI',  basePrice: 1000, stats: { runs: 729,  avg: 60.8, sr: 144.7 } },
  { id: 6, name: 'Varun Chakravarthy',role: 'Spinner',      team: 'KKR', basePrice: 700,  stats: { wkts: 62,   eco: 7.4,  avg: 22.1 } },
];

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function checkWinner(board) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

// ─── Socket Events ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  // CREATE ROOM
  socket.on('createRoom', ({ name }) => {
    let code;
    do { code = generateCode(); } while (activeRooms[code]);

    activeRooms[code] = {
      code, host: socket.id,
      players: [{ id: socket.id, name }],
      game: null, ttt: null, ipl: null,
    };
    socket.join(code);
    socket.emit('roomCreated', { code, room: activeRooms[code] });
  });

  // JOIN ROOM
  socket.on('joinRoom', ({ code, name }) => {
    const room = activeRooms[code];
    if (!room) return socket.emit('error', 'Room not found');
    if (room.players.length >= 4) return socket.emit('error', 'Room full (max 4)');
    if (room.game) return socket.emit('error', 'Game already started');

    room.players.push({ id: socket.id, name });
    socket.join(code);
    socket.emit('roomJoined', { code, room });
    socket.to(code).emit('playerJoined', { room });
  });

  // START GAME
  socket.on('startGame', ({ code, game }) => {
    const room = activeRooms[code];
    if (!room || room.host !== socket.id) return;
    room.game = game;

    if (game === 'ttt') {
      room.ttt = { board: Array(9).fill(null), turn: room.players[0].id, winner: null };
      io.to(code).emit('gameStarted', { game, state: room.ttt, players: room.players });
    }

    if (game === 'ipl') {
      const budgets = {};
      room.players.forEach(p => { budgets[p.id] = 125_00_00_000; }); // ₹125 Cr
      room.ipl = {
        players: [...IPL_PLAYERS],
        currentIndex: 0,
        currentBid: IPL_PLAYERS[0].basePrice * 100000,
        highBidder: null,
        budgets,
        timeLeft: 10,
        timer: null,
        processing: false,
        sold: [],
      };
      io.to(code).emit('gameStarted', { game, state: buildIplSnapshot(room) });
      startAuctionTimer(code);
    }
  });

  // ── TTT: Make Move ──────────────────────────────────────────
  socket.on('tttMove', ({ code, index }) => {
    const room = activeRooms[code];
    if (!room?.ttt) return;
    const { ttt } = room;
    if (ttt.turn !== socket.id || ttt.board[index] || ttt.winner) return;

    const symbol = room.players.findIndex(p => p.id === socket.id) === 0 ? 'X' : 'O';
    ttt.board[index] = symbol;
    ttt.winner = checkWinner(ttt.board);
    if (!ttt.winner) ttt.turn = room.players.find(p => p.id !== socket.id).id;

    io.to(code).emit('tttUpdate', { board: ttt.board, turn: ttt.turn, winner: ttt.winner });
  });

  // ── IPL: Place Bid ─────────────────────────────────────────
  // RACE CONDITION HANDLING:
  // Multiple clients can fire 'placeBid' within milliseconds of each other.
  // We use a boolean `processing` flag as a mutex. The FIRST bid that arrives
  // sets processing=true and proceeds. All subsequent bids that arrive before
  // the flag resets are silently dropped (no double-counting).
  // The server-side timer also cannot fire hammer() while processing=true.
  socket.on('placeBid', ({ code, amount }) => {
    const room = activeRooms[code];
    if (!room?.ipl) return;
    const { ipl } = room;

    // Mutex guard
    if (ipl.processing) return;
    ipl.processing = true;

    const bidder = room.players.find(p => p.id === socket.id);
    if (!bidder) { ipl.processing = false; return; }

    // Validate bid
    if (amount <= ipl.currentBid) { ipl.processing = false; return; }
    if (ipl.budgets[socket.id] < amount) { ipl.processing = false; return; }

    ipl.currentBid = amount;
    ipl.highBidder = { id: socket.id, name: bidder.name };

    // Reset timer on new bid (excitement mechanic)
    ipl.timeLeft = 10;

    io.to(code).emit('bidUpdate', buildIplSnapshot(room));
    ipl.processing = false;
  });

  // ── Disconnect ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    for (const code in activeRooms) {
      const room = activeRooms[code];
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        clearInterval(room.ipl?.timer);
        delete activeRooms[code];
      } else {
        if (room.host === socket.id) room.host = room.players[0].id;
        io.to(code).emit('playerLeft', { room });
      }
    }
  });
});

// ─── IPL Timer (server-side, cheat-proof) ──────────────────────
function startAuctionTimer(code) {
  const room = activeRooms[code];
  if (!room?.ipl) return;
  clearInterval(room.ipl.timer);

  room.ipl.timer = setInterval(() => {
    const { ipl } = room;
    ipl.timeLeft -= 1;
    io.to(code).emit('timerTick', { timeLeft: ipl.timeLeft });

    if (ipl.timeLeft <= 0) hammer(code);
  }, 1000);
}

function hammer(code) {
  const room = activeRooms[code];
  if (!room?.ipl || room.ipl.processing) return;
  room.ipl.processing = true;

  const { ipl } = room;
  clearInterval(ipl.timer);

  const current = ipl.players[ipl.currentIndex];

  if (ipl.highBidder) {
    // Deduct budget
    ipl.budgets[ipl.highBidder.id] -= ipl.currentBid;
    ipl.sold.push({ player: current, soldTo: ipl.highBidder, price: ipl.currentBid });
    io.to(code).emit('playerSold', { player: current, soldTo: ipl.highBidder, price: ipl.currentBid });
  } else {
    io.to(code).emit('playerUnsold', { player: current });
  }

  ipl.currentIndex += 1;

  if (ipl.currentIndex >= ipl.players.length) {
    io.to(code).emit('auctionEnded', { sold: ipl.sold, budgets: ipl.budgets });
    room.ipl.processing = false;
    return;
  }

  // Next player
  const next = ipl.players[ipl.currentIndex];
  ipl.currentBid = next.basePrice * 100000;
  ipl.highBidder = null;
  ipl.timeLeft = 10;
  ipl.processing = false;

  io.to(code).emit('nextPlayer', buildIplSnapshot(room));
  startAuctionTimer(code);
}

function buildIplSnapshot(room) {
  const { ipl, players } = room;
  return {
    currentPlayer: ipl.players[ipl.currentIndex],
    currentBid: ipl.currentBid,
    highBidder: ipl.highBidder,
    budgets: ipl.budgets,
    players,
    timeLeft: ipl.timeLeft,
    sold: ipl.sold,
  };
}

server.listen(5000, () => console.log('Nexus Play server on :5000 🚀'));