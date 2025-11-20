
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SET } from '../constants';
import { Term } from '../types';
import { X, Rocket, Play, Trophy, Settings, Volume2 } from 'lucide-react';

interface Asteroid {
  id: string;
  term: Term;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  speed: number;
  text: string; // The displayed text (term or definition)
  answer: string; // The expected input
}

export const BlastMode: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  
  // Game Loop Refs
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Game
  const startGame = () => {
    setStatus('playing');
    setAsteroids([]);
    setScore(0);
    setLives(5); // Quizlet usually gives a few lives (planets passing by)
    setLevel(1);
    setInputValue('');
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnAsteroid = () => {
    const randomTerm = MOCK_SET.terms[Math.floor(Math.random() * MOCK_SET.terms.length)];
    
    // Avoid duplicates on screen if possible
    if (asteroids.some(a => a.term.id === randomTerm.id)) return;

    // Determine displayed text vs answer (Term vs Definition)
    // For this mock, we show Term, type Definition (or Pinyin)
    const showTerm = Math.random() > 0.5; 
    
    const newAsteroid: Asteroid = {
      id: Date.now().toString() + Math.random(),
      term: randomTerm,
      x: 10 + Math.random() * 80, // Keep within 10-90% width
      y: -10, // Start slightly above screen
      speed: 5 + (level * 1.5), // Speed increases with level
      text: randomTerm.term, 
      answer: randomTerm.definition // User types definition/pinyin
    };

    setAsteroids(prev => [...prev, newAsteroid]);
  };

  const gameLoop = (time: number) => {
    if (status !== 'playing') return;

    const deltaTime = time - (lastTimeRef.current || time);
    lastTimeRef.current = time;

    // 1. Spawn Logic
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > (3000 / Math.sqrt(level))) { // Spawn faster as level increases
        spawnAsteroid();
        spawnTimerRef.current = 0;
    }

    // 2. Update Positions
    setAsteroids(prevAsteroids => {
        const nextAsteroids: Asteroid[] = [];
        let livesLost = 0;

        prevAsteroids.forEach(asteroid => {
            const nextY = asteroid.y + (asteroid.speed * deltaTime * 0.001);
            
            if (nextY > 100) {
                // Asteroid hit the bottom (planet)
                livesLost++;
            } else {
                nextAsteroids.push({ ...asteroid, y: nextY });
            }
        });

        if (livesLost > 0) {
            setLives(prev => {
                const newLives = prev - livesLost;
                if (newLives <= 0) {
                    setStatus('gameover');
                }
                return newLives;
            });
        }

        return nextAsteroids;
    });

    if (status === 'playing') {
        requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    if (status === 'gameover') {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [status]);

  // Cleanup
  useEffect(() => {
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);

      // Check matches
      const matchedAsteroid = asteroids.find(a => a.answer.toLowerCase() === val.toLowerCase().trim());
      
      if (matchedAsteroid) {
          // Destroy asteroid
          setAsteroids(prev => prev.filter(a => a.id !== matchedAsteroid.id));
          setInputValue(''); // Clear input
          setScore(prev => prev + 100);
          
          // Level up every 5 terms
          if ((score + 100) % 500 === 0) {
              setLevel(prev => prev + 1);
          }
      }
  };

  return (
    <div className="min-h-screen bg-[#0a092d] text-white overflow-hidden flex flex-col relative font-sans">
      
      {/* Starfield Background Effect (Static for now) */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '50px 50px, 100px 100px',
          backgroundPosition: '0 0, 25px 25px'
      }}></div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(`/set/${id}`)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-300" />
             </button>
             {status === 'playing' && (
                 <div className="flex flex-col">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">得分</span>
                     <span className="font-mono text-xl font-bold">{score}</span>
                 </div>
             )}
          </div>

          {status === 'playing' && (
             <div className="flex items-center gap-1">
                 {Array.from({length: 5}).map((_, i) => (
                     <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                 ))}
             </div>
          )}

          <div className="flex gap-2">
             <button className="p-2 hover:bg-white/10 rounded-full text-gray-300">
                 <Volume2 className="w-5 h-5" />
             </button>
             <button className="p-2 hover:bg-white/10 rounded-full text-gray-300">
                 <Settings className="w-5 h-5" />
             </button>
          </div>
      </div>

      {/* Intro Screen */}
      {status === 'intro' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a092d]/90 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
              <div className="w-32 h-32 bg-emerald-400/20 rounded-full flex items-center justify-center mb-8 ring-4 ring-emerald-400/30 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
                  <Rocket className="w-16 h-16 text-emerald-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">玩 Blast 游戏!</h1>
              <p className="text-gray-300 text-lg mb-10 max-w-md text-center leading-relaxed">
                  将定义与正确的术语对应起来。在时间耗尽前用飞船将其炸裂！
              </p>
              <button 
                onClick={startGame}
                className="px-12 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-xl rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
              >
                玩游戏
              </button>
              <button className="mt-6 text-primary font-bold hover:text-indigo-300 transition-colors">
                  如何玩 Blast 游戏
              </button>
          </div>
      )}

      {/* Game Over Screen */}
      {status === 'gameover' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a092d]/95 animate-in fade-in duration-500">
              <Trophy className="w-20 h-20 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h2 className="text-3xl font-bold text-white mb-2">游戏结束</h2>
              <div className="text-6xl font-black text-primary mb-8">{score}</div>
              <div className="flex gap-4">
                  <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-all"
                  >
                    再玩一次
                  </button>
                  <button 
                    onClick={() => navigate(`/set/${id}`)}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                  >
                    退出
                  </button>
              </div>
          </div>
      )}

      {/* Game Area */}
      {status === 'playing' && (
          <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair">
              {/* Asteroids */}
              {asteroids.map(asteroid => (
                  <div 
                    key={asteroid.id}
                    className="absolute transform -translate-x-1/2 transition-transform will-change-transform"
                    style={{ 
                        left: `${asteroid.x}%`, 
                        top: `${asteroid.y}%`,
                    }}
                  >
                      <div className="relative group">
                          {/* Planet Visual */}
                          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-800/80 backdrop-blur-md border-2 border-slate-600/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(71,85,105,0.3)] group-hover:border-red-400/50 transition-colors">
                             {/* Craters */}
                             <div className="absolute top-3 left-6 w-4 h-4 bg-slate-900/30 rounded-full"></div>
                             <div className="absolute bottom-6 right-8 w-6 h-6 bg-slate-900/30 rounded-full"></div>
                             
                             <div className="text-center px-2 z-10">
                                <div className="text-xl md:text-2xl font-bold text-white drop-shadow-md">{asteroid.text}</div>
                             </div>
                          </div>
                      </div>
                  </div>
              ))}

              {/* Ship / Input Area */}
              <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-end bg-gradient-to-t from-[#0a092d] to-transparent h-48">
                   <div className="relative w-full max-w-md mx-auto">
                       {/* Spaceship Graphic */}
                       <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
                            <div className="w-16 h-16 bg-emerald-400 rounded-full border-4 border-emerald-600 relative flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                                 <div className="w-10 h-10 bg-pink-300 rounded-full overflow-hidden relative">
                                    {/* Rabbit Face Mock */}
                                    <div className="absolute top-2 left-2 w-1 h-1 bg-black rounded-full"></div>
                                    <div className="absolute top-2 right-2 w-1 h-1 bg-black rounded-full"></div>
                                    <div className="absolute top-4 left-3 w-4 h-2 bg-red-400 rounded-full opacity-50"></div>
                                 </div>
                                 {/* Ship Wings */}
                                 <div className="absolute top-6 -left-4 w-4 h-8 bg-emerald-600 rounded-l-full"></div>
                                 <div className="absolute top-6 -right-4 w-4 h-8 bg-emerald-600 rounded-r-full"></div>
                            </div>
                       </div>

                       {/* Input Field */}
                       <div className="relative">
                           <input 
                                type="text" 
                                value={inputValue}
                                onChange={handleInputChange}
                                autoFocus
                                className="w-full bg-slate-800/90 border-2 border-slate-600 text-white text-center text-lg py-3 px-6 rounded-full outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(66,85,255,0.4)] transition-all placeholder-slate-500"
                                placeholder="输入对应的术语..."
                           />
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                               {level < 10 ? `0${level}` : level}
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};
    