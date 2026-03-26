import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const SPEED = 100;

const TRACKS = [
  {
    id: 1,
    title: "ERR_0x01: CORRUPT_SECTOR",
    artist: "SYS.ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/200/200?grayscale"
  },
  {
    id: 2,
    title: "MEM_LEAK_DETECTED",
    artist: "NULL_PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/200/200?grayscale"
  },
  {
    id: 3,
    title: "BUFFER_OVERFLOW",
    artist: "0xDEADBEEF",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch3/200/200?grayscale"
  }
];

type Point = { x: number; y: number };

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Music State
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Refs for Game Loop
  const snakeRef = useRef(snake);
  const dirRef = useRef(dir);
  const lastProcessedDirRef = useRef(dir);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const gameStartedRef = useRef(gameStarted);
  const scoreRef = useRef(score);
  const highScoreRef = useRef(highScore);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 0, y: -1 });
    lastProcessedDirRef.current = { x: 0, y: -1 };
    setFood(generateFood([{ x: 10, y: 10 }]));
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current) return;

    const currentSnake = snakeRef.current;
    const currentDir = dirRef.current;
    lastProcessedDirRef.current = currentDir;
    
    const head = currentSnake[0];
    const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Self collision
    if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...currentSnake];

    // Food collision
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      const newScore = scoreRef.current + 1;
      setScore(newScore);
      if (newScore > highScoreRef.current) {
        setHighScore(newScore);
      }
      setFood(generateFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (gameOverRef.current || !gameStartedRef.current)) {
        resetGame();
        return;
      }

      const currentDir = lastProcessedDirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDir({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDir({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDir({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDir({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(moveSnake, SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Music Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIdx]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  const currentTrack = TRACKS[currentTrackIdx];

  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-sans flex flex-col items-center justify-between relative selection:bg-[#ff00ff] selection:text-black">
      <div className="bg-static"></div>
      <div className="scanlines"></div>

      {/* Header */}
      <header className="w-full p-6 flex flex-col md:flex-row justify-between items-start md:items-center z-10 max-w-5xl mx-auto border-b-4 border-[#ff00ff] tear">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-4xl font-mono font-bold text-[#00ffff] glitch" data-text="SYS.OP_SNAKE_v1.0">
            SYS.OP_SNAKE_v1.0
          </h1>
          <p className="text-[#ff00ff] text-xl mt-2 bg-black inline-block px-2 border border-[#ff00ff]">
            STATUS: ONLINE // AWAITING_CMD
          </p>
        </div>
        <div className="flex gap-8 text-right bg-black p-4 border-2 border-[#00ffff]">
          <div className="flex flex-col items-end">
            <span className="text-lg text-[#ff00ff]">DATA_FRAGS</span>
            <span className="text-4xl font-mono">
              {score.toString().padStart(4, '0')}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg text-[#ff00ff]">MAX_FRAGS</span>
            <span className="text-4xl font-mono">
              {highScore.toString().padStart(4, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 flex items-center justify-center z-10 w-full px-4 my-8">
        <div className="relative p-2 bg-black border-4 border-[#00ffff] shadow-[8px_8px_0px_#ff00ff] tear">
          <div
            className="bg-black relative"
            style={{
              width: GRID_SIZE * 20,
              height: GRID_SIZE * 20,
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff33_1px,transparent_1px),linear-gradient(to_bottom,#00ffff33_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {snake.map((segment, i) => {
              const isHead = i === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${i}`}
                  className={`${
                    isHead
                      ? 'bg-[#ff00ff] z-10'
                      : 'bg-[#00ffff]'
                  }`}
                  style={{
                    gridColumnStart: segment.x + 1,
                    gridRowStart: segment.y + 1,
                    border: '1px solid #000',
                  }}
                />
              );
            })}

            <div
              className="bg-[#ff00ff] animate-pulse"
              style={{
                gridColumnStart: food.x + 1,
                gridRowStart: food.y + 1,
                border: '2px solid #00ffff'
              }}
            />

            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-2 border-[#ff00ff] m-4">
                <h2 className="text-[#ff00ff] text-3xl font-mono mb-6 glitch" data-text="INITIALIZE">INITIALIZE</h2>
                <button
                  onClick={resetGame}
                  className="px-6 py-4 bg-black border-4 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-none text-2xl font-mono cursor-pointer shadow-[4px_4px_0px_#ff00ff] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  [ EXECUTE ]
                </button>
                <p className="mt-8 text-xl text-center px-4">INPUT: ARROWS / WASD<br/>ACTION: SPACEBAR</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-2 border-[#ff00ff] m-4">
                <h2 className="text-[#ff00ff] text-3xl font-mono mb-4 glitch" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                <p className="text-2xl mb-8">FRAGMENTS: {score}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-4 bg-black border-4 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-none text-2xl font-mono cursor-pointer shadow-[4px_4px_0px_#00ffff] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  [ REBOOT ]
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Music Player */}
      <footer className="w-full bg-black border-t-4 border-[#00ffff] p-6 z-10 tear">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-1/3 border-2 border-[#ff00ff] p-2 bg-black">
            <div className="relative w-16 h-16 border-2 border-[#00ffff] overflow-hidden">
              <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover filter contrast-150 grayscale" />
              {isPlaying && (
                <div className="absolute inset-0 bg-[#ff00ff]/30 mix-blend-screen"></div>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[#00ffff] text-xl truncate font-mono">
                {currentTrack.title}
              </span>
              <span className="text-[#ff00ff] text-lg truncate">
                SRC: {currentTrack.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-1/3 justify-center">
            <button
              onClick={prevTrack}
              className="px-4 py-2 bg-black border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-mono text-xl cursor-pointer"
            >
              &lt;&lt;
            </button>
            <button
              onClick={togglePlay}
              className="px-6 py-2 bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black font-mono text-xl cursor-pointer w-32 flex justify-center"
            >
              {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
            </button>
            <button
              onClick={nextTrack}
              className="px-4 py-2 bg-black border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-mono text-xl cursor-pointer"
            >
              &gt;&gt;
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-1/3 justify-end border-2 border-[#00ffff] p-4 bg-black">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-[#ff00ff] hover:text-[#00ffff] text-xl font-mono cursor-pointer"
            >
              {isMuted || volume === 0 ? 'VOL:MUTE' : 'VOL:LVL'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-32"
            />
          </div>
        </div>
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onEnded={handleTrackEnd}
          className="hidden"
        />
      </footer>
    </div>
  );
}
