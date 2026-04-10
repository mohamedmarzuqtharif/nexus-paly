import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function MemoryGame({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const init = room.gameState;
  const [deck, setDeck] = useState(init?.deck || []);
  const [turn, setTurn] = useState(init?.turn);
  const [scores, setScores] = useState(init?.scores || {});
  const [result, setResult] = useState(null);
  const isMyTurn = turn === myId;

  useEffect(() => {
    const offs = [
      on('memoryUpdate', ({ deck: d, turn: t, scores: s }) => { setDeck(d); setTurn(t); setScores(s); }),
      on('memoryEnd', ({ scores: s }) => setResult(s)),
    ];
    return () => offs.forEach(f => f());
  }, []);

  const flip = (id) => {
    if (!isMyTurn) return;
    emit('memoryFlip', { code: room.code, cardId: id });
  };

  const myScore = scores[myId] || 0;
  const oppPlayer = room.players.find(p => p.id !== myId);
  const oppScore = oppPlayer ? (scores[oppPlayer.id] || 0) : 0;

  return (
    <div className="glass" style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          <span className="neon-text">Memory</span> Flip
        </h2>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--cyan)' }}>You: {myScore}</span>
          {oppPlayer && <span style={{ color: 'var(--magenta)' }}>{oppPlayer.name}: {oppScore}</span>}
        </div>
      </div>

      <p style={{ fontSize: 13, color: isMyTurn ? '#fff' : '#555', marginBottom: 18, textAlign: 'center' }}>
        {result ? '🏆 Game Over!' : isMyTurn ? '✨ Your turn — flip two cards' : `Waiting for ${room.players.find(p=>p.id===turn)?.name}...`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {deck.map((card) => (
          <motion.div key={card.id}
            onClick={() => !card.flipped && !card.matched && flip(card.id)}
            animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              height: 70, borderRadius: 12,
              background: card.matched ? 'rgba(0,242,255,0.12)' : card.flipped ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${card.matched ? 'var(--cyan)' : card.flipped ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, cursor: !card.flipped && !card.matched && isMyTurn ? 'pointer' : 'default',
              userSelect: 'none',
            }}>
            <AnimatePresence>
              {(card.flipped || card.matched) && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  {card.icon}
                </motion.span>
              )}
            </AnimatePresence>
            {!card.flipped && !card.matched && <span style={{ color: '#333', fontSize: 20 }}>?</span>}
          </motion.div>
        ))}
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, textAlign: 'center' }}>
          <p className="neon-text" style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            {myScore > oppScore ? '🏆 You Win!' : myScore === oppScore ? "🤝 It's a Tie!" : '😔 You Lost'}
          </p>
          <button className="btn-primary" onClick={onBack}>Back to Home</button>
        </motion.div>
      )}

      {!result && <button className="btn-primary btn-danger" onClick={onBack} style={{ width: '100%', marginTop: 20 }}>← Leave</button>}
    </div>
  );
}