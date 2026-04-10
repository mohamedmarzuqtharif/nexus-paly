import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function Lobby({ room: initRoom, myId, onStartGame }) {
  const { emit, on } = useSocket();
  const [room, setRoom] = useState(initRoom);

  useEffect(() => {
    const off1 = on('playerJoined', ({ room: r }) => setRoom(r));
    const off2 = on('playerLeft',   ({ room: r }) => setRoom(r));
    const off3 = on('gameStarted',  ({ game, state, players }) => {
      onStartGame(game, { ...room, gameState: state, players: players || room.players });
    });
    return () => { off1(); off2(); off3(); };
  }, [room]);

  const isHost = room.players[0]?.id === myId;

  const start = (game) => emit('startGame', { code: room.code, game });

  return (
    <div className="glass" style={{ padding: '36px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ color: '#555', fontSize: 13, marginBottom: 6 }}>ROOM CODE</p>
        <h2 className="neon-text" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '0.3em' }}>{room.code}</h2>
        <p style={{ color: '#444', fontSize: 12, marginTop: 4 }}>Share this with friends</p>
      </div>

      {/* Player List */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>PLAYERS ({room.players.length}/4)</p>
        {room.players.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'rgba(0,242,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i===0 ? 'var(--cyan)' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {p.name[0].toUpperCase()}
            </div>
            <span style={{ color: p.id === myId ? 'var(--cyan)' : '#ccc', fontSize: 15 }}>{p.name}</span>
            {i === 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>HOST</span>}
          </motion.div>
        ))}
      </div>

      {/* Game select (host only) */}
      {isHost && room.players.length >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>SELECT GAME</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => start('ttt')}>
              ⊞ Tic-Tac-Toe
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => start('ipl')}>
              🏏 IPL Auction
            </button>
          </div>
        </motion.div>
      )}
      {isHost && room.players.length < 2 && <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>Waiting for more players...</p>}
      {!isHost && <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>Waiting for host to start the game...</p>}
    </div>
  );
}