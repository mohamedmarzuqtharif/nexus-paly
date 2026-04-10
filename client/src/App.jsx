import { useState } from 'react';
import Home from './screens/Home';
import Lobby from './screens/Lobby';
import TicTacToe from './screens/TicTacToe';
import IplAuction from './screens/IplAuction';
import { AnimatePresence, motion } from 'framer-motion';
import MemoryGame from './screens/MemoryGame';
import WordScramble from './screens/WordScramble';
import Bingo from './screens/Bingo';
import Quiz from './screens/Quiz';
import SnakeBattle from './screens/SnakeBattle';

const PAGE = {
  HOME: 'home',
  LOBBY: 'lobby',
  TTT: 'ttt',
  IPL: 'ipl',
  MEMORY: 'memory',
  WORD: 'word',
  BINGO: 'bingo',
  QUIZ: 'quiz',
  SNAKE: 'snake'
};

const slide = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.18 } },
};

export default function App() {
  const [page, setPage] = useState(PAGE.HOME);
  const [roomData, setRoomData] = useState(null);
  const [myId, setMyId] = useState(null);

  const nav = (p, data = null) => {
    if (data) setRoomData(data);
    setPage(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <AnimatePresence mode="wait">

        {page === PAGE.HOME && (
          <motion.div key="home" {...slide} style={{ maxWidth: 440 }}>
            <Home onJoin={(room, id) => { setMyId(id); nav(PAGE.LOBBY, room); }} />
          </motion.div>
        )}

        {page === PAGE.LOBBY && (
          <motion.div key="lobby" {...slide} style={{ maxWidth: 600 }}>
            <Lobby
              room={roomData}
              myId={myId}
              onStartGame={(game, room) => {
                const map = {
                  ttt: PAGE.TTT,
                  ipl: PAGE.IPL,
                  memory: PAGE.MEMORY,
                  word: PAGE.WORD,
                  bingo: PAGE.BINGO,
                  quiz: PAGE.QUIZ,
                  snake: PAGE.SNAKE
                };
                nav(map[game], room);
              }}
            />
          </motion.div>
        )}

        {page === PAGE.TTT && (
          <motion.div key="ttt" {...slide}><TicTacToe room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.IPL && (
          <motion.div key="ipl" {...slide}><IplAuction room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.MEMORY && (
          <motion.div key="memory" {...slide}><MemoryGame room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.WORD && (
          <motion.div key="word" {...slide}><WordScramble room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.BINGO && (
          <motion.div key="bingo" {...slide}><Bingo room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.QUIZ && (
          <motion.div key="quiz" {...slide}><Quiz room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

        {page === PAGE.SNAKE && (
          <motion.div key="snake" {...slide}><SnakeBattle room={roomData} myId={myId} onBack={() => nav(PAGE.HOME)} /></motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}