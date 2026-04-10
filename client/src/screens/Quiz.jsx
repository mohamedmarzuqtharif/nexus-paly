import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function Quiz({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [qIndex, setQIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [scores, setScores] = useState({});
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null); // {correct, pts}
  const [reveal, setReveal] = useState(null); // correct answer index
  const [ended, setEnded] = useState(null);

  useEffect(() => {
    const offs = [
      on('quizQuestion', ({ q, options: o, qIndex: qi, total: t, timeLeft: tl }) => {
        setQuestion(q); setOptions(o); setQIndex(qi); setTotal(t);
        setTimeLeft(tl); setSelected(null); setResult(null); setReveal(null);
      }),
      on('quizTick',    ({ timeLeft: t }) => setTimeLeft(t)),
      on('quizResult',  (r) => setResult(r)),
      on('quizScores',  ({ scores: s }) => setScores(s)),
      on('quizReveal',  ({ ans, scores: s }) => { setReveal(ans); setScores(s); }),
      on('quizEnd',     ({ scores: s }) => setEnded(s)),
    ];
    return () => offs.forEach(f => f());
  }, []);

  const answer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    emit('quizAnswer', { code: room.code, ansIndex: i });
  };

  const urgent = timeLeft <= 5;
  const sortedScores = room.players.map(p => ({ ...p, score: scores[p.id] || 0 })).sort((a,b) => b.score - a.score);

  if (ended) return (
    <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        <span className="neon-text">Final</span> Leaderboard
      </h2>
      {sortedScores.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 20 }}>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
          <span style={{ flex: 1, color: p.id === myId ? 'var(--cyan)' : '#ccc', fontSize: 15 }}>{p.name}</span>
          <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{p.score} pts</span>
        </motion.div>
      ))}
      <button className="btn-primary" onClick={onBack} style={{ marginTop: 24 }}>Back to Home</button>
    </div>
  );

  return (
    <div className="glass" style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}><span className="neon-text">Rapid</span> Fire Quiz</h2>
          <p style={{ color: '#555', fontSize: 12 }}>Q {qIndex + 1} / {total}</p>
        </div>
        <motion.div animate={urgent ? { scale: [1,1.08,1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${urgent ? 'var(--magenta)' : 'var(--cyan)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: urgent ? 'var(--magenta)' : 'var(--cyan)' }}>{timeLeft}</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 20 }}>
        <motion.div animate={{ width: `${(timeLeft/15)*100}%` }} transition={{ duration: 0.9 }}
          style={{ height: '100%', background: urgent ? 'var(--magenta)' : 'var(--cyan)', borderRadius: 4 }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.p key={question} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 20, lineHeight: 1.5, minHeight: 52 }}>
          {question}
        </motion.p>
      </AnimatePresence>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = reveal !== null && i === reveal;
          const isWrong = selected === i && reveal !== null && i !== reveal;
          return (
            <motion.button key={i}
              onClick={() => answer(i)}
              whileTap={selected === null ? { scale: 0.96 } : {}}
              style={{
                padding: '14px 12px', borderRadius: 12, border: `1px solid ${isCorrect ? '#34d399' : isWrong ? 'var(--magenta)' : isSelected ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
                background: isCorrect ? 'rgba(52,211,153,0.12)' : isWrong ? 'rgba(255,0,255,0.1)' : isSelected ? 'rgba(0,242,255,0.1)' : 'rgba(255,255,255,0.03)',
                color: isCorrect ? '#34d399' : isWrong ? 'var(--magenta)' : '#ccc',
                fontSize: 13, fontWeight: 500, cursor: selected !== null ? 'default' : 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
              }}>
              <span style={{ color: 'var(--cyan)', marginRight: 8, fontWeight: 700 }}>{['A','B','C','D'][i]}.</span>
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Result flash */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '10px 0', marginBottom: 8 }}>
            {result.correct
              ? <p style={{ color: '#34d399', fontWeight: 700 }}>✅ Correct! +{result.pts} pts</p>
              : <p style={{ color: 'var(--magenta)', fontWeight: 700 }}>❌ Wrong!</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live leaderboard */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
        {sortedScores.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
            <span style={{ color: p.id === myId ? 'var(--cyan)' : '#666' }}>{i+1}. {p.name}</span>
            <span style={{ color: 'var(--cyan)' }}>{p.score}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary btn-danger" onClick={onBack} style={{ width: '100%', marginTop: 14, fontSize: 13 }}>← Leave</button>
    </div>
  );
}