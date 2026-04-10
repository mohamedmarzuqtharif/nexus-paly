import { useState } from 'react';
import Home from './screens/Home';
import Lobby from './screens/Lobby';
import TicTacToe from './screens/TicTacToe';
import IplAuction from './screens/IplAuction';
import { AnimatePresence, motion } from 'framer-motion';

const PAGE = { HOME: 'home', LOBBY: 'lobby', TTT: 'ttt', IPL: 'ipl' };
const slide = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.18 } },
};

export default function App() {
  const [page, setPage] = useState(PAGE.HOME);
  const [roomData, setRoomData] = useState(null);
  const [myId, setMyId] = useState(null);

  const nav = (p, data = null) => { if (data) setRoomData(data); setPage(p); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <AnimatePresence mode="wait">
        {page === PAGE.HOME && (
          <motion.div key="home" {...slide} style={{ width: '100%', maxWidth: 440 }}>
            <Home onJoin={(room, id) => { setMyId(id); nav(PAGE.LOBBY, room); }} />
          </motion.div>
        )}
        {page === PAGE.LOBBY && (
          <motion.div key="lobby" {...slide} style={{ width: '100%', maxWidth: 600 }}>
            <Lobby room={roomData} myId={myId} onStartGame={(game, room) => nav(game === 'ttt' ? PAGE.TTT : PAGE.IPL, room)} />
          </motion.div>
        )}
        {page === PAGE.TTT && (
          <motion.div key="ttt" {...slide} style={{ width: '100%', maxWidth: 520 }}>
            <TicTacToe room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} />
          </motion.div>
        )}
        {page === PAGE.IPL && (
          <motion.div key="ipl" {...slide} style={{ width: '100%', maxWidth: 700 }}>
            <IplAuction room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}