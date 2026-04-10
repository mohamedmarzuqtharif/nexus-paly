import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

const HEADER = ['B','I','N','G','O'];

export default function Bingo({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const [card, setCard] = useState([]);
  const [called, setCalled] = useState([]);
  const [lastCalled, setLastCalled] = useState(null);
  const [winner, setWinner] = useState(null);
  const [falseAlert, setFalseAlert] = useState('');

  useEffect(() => {
    const offs = [
      on('bingoCard',       ({ card: c }) => setCard(c)),
      on('bingoCardUpdate', ({ card: c }) => setCard(c)),
      on('bingoCalled',     ({ num, called: c }) => { setCalled(c); setLastCalled(num); }),
      on('bingoWin',        ({ winner: w }) => setWinner(w)),
      on('bingoFalse',      ({ msg }) => { setFalseAlert(msg); setTimeout(() => setFalseAlert(''), 2000); }),
    ];
    return () => offs.forEach(f => f());
  }, []);

  const mark = (num) => {
    if (called.includes(num)) emit('bingoMark', { code: room.code, num });
  };

  const claim = () => emit('bingoClaim', { code: room.code });

  return (
    <div className="glass" style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          <span className="neon-text">Number</span> Bingo
        </h2>
        <AnimatePresence>
          {lastCalled && (
            <motion.div key={lastCalled}
              initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,242,255,0.12)', border: '2px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'var(--cyan)' }}>
              {lastCalled}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {winner ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
          style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 40 }}>🏆</p>
          <p className="neon-text" style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>{winner} wins!</p>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: 20 }}>Back to Home</button>
        </motion.div>
      ) : (
        <>
          {/* Bingo Card */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 6 }}>
              {HEADER.map(h => (
                <div key={h} style={{ textAlign: 'center', fontWeight: 900, fontSize: 16, color: 'var(--cyan)', padding: '4px 0' }}>{h}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {card.map((cell, i) => {
                const isCallable = called.includes(cell.n) && !cell.marked && i !== 12;
                const isFree = i === 12;
                return (
                  <motion.div key={i}
                    onClick={() => isCallable && mark(cell.n)}
                    whileTap={isCallable ? { scale: 0.9 } : {}}
                    style={{
                      height: 52, borderRadius: 10, fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCallable ? 'pointer' : 'default',
                      background: cell.marked || isFree ? 'rgba(0,242,255,0.15)' : called.includes(cell.n) ? 'rgba(0,242,255,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${cell.marked || isFree ? 'var(--cyan)' : called.includes(cell.n) ? 'rgba(0,242,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: cell.marked || isFree ? 'var(--cyan)' : called.includes(cell.n) ? '#ccc' : '#444',
                    }}>
                    {isFree ? 'FREE' : cell.n}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {falseAlert && <p className="neon-magenta" style={{ textAlign: 'center', marginBottom: 10, fontSize: 13 }}>{falseAlert}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: 16, fontWeight: 900 }} onClick={claim}>
              BINGO! 🎉
            </button>
            <button className="btn-primary btn-danger" onClick={onBack} style={{ flex: 1 }}>← Leave</button>
          </div>

          {called.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 11, color: '#444', lineHeight: 1.8 }}>
              Called: {called.slice(-10).join(' · ')}...
            </div>
          )}
        </>
      )}
    </div>
  );
}