import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function WordScramble({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const [scrambled, setScrambled] = useState('');
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [scores, setScores] = useState({});
  const [flash, setFlash] = useState(null); // {msg, color}
  const [roundOver, setRoundOver] = useState(false);

  useEffect(() => {
    const offs = [
      on('wordRound',  ({ scrambled: s, timeLeft: t }) => { setScrambled(s); setTimeLeft(t); setGuess(''); setFlash(null); setRoundOver(false); }),
      on('wordTick',   ({ timeLeft: t }) => setTimeLeft(t)),
      on('wordSolved', ({ winner, answer, scores: s }) => {
        setScores(s); setRoundOver(true);
        setFlash({ msg: `✅ ${winner} solved it! Answer: ${answer}`, color: 'var(--cyan)' });
      }),
      on('wordReveal', ({ answer, scores: s }) => {
        setScores(s); setRoundOver(true);
        setFlash({ msg: `⏰ Time's up! Answer was: ${answer}`, color: 'var(--magenta)' });
      }),
    ];
    return () => offs.forEach(f => f());
  }, []);

  const submit = () => {
    if (!guess.trim()) return;
    emit('wordGuess', { code: room.code, guess: guess.trim() });
    setGuess('');
  };

  const myScore = scores[myId] || 0;
  const urgent = timeLeft <= 5;

  return (
    <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
        <span className="neon-text">Word</span> Scramble
      </h2>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 24 }}>Unscramble the word before time runs out!</p>

      {/* Timer ring */}
      <motion.div animate={urgent ? { scale: [1,1.06,1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}
        style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${urgent ? 'var(--magenta)' : 'var(--cyan)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', flexDirection: 'column' }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: urgent ? 'var(--magenta)' : 'var(--cyan)' }}>{timeLeft}</span>
      </motion.div>

      {/* Scrambled word */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
        {scrambled.split('').map((ch, i) => (
          <motion.div key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
            style={{ width: 44, height: 52, borderRadius: 10, background: 'rgba(0,242,255,0.06)', border: '1px solid rgba(0,242,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--cyan)' }}>
            {ch}
          </motion.div>
        ))}
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ color: flash.color, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            {flash.msg}
          </motion.p>
        )}
      </AnimatePresence>

      {!roundOver && (
        <div style={{ display: 'flex', gap: 10, maxWidth: 340, margin: '0 auto 20px' }}>
          <input className="cyber-input" placeholder="Your answer..."
            value={guess} onChange={e => setGuess(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ letterSpacing: '0.2em', textAlign: 'center' }} />
          <button className="btn-primary" onClick={submit} style={{ whiteSpace: 'nowrap', padding: '12px 20px' }}>→</button>
        </div>
      )}

      {/* Scoreboard */}
      {Object.keys(scores).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {room.players.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: p.id === myId ? 'var(--cyan)' : '#888' }}>{p.name}{p.id === myId ? ' (you)' : ''}</span>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn-primary btn-danger" onClick={onBack} style={{ width: '100%' }}>← Leave</button>
    </div>
  );
}