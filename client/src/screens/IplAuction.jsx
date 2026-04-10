import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import PlayerCard from '../components/PlayerCard';

const BID_STEPS = [500000, 1000000, 2000000, 5000000]; // 5L, 10L, 20L, 50L

export default function IplAuction({ room, myId, onBack }) {
  const { emit, on } = useSocket();
  const [state, setState] = useState(room.gameState);
  const [timeLeft, setTimeLeft] = useState(10);
  const [toast, setToast] = useState(null);
  const [ended, setEnded] = useState(null);
  const toastRef = useRef(null);

  useEffect(() => {
    const handlers = [
      on('bidUpdate',    (s) => { setState(s); setTimeLeft(s.timeLeft); }),
      on('timerTick',    ({ timeLeft: t }) => setTimeLeft(t)),
      on('nextPlayer',   (s) => { setState(s); setTimeLeft(s.timeLeft); showToast('🔨 SOLD! Next player up...', 'cyan'); }),
      on('playerSold',   ({ player, soldTo, price }) => showToast(`🎉 ${player.name} → ${soldTo.name} for ₹${(price/1e7).toFixed(2)} Cr`, 'green')),
      on('playerUnsold', ({ player }) => showToast(`❌ ${player.name} — UNSOLD`, 'magenta')),
      on('auctionEnded', (data) => setEnded(data)),
    ];
    return () => handlers.forEach(off => off());
  }, []);

  const showToast = (msg, color) => {
    clearTimeout(toastRef.current);
    setToast({ msg, color });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  };

  const placeBid = (increment) => {
    const newBid = (state.currentBid || 0) + increment;
    emit('placeBid', { code: room.code, amount: newBid });
  };

  const myBudget = state?.budgets?.[myId] || 0;
  const canAfford = (inc) => myBudget >= (state?.currentBid || 0) + inc;

  if (ended) return (
    <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
      <h2 className="neon-text" style={{ fontSize: 28, marginBottom: 24 }}>🏆 Auction Complete</h2>
      {ended.sold.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
          <span style={{ color: '#ccc' }}>{s.player.name}</span>
          <span style={{ color: 'var(--cyan)' }}>{s.soldTo.name} · ₹{(s.price/1e7).toFixed(2)} Cr</span>
        </div>
      ))}
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={onBack}>Back to Home</button>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
              background: 'rgba(5,5,5,0.95)', border: `1px solid ${toast.color === 'magenta' ? 'var(--magenta)' : 'var(--cyan)'}`,
              borderRadius: 12, padding: '12px 24px', fontSize: 14, color: '#fff', whiteSpace: 'nowrap' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Card */}
      <PlayerCard player={state?.currentPlayer} currentBid={state?.currentBid} highBidder={state?.highBidder} timeLeft={timeLeft} />

      {/* My Budget */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', marginTop: 12, fontSize: 13 }}>
        <span style={{ color: '#555' }}>Your budget</span>
        <span className="neon-text" style={{ fontWeight: 700 }}>₹{(myBudget/1e7).toFixed(2)} Cr</span>
      </div>

      {/* Bid buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
        {BID_STEPS.map(step => (
          <motion.button key={step}
            whileTap={{ scale: 0.93 }}
            // Spring animation on new bid placed
            whileHover={{ boxShadow: '0 0 16px rgba(0,242,255,0.3)' }}
            className="btn-primary"
            disabled={!canAfford(step)}
            onClick={() => placeBid(step)}
            style={{ padding: '10px 0', fontSize: 13 }}>
            +{step >= 1e7 ? (step/1e7)+'Cr' : (step/1e5)+'L'}
          </motion.button>
        ))}
      </div>

      {/* Sold list summary */}
      {state?.sold?.length > 0 && (
        <div style={{ marginTop: 16, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, fontSize: 12 }}>
          <p style={{ color: '#555', marginBottom: 8 }}>SOLD PLAYERS</p>
          {state.sold.slice(-3).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '4px 0' }}>
              <span>{s.player.name}</span>
              <span style={{ color: 'var(--cyan)' }}>₹{(s.price/1e7).toFixed(2)} Cr → {s.soldTo.name}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn-primary btn-danger" onClick={onBack} style={{ width: '100%', marginTop: 16, fontSize: 13 }}>← Leave Auction</button>
    </div>
  );
}