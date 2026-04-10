import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function Lobby({ room: initRoom, myId, onStartGame }) {
  const { emit, on } = useSocket();
  const [room, setRoom] = useState(initRoom);

  // Sync room updates safely
  useEffect(() => {
    const off1 = on('playerJoined', ({ room: r }) => setRoom(r));
    const off2 = on('playerLeft', ({ room: r }) => setRoom(r));

    const off3 = on('gameStarted', ({ game, state, players }) => {
      const pageMap = {
        ttt: 'ttt',
        ipl: 'ipl',
        memory: 'memory',
        word: 'word',
        bingo: 'bingo',
        quiz: 'quiz',
        snake: 'snake'
      };

      setRoom(prev => {
        const updatedRoom = {
          ...prev,
          gameState: state,
          players: players || prev.players
        };

        onStartGame(pageMap[game] || game, updatedRoom);
        return updatedRoom;
      });
    });

    return () => {
      off1();
      off2();
      off3();
    };
  }, []); // ✅ important fix

  const isHost = room.players[0]?.id === myId;

  const start = (game) => {
    emit('startGame', { code: room.code, game });
  };

  return (
    <div className="glass" style={{ padding: '36px 32px' }}>
      
      {/* Room Code */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ color: '#555', fontSize: 13, marginBottom: 6 }}>
          ROOM CODE
        </p>
        <h2
          className="neon-text"
          style={{
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '0.3em'
          }}
        >
          {room.code}
        </h2>
        <p style={{ color: '#444', fontSize: 12, marginTop: 4 }}>
          Share this with friends
        </p>
      </div>

      {/* Player List */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>
          PLAYERS ({room.players.length}/4)
        </p>

        {room.players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background:
                  i === 0
                    ? 'rgba(0,242,255,0.15)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  i === 0 ? 'var(--cyan)' : '#333'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              {p.name[0].toUpperCase()}
            </div>

            <span
              style={{
                color: p.id === myId ? 'var(--cyan)' : '#ccc',
                fontSize: 15
              }}
            >
              {p.name}
            </span>

            {i === 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  color: '#555'
                }}
              >
                HOST
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Game Selection */}
      {isHost && room.players.length >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>
            SELECT GAME
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            {[
              { id: 'ttt', label: '⊞ Tic-Tac-Toe', min: 2 },
              { id: 'ipl', label: '🏏 IPL Auction', min: 2 },
              { id: 'memory', label: '🃏 Memory Flip', min: 2 },
              { id: 'word', label: '🔤 Word Scramble', min: 2 },
              { id: 'bingo', label: '🎰 Number Bingo', min: 2 },
              { id: 'quiz', label: '⚡ Rapid Quiz', min: 2 },
              { id: 'snake', label: '🐍 Snake Battle', min: 2 }
            ].map(g => (
              <button
                key={g.id}
                className="btn-primary"
                onClick={() => start(g.id)}
                disabled={room.players.length < g.min}
                style={{
                  padding: '12px 8px',
                  fontSize: 13
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Waiting States */}
      {isHost && room.players.length < 2 && (
        <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>
          Waiting for more players...
        </p>
      )}

      {!isHost && (
        <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>
          Waiting for host to start the game...
        </p>
      )}
    </div>
  );
}