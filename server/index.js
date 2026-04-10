import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://your-vercel-url.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// ─────────────────────────────────────────
// ROOM STATE
// ─────────────────────────────────────────
const activeRooms = {};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// GAME DATA
// ─────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "What does HTTP stand for?", options: ["HyperText Transfer Protocol","High Transfer Text Protocol","HyperText Transport Program","None"], ans: 0 },
  { q: "Which language runs in the browser?", options: ["Python","Java","JavaScript","C++"], ans: 2 },
];

const WORD_LIST = ["JAVASCRIPT","SOCKET","REACT","NODE","DATABASE"];

// ─────────────────────────────────────────
// SOCKET
// ─────────────────────────────────────────
io.on('connection', (socket) => {

  // CREATE ROOM
  socket.on('createRoom', ({ name }) => {
    const code = generateCode();
    activeRooms[code] = {
      code,
      host: socket.id,
      players: [{ id: socket.id, name }],
      game: null
    };
    socket.join(code);
    socket.emit('roomCreated', { code, room: activeRooms[code] });
  });

  // JOIN ROOM
  socket.on('joinRoom', ({ code, name }) => {
    const room = activeRooms[code];
    if (!room) return;

    room.players.push({ id: socket.id, name });
    socket.join(code);

    socket.emit('roomJoined', { code, room });
    socket.to(code).emit('playerJoined', { room });
  });

  // START GAME
  socket.on('startGame', ({ code, game }) => {
    const room = activeRooms[code];
    if (!room) return;

    room.game = game;

    // TTT
    if (game === 'ttt') {
      room.ttt = { board: Array(9).fill(null), turn: room.players[0].id };
      io.to(code).emit('gameStarted', { game, state: room.ttt });
    }

    // MEMORY
    if (game === 'memory') {
      const icons = ['🔥','⚡','🎮','🚀'];
      const deck = [...icons, ...icons]
        .sort(() => Math.random() - 0.5)
        .map((icon, i) => ({ id: i, icon, flipped: false }));

      room.memory = { deck, turn: room.players[0].id, flipped: [] };
      io.to(code).emit('gameStarted', { game, state: room.memory });
    }

    // QUIZ
    if (game === 'quiz') {
      room.quiz = { index: 0, scores: {} };
      io.to(code).emit('gameStarted', { game });
      sendQuiz(code);
    }
  });

  // ─── TTT MOVE
  socket.on('tttMove', ({ code, index }) => {
    const room = activeRooms[code];
    if (!room?.ttt) return;

    const ttt = room.ttt;
    if (ttt.board[index]) return;

    const symbol = 'X';
    ttt.board[index] = symbol;

    io.to(code).emit('tttUpdate', ttt);
  });

  // ─── MEMORY FLIP
  socket.on('memoryFlip', ({ code, id }) => {
    const room = activeRooms[code];
    if (!room?.memory) return;

    const card = room.memory.deck[id];
    if (!card.flipped) {
      card.flipped = true;
      io.to(code).emit('memoryUpdate', room.memory);
    }
  });

  // ─── QUIZ ANSWER
  socket.on('quizAnswer', ({ code, answer }) => {
    const room = activeRooms[code];
    if (!room?.quiz) return;

    const q = QUIZ_QUESTIONS[room.quiz.index];
    if (answer === q.ans) {
      room.quiz.scores[socket.id] = (room.quiz.scores[socket.id] || 0) + 1;
    }

    room.quiz.index++;
    sendQuiz(code);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    for (const code in activeRooms) {
      const room = activeRooms[code];
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.players.length === 0) {
        delete activeRooms[code];
      } else {
        io.to(code).emit('playerLeft', { room });
      }
    }
  });

});

// ─────────────────────────────────────────
// QUIZ FUNCTION
// ─────────────────────────────────────────
function sendQuiz(code) {
  const room = activeRooms[code];
  if (!room) return;

  if (room.quiz.index >= QUIZ_QUESTIONS.length) {
    io.to(code).emit('quizEnd', room.quiz.scores);
    return;
  }

  const q = QUIZ_QUESTIONS[room.quiz.index];
  io.to(code).emit('quizQuestion', q);
}

// ─────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────
server.listen(5000, () => {
  console.log('Server running on port 5000');
});