import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

const CELL = 22;
const GRID = 20;

export default function SnakeBattle({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const canvasRef = useRef(null);
  const [ended, setEnded] = useState(null);
  const [mySnake, setMySnake] = useState(null);

  useEffect(() => {
    const offs = [
      on('snakeTick', ({ snakes, food }) => {
        setMySnake(snakes.find(s => s.id === myId));
        drawFrame(snakes, food);
      }),
      on('snakeEnd', (data) => setEnded(data)),
    ];

    const handleKey = (e) => {
      const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'];
      if (keys.includes(e.key)) {
        e.preventDefault();
        emit('snakeDir', { code: room.code, key: e.key });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { offs.forEach(f => f()); window.removeEventListener('keydown', handleKey); };
  }, []);

  const drawFrame = (snakes, food) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);

    // Grid dots
    ctx.fillStyle = '#111';
    for (let x = 0; x < GRID; x++) for (let y = 0; y < GRID; y++) {
      ctx.fillRect(x * CELL + CELL/2 - 1, y * CELL + CELL/2 - 1, 2, 2);
    }

    // Food
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL/2, food.y * CELL + CELL/2, CELL/2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snakes
    snakes.forEach(snake => {
      if (!snake.alive) return;
      ctx.fillStyle = snake.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = snake.color;
      snake.body.forEach((seg, i) => {
        const r = i === 0 ? 5 : 3;
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.3, 1 - i * 0.05);
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, r);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  };

  return (
    <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}><span className="neon-text">Snake</span> Battle</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {room.players.map((p, i) => {
            const colors = ['#00f2ff','#ff00ff','#fbbf24','#34d399'];
            return (
              <span key={p.id} style={{ fontSize: 12, color: colors[i] }}>
                ● {p.name}
              </span>
            );
          })}
        </div>
      </div>

      <p style={{ color: '#555', fontSize: 12, marginBottom: 14 }}>Arrow keys or WASD to move</p>

      <div style={{ display: 'inline-block', border: '1px solid rgba(0,242,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} style={{ display: 'block' }} />
      </div>

      {!ended && mySnake && !mySnake.alive && (
        <p className="neon-magenta" style={{ marginTop: 14, fontWeight: 700 }}>💀 You died! Watching...</p>
      )}

      {ended && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 18 }}>
          <p className="neon-text" style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            {ended.winner ? `🏆 ${ended.winner.name} wins!` : '🤝 Draw!'}
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
            {ended.scores.map(s => (
              <span key={s.name} style={{ fontSize: 13, color: '#888' }}>{s.name}: {s.score} 🍎</span>
            ))}
          </div>
          <button className="btn-primary" onClick={onBack}>Back to Home</button>
        </motion.div>
      )}

      {!ended && <button className="btn-primary btn-danger" onClick={onBack} style={{ marginTop: 16, width: '100%' }}>← Leave</button>}
    </div>
  );
}