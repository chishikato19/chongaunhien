
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Student, PresentationMode } from '../types';
import canvasConfetti from 'canvas-confetti';
import { playTick, playWin } from '../services/sound';
import { X } from 'lucide-react';

interface VisualizerProps {
  candidates: Student[];
  winner: Student;
  mode: PresentationMode;
  duration: number; // seconds
  onComplete: () => void;
}

// --- Helper: Confetti ---
const fireConfetti = () => {
  try {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };
    
      function fire(particleRatio: number, opts: any) {
        canvasConfetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }
    
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
  } catch (e) {
      console.warn("Confetti error", e);
  }
};

// --- 1. Simple Mode ---
const SimpleVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
  const [currentName, setCurrentName] = useState(candidates[0]?.name || '?');
  
  useEffect(() => {
    let interval: any;
    let counter = 0;
    const speed = 100;
    const totalTime = duration * 1000;
    
    interval = setInterval(() => {
      setCurrentName(candidates[counter % candidates.length].name);
      counter++;
      playTick();
    }, speed);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setCurrentName(winner.name);
      playWin();
      fireConfetti();
      onComplete();
    }, totalTime);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <h2 className="text-4xl font-bold mb-8 text-gray-400 animate-pulse uppercase tracking-widest">Đang chọn...</h2>
      <div className="text-7xl md:text-9xl font-black text-indigo-600 drop-shadow-2xl text-center p-12 bg-white rounded-3xl shadow-2xl border-8 border-indigo-100 max-w-[90vw] break-words">
        {currentName}
      </div>
    </div>
  );
};

// --- 2. Wheel of Fortune ---
const WheelVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [currentSelected, setCurrentSelected] = useState("...");
  
  const displayList = [...candidates];
  if (!displayList.find(s => s.id === winner.id)) displayList.push(winner);
  
  const winnerIndex = displayList.findIndex(s => s.id === winner.id);
  const segmentAngle = 360 / displayList.length;

  useEffect(() => {
    const startTime = performance.now();
    const totalDuration = duration * 1000;
    
    const finalRotation = (360 * 8) + (360 - (winnerIndex * segmentAngle));

    let frameId: number;

    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        const ease = 1 - Math.pow(1 - progress, 4);
        
        const currentRot = finalRotation * ease;
        setRotation(currentRot);

        const normalizedRot = currentRot % 360;
        let indexAtPointer = Math.floor((360 - normalizedRot) / segmentAngle) % displayList.length;
        if (indexAtPointer < 0) indexAtPointer += displayList.length;
        
        setCurrentSelected(displayList[indexAtPointer].name);

        if (progress < 1) {
             if (Math.floor(elapsed / 50) % 2 === 0 && progress < 0.95) playTick(); 
             frameId = requestAnimationFrame(animate);
        } else {
             setCurrentSelected(winner.name); 
             playWin();
             fireConfetti();
             onComplete();
        }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Responsive font size calculation
  const fontSize = displayList.length > 30 ? '0.7rem' : displayList.length > 20 ? '1rem' : '1.5rem';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden relative p-4">
        <div className="absolute top-8 bg-white/90 backdrop-blur px-8 py-3 rounded-2xl shadow-xl border-4 border-indigo-100 z-30 min-w-[300px] text-center">
             <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Đang kim chỉ</div>
             <div className="text-4xl font-black text-indigo-700 truncate max-w-md mx-auto">{currentSelected}</div>
        </div>

        <div className="relative mt-16 flex-grow flex items-center justify-center">
            {/* Pointer */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-red-600 drop-shadow-2xl filter"></div>
            </div>
            
            {/* Wheel Container - Responsive Size */}
            <div 
                ref={canvasRef}
                className="relative rounded-full border-[12px] border-gray-800 shadow-2xl bg-white overflow-hidden"
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    width: 'min(85vw, 85vh)',
                    height: 'min(85vw, 85vh)',
                }}
            >
                {displayList.map((student, index) => {
                    const angle = segmentAngle * index;
                    return (
                        <div
                            key={student.id}
                            className="absolute w-full h-full left-0 top-0 text-center origin-center"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <div className="pt-8 font-bold truncate px-4" style={{ color: `hsl(${index * (360 / displayList.length)}, 70%, 50%)`, fontSize: fontSize}}>
                                <span className="mr-1">{student.avatar}</span> {displayList.length < 50 ? student.name.split(' ')[0] : ''}
                            </div>
                            <div className="absolute top-[50%] left-1/2 w-[1px] h-1/2 bg-gray-200 -translate-x-1/2 origin-top -z-10" />
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};

// --- 3. Race Mode (Chaotic & Fun Update) ---
interface Racer {
    student: Student;
    progress: number;
    velocity: number;
}

const RaceVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [racers, setRacers] = useState<Racer[]>([]);
    const [finished, setFinished] = useState(false);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    
    const displayCandidates = useRef<Student[]>([]);

    useEffect(() => {
        // Initialization
        const others = candidates.filter(c => c.id !== winner.id);
        const shuffledOthers = others.sort(() => 0.5 - Math.random());
        const pool = [winner, ...shuffledOthers];
        
        displayCandidates.current = pool;

        const initialRacers: Racer[] = pool.map(s => ({
            student: s,
            progress: 0,
            velocity: Math.random() * 0.5,
        }));

        setRacers(initialRacers);
        startTimeRef.current = performance.now();
        
        const baseSpeedFactor = (100 / (duration * 60)) * 1.5; 

        const animate = (time: number) => {
            setRacers(prevRacers => {
                let raceWon = false;
                
                if (Math.random() < 0.1) playTick();

                const newRacers = prevRacers.map(racer => {
                    const isWinner = racer.student.id === winner.id;
                    
                    let acceleration = (Math.random() - 0.5) * 0.1;
                    
                    if (Math.random() < 0.05) acceleration += 0.3; // Boost
                    if (Math.random() < 0.05) acceleration -= 0.2; // Stumble

                    racer.velocity += acceleration;

                    if (racer.velocity < 0.2) racer.velocity = 0.2;
                    if (racer.velocity > 2.5) racer.velocity = 2.5;

                    // --- NEW LOGIC: Soft Barrier at 70% ---
                    if (!isWinner && racer.progress > 70) {
                        // Apply drag/friction instead of hard stop
                        racer.velocity *= 0.92; 
                        
                        // Prevent absolute stop, keep them crawling
                        if (racer.velocity < 0.05) racer.velocity = 0.05;
                    }

                    // --- Safety Hard Cap for Losers ---
                    // Prevent them from crossing 100% no matter what
                    if (!isWinner && racer.progress > 98) {
                        racer.velocity = 0;
                    }

                    let moveAmount = racer.velocity * baseSpeedFactor;
                    
                    const newProgress = racer.progress + moveAmount;

                    if (isWinner && newProgress >= 100) {
                        raceWon = true;
                        return { ...racer, progress: 100 };
                    }

                    return { ...racer, progress: Math.min(newProgress, isWinner ? 100 : 98.5) };
                });

                if (raceWon) {
                    setFinished(true);
                    playWin();
                    setTimeout(() => {
                        fireConfetti();
                        onComplete();
                    }, 500);
                    return newRacers;
                } else {
                    requestRef.current = requestAnimationFrame(animate);
                    return newRacers;
                }
            });
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    if (racers.length === 0) return null;
    const isCrowded = racers.length > 10;

    return (
        <div className="flex flex-col h-full w-full relative px-2 bg-gray-900 rounded-none overflow-hidden shadow-2xl border-4 border-gray-800">
             {/* Asphalt Texture Background */}
             <div className="absolute inset-0 opacity-40 pointer-events-none" 
                  style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E"), linear-gradient(to bottom, #2d3748, #1a202c)`
                  }}>
             </div>

             <h2 className="text-center text-2xl font-bold py-3 uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700 flex justify-between px-6 shadow-lg">
                <span className="flex items-center gap-2">🏁 Đua Tốc Độ</span>
            </h2>
            
            <div className="flex-grow overflow-y-auto px-4 py-8 custom-scrollbar relative">
                {/* Finish Line */}
                <div className="absolute right-12 top-0 bottom-0 w-16 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] bg-contain opacity-80 z-0 border-l-4 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>

                <div className="relative pb-10 pt-4">
                    {racers.map((racer, idx) => {
                        const isWinner = racer.student.id === winner.id;
                        const isRevealed = finished && isWinner;
                        
                        const stackStyle = isCrowded && idx !== 0 ? { marginTop: '-42px' } : { marginTop: '12px' };
                        
                        // Map progress to screen width (leaving space for avatar width)
                        const visualLeft = racer.progress * 0.92; 

                        return (
                            <div key={racer.student.id} 
                                 className="relative w-full group border-b border-dashed border-white/10"
                                 style={{ 
                                     height: '64px', // Taller lanes
                                     zIndex: isRevealed ? 100 : (100 - idx),
                                     ...stackStyle
                                 }}
                            >
                                {/* The moving avatar container */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform"
                                    style={{ 
                                        left: `${visualLeft}%`,
                                        transition: 'left 0.1s linear'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className={`flex flex-col items-center z-10 transform ${isWinner && finished ? 'scale-150' : 'scale-100'}`}>
                                        <span className={`text-5xl md:text-6xl filter drop-shadow-md transform scale-x-[-1] transition-transform`}>
                                            {racer.student.avatar}
                                        </span> 
                                        
                                        {/* Dust Effect */}
                                        {racer.velocity > 1.5 && !finished && (
                                            <div className="absolute top-6 left-0 w-10 h-10 bg-gray-400 blur-md -z-10 animate-ping rounded-full opacity-30"></div>
                                        )}
                                    </div>

                                    {/* Name Bubble */}
                                    <div className={`
                                        ml-3 px-3 py-1 rounded-lg text-sm md:text-base font-bold whitespace-nowrap shadow-md
                                        ${isRevealed 
                                            ? 'bg-yellow-400 text-black border-2 border-yellow-200 scale-125 origin-left' 
                                            : 'bg-gray-800/90 text-gray-200 border border-gray-600'}
                                    `}>
                                        {racer.student.name}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// --- 4. Slot Machine ---
const SlotVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const colRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if(!colRef.current) return;
        
        const totalTime = duration * 1000;
        const startTime = performance.now();
        const element = colRef.current;
        const itemHeight = 120; // Increased Height
        
        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / totalTime, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            
            const totalItems = 30; 
            const totalScroll = (totalItems - 1) * itemHeight; 
            
            if (element) {
                element.scrollTop = totalScroll * ease;
                if (Math.floor(elapsed / 100) % 2 === 0) playTick(); 
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                playWin();
                fireConfetti();
                onComplete();
            }
        };
        requestAnimationFrame(animate);
    }, []);

    const generateSlots = () => {
        const slots = [];
        for(let i=0; i<29; i++) {
            const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
            slots.push(randomStudent);
        }
        slots.push(winner);
        return slots;
    };
    
    const [slots] = useState(generateSlots());

    return (
        <div className="flex justify-center items-center h-full w-full">
            <div className="bg-yellow-500 p-6 md:p-10 rounded-3xl shadow-2xl border-8 border-yellow-600">
                <div className="bg-white h-[120px] w-[350px] md:h-[200px] md:w-[600px] overflow-hidden relative rounded-xl border-4 border-gray-800">
                    <div className="absolute top-1/2 w-full h-[4px] bg-red-500/50 z-10 -translate-y-1/2 shadow-sm"></div>
                    <div ref={colRef} className="overflow-hidden h-full">
                        {slots.map((s, i) => (
                            <div key={i} className="h-[120px] md:h-[200px] flex items-center justify-center text-4xl md:text-6xl font-bold text-gray-800 border-b border-gray-100">
                                <span className="mr-4 text-5xl md:text-7xl">{s.avatar}</span> {s.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 5. Box Visualizer ---
const BoxVisualizer: React.FC<VisualizerProps> = ({ winner, duration, onComplete }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsOpen(true);
            playWin();
            fireConfetti();
            setTimeout(onComplete, 2000); 
        }, duration * 1000);
        return () => clearTimeout(timer);
    }, []);

    const shakeVariants = {
        shake: {
            rotate: [0, -5, 5, -5, 5, 0],
            transition: { repeat: Infinity, duration: 0.5 }
        },
        open: { rotate: 0, y: 0 }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full perspective-800">
            {/* Added extra margin top to prevent cut-off when avatar pops up */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 mt-48">
                 <motion.div
                    className="absolute left-0 right-0 top-0 flex flex-col items-center justify-center z-10"
                    initial={{ y: 50, scale: 0, opacity: 0 }}
                    animate={isOpen ? { y: -250, scale: 1.5, opacity: 1 } : { y: 50, scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.1 }}
                >
                    <div className="text-9xl drop-shadow-2xl">{winner.avatar}</div>
                    <div className="bg-white px-6 py-3 rounded-xl font-bold text-3xl text-indigo-700 shadow-xl mt-4 whitespace-nowrap border-4 border-indigo-200">
                        {winner.name}
                    </div>
                </motion.div>

                <motion.div
                    className="absolute top-0 left-0 w-full h-24 bg-red-600 rounded-t-xl z-30 origin-bottom shadow-lg border-b-8 border-red-800"
                    variants={shakeVariants}
                    animate={isOpen ? { rotateX: -110, y: -20 } : "shake"}
                    transition={isOpen ? { duration: 0.6 } : {}}
                    onUpdate={() => { if(!isOpen && Math.random() > 0.8) playTick() }}
                >
                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-12 bg-yellow-400"></div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-7xl">🎀</div>
                </motion.div>

                <div className="absolute bottom-0 left-0 w-full h-64 bg-red-500 rounded-b-xl shadow-2xl z-20 flex items-center justify-center overflow-hidden border-t border-black/10">
                     <div className="absolute left-1/2 -translate-x-1/2 h-full w-12 bg-yellow-400"></div>
                     <div className="absolute top-1/2 -translate-y-1/2 w-full h-12 bg-yellow-400"></div>
                </div>
            </div>
             <div className="h-32"></div>
        </div>
    )
}

// --- 6. Spotlight ---
const SpotlightVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [highlightIndex, setHighlightIndex] = useState(0);
    
    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.sort(() => 0.5 - Math.random());
    });

    useEffect(() => {
        let count = 0;
        const totalTicks = (duration * 1000) / 150;
        const interval = setInterval(() => {
            setHighlightIndex(prev => (prev + 1) % displayList.length);
            playTick();
            count++;
            if (count > totalTicks) {
                 const winnerIdx = displayList.findIndex(s => s.id === winner.id);
                 setHighlightIndex(winnerIdx);
                 clearInterval(interval);
                 setTimeout(() => {
                     playWin();
                     fireConfetti();
                     onComplete();
                 }, 500);
            }
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-6 p-4 overflow-y-auto w-full">
            {displayList.map((student, idx) => (
                <div 
                    key={student.id} 
                    className={`
                        flex flex-col items-center justify-center w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full border-8 transition-all duration-100
                        ${highlightIndex === idx ? 'scale-125 border-yellow-400 bg-yellow-100 shadow-[0_0_50px_rgba(250,204,21,0.9)] z-10' : 'border-gray-200 bg-white opacity-40 grayscale'}
                    `}
                >
                    <div className="text-3xl md:text-5xl lg:text-6xl">{student.avatar}</div>
                    <div className="text-xs md:text-sm lg:text-base font-bold truncate w-full text-center px-2 mt-2">{student.name}</div>
                </div>
            ))}
        </div>
    )
}

// --- 7. Grid Elimination ---
const GridEliminationVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
    
    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.sort(() => 0.5 - Math.random());
    });

    useEffect(() => {
        const allIds = displayList.map(s => s.id).filter(id => id !== winner.id);
        const shuffledEliminationOrder = allIds.sort(() => 0.5 - Math.random());
        
        const totalItems = shuffledEliminationOrder.length;
        const stepTime = (duration * 1000) / totalItems;

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < totalItems) {
                const idToRemove = shuffledEliminationOrder[currentIndex];
                setEliminatedIds(prev => new Set(prev).add(idToRemove));
                playTick();
                currentIndex++;
            } else {
                clearInterval(interval);
                playWin();
                fireConfetti();
                setTimeout(onComplete, 1000);
            }
        }, stepTime);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-3 p-4 overflow-y-auto w-full">
             <div className="w-full text-center mb-6">
                 <h2 className="text-4xl font-black text-white drop-shadow-lg uppercase">Ai sẽ là người cuối cùng?</h2>
             </div>
            {displayList.map((student) => {
                const isEliminated = eliminatedIds.has(student.id);
                const isWinner = student.id === winner.id;
                
                return (
                    <div 
                        key={student.id} 
                        className={`
                            flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 rounded-xl border-4 transition-all duration-300
                            ${isEliminated ? 'opacity-10 scale-90 bg-gray-800 border-gray-700 blur-sm' : 'bg-white border-indigo-200 shadow-xl scale-100'}
                            ${isWinner && eliminatedIds.size === displayList.length - 1 ? 'scale-150 border-yellow-400 bg-yellow-50 shadow-[0_0_60px_rgba(255,255,255,0.9)] z-30' : ''}
                        `}
                    >
                        <div className="text-2xl md:text-3xl">{student.avatar}</div>
                        <div className={`font-bold text-base md:text-xl max-w-[150px] truncate ${isEliminated ? 'text-gray-500' : 'text-gray-800'}`}>
                            {student.name}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// --- 8. Flip Card Mode ---
const FlipVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
    const [finalReveal, setFinalReveal] = useState(false);

    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.sort(() => 0.5 - Math.random()); 
    });

    useEffect(() => {
        const loserIds = displayList.filter(s => s.id !== winner.id).map(s => s.id);
        const shuffledLosers = loserIds.sort(() => 0.5 - Math.random());
        
        const stepTime = (duration * 1000) / shuffledLosers.length;
        
        let idx = 0;
        const interval = setInterval(() => {
            if(idx < shuffledLosers.length) {
                const id = shuffledLosers[idx];
                setFlippedIds(prev => new Set(prev).add(id));
                playTick();
                idx++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setFinalReveal(true);
                    playWin();
                    fireConfetti();
                    setTimeout(onComplete, 2000);
                }, 500);
            }
        }, stepTime);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-6 p-8 overflow-y-auto perspective-1000 w-full">
             {displayList.map(student => {
                 const isFlipped = flippedIds.has(student.id);
                 const isWinner = student.id === winner.id;
                 const showWinner = finalReveal && isWinner;

                 return (
                     <div key={student.id} className="relative w-32 h-44 md:w-40 md:h-56 perspective-1000 transition-all duration-500">
                         <motion.div 
                            className="w-full h-full relative preserve-3d transition-transform duration-700"
                            animate={{ 
                                rotateY: isFlipped ? 180 : (showWinner ? 360 : 0),
                                scale: showWinner ? 1.5 : 1
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                         >
                             {/* Front (Active Face) */}
                             <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl border-4 border-indigo-200 flex flex-col items-center justify-center z-10">
                                 <div className="text-6xl">{student.avatar}</div>
                                 <div className="text-sm md:text-base font-bold text-center mt-3 px-2 line-clamp-2">{student.name}</div>
                             </div>
                             
                             {/* Back (Eliminated/Card Back Face) */}
                             <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-2xl shadow-inner border-[6px] border-white flex items-center justify-center" style={{ transform: 'rotateY(180deg)' }}>
                                 {/* Simple pattern to look like card back */}
                                 <div className="w-full h-full opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '10px 10px'}}></div>
                                 <div className="absolute text-white font-bold opacity-30 text-4xl">?</div>
                             </div>
                         </motion.div>
                     </div>
                 )
             })}
        </div>
    );
};

// --- 9. Galaxy Mode ---
const GalaxyVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [angleOffset, setAngleOffset] = useState(0);
    const [radius, setRadius] = useState(300); // Larger radius
    const [speed, setSpeed] = useState(0.05);

    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.slice(0, 20); 
    });

    useEffect(() => {
        let frame = 0;
        let currentAngle = 0;
        let currentSpeed = 0.1; 

        const animate = () => {
            currentAngle += currentSpeed;
            setAngleOffset(currentAngle);
            
            const progress = frame / (duration * 60);
            if(progress > 0.5) {
                currentSpeed *= 0.98; 
            }
            if(currentSpeed < 0.002) currentSpeed = 0.002;

            if (progress < 1) {
                frame++;
                requestAnimationFrame(animate);
                if(frame % 10 === 0) playTick();
            } else {
                setRadius(0); 
                playWin();
                fireConfetti();
                setTimeout(onComplete, 2000);
            }
        };
        requestAnimationFrame(animate);
    }, []);

    return (
        <div className="flex items-center justify-center h-full w-full relative bg-black overflow-hidden">
             {/* Background Stars */}
             <div className="absolute inset-0 opacity-50" style={{backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px)', backgroundSize: '100px 100px'}}></div>

             {/* Central Sun (Winner Reveal) */}
             <div className="absolute z-20 w-48 h-48 md:w-64 md:h-64 rounded-full bg-yellow-400 shadow-[0_0_150px_rgba(253,224,71,0.6)] flex items-center justify-center transition-all duration-1000 scale-100 border-8 border-yellow-200">
                  <div className={`text-8xl md:text-9xl transition-opacity duration-1000 ${radius === 0 ? 'opacity-100' : 'opacity-0'}`}>
                      {winner.avatar}
                  </div>
                  {radius === 0 && (
                      <div className="absolute -bottom-24 whitespace-nowrap text-white font-black text-5xl drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-bounce">
                          {winner.name}
                      </div>
                  )}
             </div>

             {/* Orbiting Planets */}
             <div className="relative w-full h-full flex items-center justify-center">
                 {displayList.map((student, idx) => {
                     if(radius === 0 && student.id !== winner.id) return null;
                     if(radius === 0 && student.id === winner.id) return null;

                     const angleStep = (2 * Math.PI) / displayList.length;
                     const angle = angleOffset + (idx * angleStep);
                     
                     // Responsive radius calculation
                     const responsiveRadius = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) * 0.35 : 300;
                     const currentRadius = radius === 0 ? 0 : responsiveRadius;

                     const x = Math.cos(angle) * currentRadius;
                     const y = Math.sin(angle) * currentRadius;
                     
                     return (
                         <div 
                            key={student.id}
                            className="absolute flex flex-col items-center transition-all duration-1000"
                            style={{ 
                                transform: `translate(${x}px, ${y}px)`,
                                opacity: radius === 0 ? 0 : 1
                            }}
                         >
                             <div className="text-4xl md:text-6xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{student.avatar}</div>
                             <div className="text-xs md:text-sm font-bold text-white/90 max-w-[100px] truncate text-center mt-1 bg-black/50 px-2 rounded">{student.name}</div>
                         </div>
                     )
                 })}
             </div>
        </div>
    )
}

export const VisualizationContainer: React.FC<VisualizerProps> = (props) => {
  switch (props.mode) {
    case PresentationMode.RACE: return <RaceVisualizer {...props} />;
    case PresentationMode.WHEEL: return <WheelVisualizer {...props} />;
    case PresentationMode.SLOT: return <SlotVisualizer {...props} />;
    case PresentationMode.BOX: return <BoxVisualizer {...props} />;
    case PresentationMode.SPOTLIGHT: return <SpotlightVisualizer {...props} />;
    case PresentationMode.GRID_ELIMINATION: return <GridEliminationVisualizer {...props} />;
    case PresentationMode.FLIP: return <FlipVisualizer {...props} />;
    case PresentationMode.GALAXY: return <GalaxyVisualizer {...props} />;
    case PresentationMode.SIMPLE:
    default: return <SimpleVisualizer {...props} />;
  }
};
