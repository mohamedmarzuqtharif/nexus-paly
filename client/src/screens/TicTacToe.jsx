import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

export default function TicTacToe({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const [board, setBoard] = useState(room.gameState?.board || Array(9).fill(null));
  const [turn, setTurn] = useState(room.gameState?.turn);
  const [winner, setWinner] = useState(null);

  const mySymbol = room.players.findIndex(p => p.id === myId) === 0 ? 'X' : 'O';
  const isMyTurn = turn === myId;

  useEffect(() => {
    const off = on('tttUpdate', ({ board: b, turn: t, winner: w }) => {
      setBoard(b); setTurn(t); setWinner(w);
    });
    return off;
  }, []);

  const move = (i) => {
    if (!isMyTurn || board[i] || winner) return;
    emit('tttMove', { code: room.code, index: i });
  };

  const reset = () => { setBoard(Array(9).fill(null)); setTurn(room.players[0].id); setWinner(null); };

  return (
    <div className="glass" style={{ padding: '36px 32px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        <span className="neon-text">Tic</span>-Tac-<span className="neon-magenta">Toe</span>
      </h2>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p key={winner || (isMyTurn ? 'myturn' : 'wait')}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ fontSize: 14, color: winner ? 'var(--cyan)' : isMyTurn ? '#fff' : '#555', marginBottom: 28, minHeight: 20 }}>
          {winner === 'draw' ? "It's a draw!" : winner ? `${winner} wins!` : isMyTurn ? `Your turn — you are ${mySymbol}` : 'Waiting for opponent...'}
        </motion.p>
      </AnimatePresence>

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 280, margin: '0 auto 28px' }}>
        {board.map((cell, i) => (
          <motion.button key={i} onClick={() => move(i)}
            whileHover={!cell && isMyTurn ? { scale: 1.05 } : {}}
            whileTap={!cell && isMyTurn ? { scale: 0.95 } : {}}
            style={{
              height: 84, borderRadius: 12,
              background: cell ? (cell === 'X' ? 'rgba(0,242,255,0.08)' : 'rgba(255,0,255,0.08)') : 'rgba(255,255,255,0.03)',
              border: `1px solid ${cell === 'X' ? 'rgba(0,242,255,0.4)' : cell === 'O' ? 'rgba(255,0,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              cursor: !cell && isMyTurn && !winner ? 'pointer' : 'default',
              fontSize: 36, fontWeight: 800, color: cell === 'X' ? 'var(--cyan)' : 'var(--magenta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <AnimatePresence>
              {cell && (
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                  {cell}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {winner && <button className="btn-primary" onClick={reset}>Play Again</button>}
        <button className="btn-primary btn-danger" onClick={onBack}>← Leave</button>
      </div>
    </div>
  );
}