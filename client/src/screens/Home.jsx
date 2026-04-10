import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function Home({ onJoin }) {
  const { emit, on } = useSocket();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [err, setErr] = useState('');

  const create = () => {
    if (!name.trim()) return setErr('Enter your name');
    emit('createRoom', { name });
    const off = on('roomCreated', ({ room }) => {
      off();
      onJoin(room, room.players[0].id);
    });
  };

  const join = () => {
    if (!name.trim() || !code.trim()) return setErr('Fill all fields');
    emit('joinRoom', { code, name });
    const off = on('roomJoined', ({ room }) => {
      off();
      const me = room.players.find(p => p.name === name);
      onJoin(room, me?.id);
    });
    const offErr = on('error', (msg) => { offErr(); setErr(msg); });
  };

  return (
    <div className="glass" style={{ padding: '48px 40px', textAlign: 'center' }}>
      {/* Logo */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>
          <span className="neon-text">NEXUS</span>{' '}
          <span style={{ color: '#fff' }}>PLAY</span>
        </h1>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 36, fontSize: 14 }}>
          Real-time multiplayer gaming hub
        </p>
      </motion.div>

      {/* Name */}
      <input
        className="cyber-input"
        placeholder="Your name"
        value={name}
        onChange={e => { setName(e.target.value); setErr(''); }}
        style={{ marginBottom: 16 }}
      />

      {/* Mode buttons */}
      {!mode && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => setMode('create')}>Create Room</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => setMode('join')}>Join Room</button>
        </div>
      )}

      {mode === 'create' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={create}>
            ⚡ Create Room
          </button>
          <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#555', marginTop: 10, cursor: 'pointer', fontSize: 13 }}>← back</button>
        </motion.div>
      )}

      {mode === 'join' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <input
            className="cyber-input"
            placeholder="4-digit room code"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(''); }}
            maxLength={4}
            style={{ marginTop: 8, fontSize: 24, textAlign: 'center', letterSpacing: '0.4em' }}
          />
          <button className="btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={join}>
            → Join Room
          </button>
          <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#555', marginTop: 10, cursor: 'pointer', fontSize: 13 }}>← back</button>
        </motion.div>
      )}

      {err && <p className="neon-magenta" style={{ marginTop: 14, fontSize: 13 }}>⚠ {err}</p>}
    </div>
  );
}