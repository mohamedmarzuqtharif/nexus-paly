import { motion } from 'framer-motion';

const ROLE_COLOR = {
  'Opener': 'var(--cyan)',
  'Middle Order': '#a78bfa',
  'Pacer': 'var(--magenta)',
  'All-Rounder': '#fbbf24',
  'Spinner': '#34d399',
};

export default function PlayerCard({ player, currentBid, highBidder, timeLeft }) {
  if (!player) return null;
  const color = ROLE_COLOR[player.role] || 'var(--cyan)';
  const urgent = timeLeft <= 3;

  return (
    <motion.div className="glass"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>

      {/* Glow accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.8 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 4 }}>ON AUCTION</p>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{player.name}</h2>
          <span style={{ fontSize: 12, color: color, border: `1px solid ${color}33`, padding: '3px 10px', borderRadius: 20, marginTop: 6, display: 'inline-block' }}>
            {player.role} · {player.team}
          </span>
        </div>

        {/* Timer */}
        <motion.div
          animate={urgent ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.6 }}
          style={{ textAlign: 'center', width: 64, height: 64, borderRadius: '50%', border: `2px solid ${urgent ? 'var(--magenta)' : 'rgba(0,242,255,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: urgent ? 'var(--magenta)' : 'var(--cyan)' }}>{timeLeft}</span>
          <span style={{ fontSize: 9, color: '#555' }}>SEC</span>
        </motion.div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {Object.entries(player.stats).map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color }}>{v}</p>
            <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', marginTop: 2 }}>{k}</p>
          </div>
        ))}
      </div>

      {/* Current bid */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>CURRENT BID</p>
        <motion.p key={currentBid} initial={{ scale: 1.2, color: '#fff' }} animate={{ scale: 1, color: 'var(--cyan)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          style={{ fontSize: 32, fontWeight: 900 }}>
          ₹{(currentBid / 1e7).toFixed(2)} Cr
        </motion.p>
        {highBidder && <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>🏆 {highBidder.name}</p>}
        {!highBidder && <p style={{ fontSize: 13, color: '#444', marginTop: 4 }}>No bids yet</p>}
      </div>
    </motion.div>
  );
}