
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    
    const spinCount = 8;
    // Align winner to Top (270deg)
    const finalRotation = (360 * spinCount) + (270 - (winnerIndex * segmentAngle));

    let frameId: number;

    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        const ease = 1 - Math.pow(1 - progress, 4);
        
        const currentRot = finalRotation * ease;
        setRotation(currentRot);

        const normalizedRot = currentRot % 360;
        let indexAtPointer = Math.floor((270 - normalizedRot) / segmentAngle);
        indexAtPointer = ((indexAtPointer % displayList.length) + displayList.length) % displayList.length;
        
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
            
            {/* Wheel Container */}
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
                            className="absolute w-full h-full left-0 top-0 origin-center pointer-events-none"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            {/* Text Container: Rotated and Translated to run along the slice */}
                            <div 
                                className="absolute left-1/2 top-1/2 w-[50%] h-[30px] flex items-center justify-end pr-8"
                                style={{ 
                                    transformOrigin: 'left center',
                                    transform: `rotate(${segmentAngle / 2}deg) translate(0, -50%)`,
                                    fontSize: fontSize
                                }}
                            >
                                <div className="font-bold truncate text-right flex items-center justify-end gap-2 w-full" style={{ color: `hsl(${index * (360 / displayList.length)}, 70%, 45%)` }}>
                                     {displayList.length < 50 && student.name} <span className="text-xl">{student.avatar}</span>
                                </div>
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

// --- 3. Race Mode ---
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
    
    useEffect(() => {
        // Chaos Engine: Everyone starts equal
        const pool = [...candidates]; // Preserve order!
        
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
                    if (Math.random() < 0.05) acceleration += 0.3; 
                    if (Math.random() < 0.05) acceleration -= 0.2; 

                    racer.velocity += acceleration;
                    if (racer.velocity < 0.2) racer.velocity = 0.2;
                    if (racer.velocity > 2.5) racer.velocity = 2.5;

                    if (!isWinner && racer.progress > 70) {
                        racer.velocity *= 0.92; 
                        if (racer.velocity < 0.05) racer.velocity = 0.05;
                    }

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
             <div className="absolute inset-0 opacity-40 pointer-events-none" 
                  style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E"), linear-gradient(to bottom, #2d3748, #1a202c)`
                  }}>
             </div>

             <h2 className="text-center text-2xl font-bold py-3 uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700 flex justify-between px-6 shadow-lg">
                <span className="flex items-center gap-2">🏁 Đua Tốc Độ</span>
            </h2>
            
            <div className="flex-grow overflow-y-auto px-4 py-8 custom-scrollbar relative">
                <div className="absolute right-12 top-0 bottom-0 w-16 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] bg-contain opacity-80 z-0 border-l-4 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>

                <div className="relative pb-10 pt-4">
                    {racers.map((racer, idx) => {
                        const isWinner = racer.student.id === winner.id;
                        const isRevealed = finished && isWinner;
                        const stackStyle = isCrowded && idx !== 0 ? { marginTop: '-42px' } : { marginTop: '12px' };
                        const visualLeft = racer.progress * 0.92; 

                        return (
                            <div key={racer.student.id} 
                                 className="relative w-full group border-b border-dashed border-white/10"
                                 style={{ 
                                     height: '64px',
                                     zIndex: isRevealed ? 100 : (100 - idx),
                                     ...stackStyle
                                 }}
                            >
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform"
                                    style={{ 
                                        left: `${visualLeft}%`,
                                        transition: 'left 0.1s linear'
                                    }}
                                >
                                    <div className={`flex flex-col items-center z-10 transform ${isWinner && finished ? 'scale-150' : 'scale-100'}`}>
                                        <span className={`text-5xl md:text-6xl filter drop-shadow-md transform scale-x-[-1] transition-transform`}>
                                            {racer.student.avatar}
                                        </span> 
                                        {racer.velocity > 1.5 && !finished && (
                                            <div className="absolute top-6 left-0 w-10 h-10 bg-gray-400 blur-md -z-10 animate-ping rounded-full opacity-30"></div>
                                        )}
                                    </div>

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
    const isMobile = window.innerWidth < 768;
    const itemHeight = isMobile ? 120 : 200; 

    const [slots] = useState(() => {
        const slotsList = [];
        for(let i=0; i<30; i++) {
            const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
            slotsList.push(randomStudent);
        }
        slotsList.push(winner);
        return slotsList;
    });

    useEffect(() => {
        if(!colRef.current) return;
        const totalTime = duration * 1000;
        const startTime = performance.now();
        const element = colRef.current;
        
        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / totalTime, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const totalScroll = (slots.length - 1) * itemHeight; 
            
            if (element) {
                const currentScroll = totalScroll * ease;
                element.scrollTop = currentScroll;
                if (Math.floor(elapsed / 100) % 2 === 0 && progress < 0.98) playTick(); 
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if(element) element.scrollTop = (slots.length - 1) * itemHeight;
                playWin();
                fireConfetti();
                onComplete();
            }
        };
        requestAnimationFrame(animate);
    }, []);

    return (
        <div className="flex justify-center items-center h-full w-full">
            <div className="bg-yellow-500 p-6 md:p-10 rounded-3xl shadow-2xl border-8 border-yellow-600">
                <div className="bg-white overflow-hidden relative rounded-xl border-4 border-gray-800" style={{ height: isMobile ? '120px' : '200px', width: isMobile ? '350px' : '600px'}}>
                    <div className="absolute top-1/2 w-full h-[4px] bg-red-500/50 z-10 -translate-y-1/2 shadow-sm"></div>
                    <div ref={colRef} className="overflow-hidden h-full">
                        {slots.map((s, i) => (
                            <div key={i} className="flex items-center justify-center text-4xl md:text-6xl font-bold text-gray-800 border-b border-gray-100 box-border" style={{ height: isMobile ? '120px' : '200px' }}>
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
    const [displayList] = useState(candidates);

    useEffect(() => {
        const winnerIndex = displayList.findIndex(s => s.id === winner.id);
        const length = displayList.length;
        const totalDurationMs = duration * 1000;
        
        // --- CALCULATION LOGIC ---
        // We want a speed of roughly 120ms per step initially to look good.
        const desiredSpeed = 120; 
        const approxSteps = Math.floor(totalDurationMs / desiredSpeed);
        
        // Calculate how many full loops fit in estimated steps
        // Total Steps = (Loops * Length) + winnerIndex
        let loops = Math.floor((approxSteps - winnerIndex) / length);
        if (loops < 2) loops = 2; // Ensure at least two loops for suspense

        const totalSteps = (loops * length) + winnerIndex;
        // Adjust speed slightly to fit exactly in duration
        const exactSpeed = totalDurationMs / totalSteps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setHighlightIndex(prev => (prev + 1) % length);
            playTick();

            if (currentStep >= totalSteps) {
                clearInterval(interval);
                // Ensure we land on winner index visually just in case
                setHighlightIndex(winnerIndex);
                setTimeout(() => {
                     playWin();
                     fireConfetti();
                     onComplete();
                }, 500);
            }
        }, exactSpeed);

        return () => clearInterval(interval);
    }, []);

    const itemCount = displayList.length;
    let gridCols = "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8";
    let sizeClass = "w-28 h-28";
    let iconSize = "text-5xl";
    
    if (itemCount > 50) {
        gridCols = "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12";
        sizeClass = "w-20 h-20";
        iconSize = "text-3xl";
    } else if (itemCount > 25) {
        gridCols = "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10";
        sizeClass = "w-24 h-24";
        iconSize = "text-4xl";
    }

    return (
        <div className="flex flex-col h-full w-full p-4 overflow-y-auto">
             <div className={`grid ${gridCols} gap-4 place-items-center w-full max-w-[95vw] mx-auto py-8`}>
                {displayList.map((student, idx) => (
                    <div 
                        key={student.id} 
                        className={`
                            flex flex-col items-center justify-center rounded-xl border-4 transition-all duration-100 p-1
                            ${sizeClass}
                            ${highlightIndex === idx ? 'scale-125 border-yellow-400 bg-yellow-100 shadow-[0_0_50px_rgba(250,204,21,0.9)] z-20' : 'border-gray-200 bg-white opacity-40 grayscale'}
                        `}
                    >
                        <div className={iconSize}>{student.avatar}</div>
                        <div className="text-[10px] sm:text-xs font-bold truncate w-full text-center mt-1">{student.name}</div>
                    </div>
                ))}
             </div>
        </div>
    )
}

// --- 7. Grid Elimination ---
const GridEliminationVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
    const [displayList] = useState(candidates);

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
    const [displayList] = useState(candidates);

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

    const count = displayList.length;
    let cardClass = "w-32 h-44 md:w-40 md:h-56"; 
    let textSize = "text-6xl";
    let nameSize = "text-sm md:text-base";

    if (count > 40) {
        cardClass = "w-16 h-24";
        textSize = "text-2xl";
        nameSize = "text-[8px] leading-tight";
    } else if (count > 20) {
        cardClass = "w-24 h-32";
        textSize = "text-4xl";
        nameSize = "text-xs";
    }

    return (
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-4 p-4 overflow-y-auto perspective-1000 w-full">
             {displayList.map(student => {
                 const isFlipped = flippedIds.has(student.id);
                 const isWinner = student.id === winner.id;
                 const showWinner = finalReveal && isWinner;

                 return (
                     <div key={student.id} className={`relative perspective-1000 transition-all duration-500 ${cardClass}`}>
                         <motion.div 
                            className="w-full h-full relative preserve-3d transition-transform duration-700"
                            animate={{ 
                                rotateY: isFlipped ? 180 : (showWinner ? 360 : 0),
                                scale: showWinner ? 1.5 : 1
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                         >
                             <div className="absolute inset-0 backface-hidden bg-white rounded-lg shadow-md border-2 border-indigo-200 flex flex-col items-center justify-center z-10 overflow-hidden"
                                  style={{ backfaceVisibility: 'hidden' }}>
                                 <div className={textSize}>{student.avatar}</div>
                                 <div className={`${nameSize} font-bold text-center mt-1 px-1 line-clamp-2`}>{student.name}</div>
                             </div>
                             
                             <div className="absolute inset-0 backface-hidden bg-indigo-700 rounded-lg shadow-inner border-4 border-white flex items-center justify-center" 
                                  style={{ 
                                      transform: 'rotateY(180deg)',
                                      backfaceVisibility: 'hidden'
                                  }}>
                                 <div className="w-full h-full opacity-30" style={{backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '10px 10px'}}></div>
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
    const [radius, setRadius] = useState(300);
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
             <div className="absolute inset-0 opacity-50" style={{backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px)', backgroundSize: '100px 100px'}}></div>

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

             <div className="relative w-full h-full flex items-center justify-center">
                 {displayList.map((student, idx) => {
                     if(radius === 0 && student.id !== winner.id) return null;
                     if(radius === 0 && student.id === winner.id) return null;

                     const angleStep = (2 * Math.PI) / displayList.length;
                     const angle = angleOffset + (idx * angleStep);
                     
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

// --- 10. Claw Machine Mode ---
const ClawMachineVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, onComplete }) => {
    // Fill the bottom with capsules.
    const [displayPrizes] = useState(() => {
        // Filter out winner first
        const others = candidates.filter(s => s.id !== winner.id);
        // Shuffle others
        const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 14); // Max 14 others
        // Insert winner at random position
        const list = [...shuffledOthers];
        const randomPos = Math.floor(Math.random() * (list.length + 1));
        list.splice(randomPos, 0, winner);
        return list;
    });

    const [clawState, setClawState] = useState<'IDLE' | 'OSCILLATING' | 'MOVING_TO_TARGET' | 'DROPPING' | 'GRABBING' | 'LIFTING' | 'REVEAL'>('IDLE');
    const [clawLeft, setClawLeft] = useState(50); // %
    const [clawHeight, setClawHeight] = useState(0); // %

    useEffect(() => {
        // Animation Sequence
        setClawState('OSCILLATING');
        
        let oscillateTime = 0;
        const oscillateInterval = setInterval(() => {
             oscillateTime += 0.1;
             // Swing back and forth
             setClawLeft(50 + Math.sin(oscillateTime) * 40);
        }, 50);

        // Stop oscillating after 2 seconds and move to target
        setTimeout(() => {
            clearInterval(oscillateInterval);
            
            // Calculate exact target position
            const winnerIdx = displayPrizes.findIndex(s => s.id === winner.id);
            // 100% width distributed among N items. Center of item I is (100/N * I) + (100/N / 2)
            const itemWidth = 100 / displayPrizes.length;
            const targetLeft = (itemWidth * winnerIdx) + (itemWidth / 2);
            
            setClawState('MOVING_TO_TARGET');
            setClawLeft(targetLeft);

            setTimeout(() => {
                setClawState('DROPPING');
                setClawHeight(70); // Drop down

                setTimeout(() => {
                    setClawState('GRABBING');
                    playTick();

                    setTimeout(() => {
                        setClawState('LIFTING');
                        setClawHeight(0); // Lift up
                        playWin();

                        setTimeout(() => {
                            setClawState('REVEAL');
                            fireConfetti();
                            setTimeout(onComplete, 2500);
                        }, 1000);
                    }, 500);
                }, 1000);
            }, 1000);

        }, 2500);

        return () => clearInterval(oscillateInterval);
    }, []);

    return (
        <div className="relative w-full h-full bg-pink-50 overflow-hidden flex flex-col items-center">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#fce7f3_20%,_#fbcfe8_20%)] bg-[length:20px_20px] opacity-50"></div>
            
            {/* Top Bar */}
            <div className="absolute top-0 w-full h-12 bg-gray-800 z-20 shadow-xl border-b-4 border-gray-600"></div>
            
            {/* Claw Mechanism */}
            <div 
                className="absolute top-8 z-30 flex flex-col items-center"
                style={{ 
                    left: `${clawLeft}%`, 
                    height: '80%',
                    transform: `translateX(-50%)`,
                    transition: clawState === 'OSCILLATING' ? 'left 0.1s linear' : 'left 1s ease-in-out'
                }}
            >
                {/* Rope */}
                <div 
                    className="w-1.5 bg-gray-600 transition-all duration-[1000ms] ease-in-out"
                    style={{ height: `${clawHeight}%` }}
                ></div>
                
                {/* Claw Head */}
                <div className="relative transition-all duration-[1000ms] ease-in-out" style={{ transform: `translateY(${clawHeight * 5}px)` }}>
                    <div className="w-16 h-12 bg-gray-700 rounded-t-xl border-2 border-gray-500 relative z-10"></div>
                    {/* Prongs */}
                    <motion.div 
                        className="absolute top-8 -left-4 w-4 h-16 bg-gray-500 rounded-full origin-top-right border border-gray-700"
                        animate={{ rotate: clawState === 'GRABBING' || clawState === 'LIFTING' || clawState === 'REVEAL' ? 25 : -15 }}
                    ></motion.div>
                    <motion.div 
                        className="absolute top-8 -right-4 w-4 h-16 bg-gray-500 rounded-full origin-top-left border border-gray-700"
                        animate={{ rotate: clawState === 'GRABBING' || clawState === 'LIFTING' || clawState === 'REVEAL' ? -25 : 15 }}
                    ></motion.div>

                    {/* Grabbed Prize */}
                    {(clawState === 'LIFTING' || clawState === 'REVEAL') && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 animate-bounce">
                             <div className="relative w-16 h-16 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center">
                                 <div className="text-4xl">{winner.avatar}</div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Revealed Winner */}
            {clawState === 'REVEAL' && (
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-3xl shadow-2xl z-50 text-center border-8 border-yellow-400"
                >
                    <div className="text-9xl mb-4">{winner.avatar}</div>
                    <div className="text-4xl font-black text-indigo-600">{winner.name}</div>
                </motion.div>
            )}

            {/* Prizes Row */}
            <div className="absolute bottom-6 w-full px-4 flex justify-between items-end h-24">
                {displayPrizes.map((s, idx) => {
                    const isGrabbed = (clawState === 'LIFTING' || clawState === 'REVEAL') && s.id === winner.id;
                    const colorClasses = ['border-red-400', 'border-blue-400', 'border-green-400', 'border-yellow-400', 'border-purple-400'];
                    const randomColor = colorClasses[idx % colorClasses.length];

                    return (
                        <div key={s.id} className={`flex flex-col items-center flex-1 transition-opacity ${isGrabbed ? 'opacity-0' : 'opacity-100'}`}>
                            <div className={`relative w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white border-4 ${randomColor} shadow-[inset_0_-5px_10px_rgba(0,0,0,0.2)] flex items-center justify-center mb-1 overflow-hidden`}>
                                <div className="absolute top-2 left-3 w-4 h-2 bg-white rounded-full opacity-60 transform rotate-45"></div>
                                <div className="text-2xl md:text-4xl">{s.avatar}</div>
                            </div>
                            <div className="bg-white/80 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-bold shadow-sm max-w-full truncate">{s.name}</div>
                        </div>
                    )
                })}
            </div>
            
             <div className="absolute bottom-0 w-full h-6 bg-pink-600 z-10"></div>
        </div>
    );
};

// --- 11. Lucky Cards Mode (Dealer Style) ---
const LuckyCardsVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, onComplete }) => {
    // Phases: SHOW_UP -> FLIP_DOWN -> GATHER -> SHUFFLE -> DEAL -> PICK -> REVEAL
    const [phase, setPhase] = useState<'SHOW_UP' | 'FLIP_DOWN' | 'GATHER' | 'SHUFFLE' | 'DEAL' | 'PICK' | 'REVEAL'>('SHOW_UP');
    const [revealedCardIndex, setRevealedCardIndex] = useState<number | null>(null);
    const [displayList] = useState(() => candidates.slice(0, 32)); // Limit to 32 max for performance

    useEffect(() => {
        // Timeline
        const t1 = setTimeout(() => setPhase('FLIP_DOWN'), 2000); // Wait 2s reading names
        const t2 = setTimeout(() => setPhase('GATHER'), 3000);    // Wait 1s flip
        const t3 = setTimeout(() => setPhase('SHUFFLE'), 4000);   // Wait 1s gather
        const t4 = setTimeout(() => setPhase('DEAL'), 5000);      // Wait 1s shuffle
        const t5 = setTimeout(() => setPhase('PICK'), 6500);      // Wait 1.5s deal

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    }, []);

    const handleCardPick = (index: number) => {
        if (phase !== 'PICK') return;
        setRevealedCardIndex(index);
        setPhase('REVEAL');
        playWin();
        fireConfetti();
        setTimeout(onComplete, 2500);
    };

    // High contrast stripe pattern for clear face-down indication
    const cardBackPattern = `repeating-linear-gradient(45deg, #1e3a8a, #1e3a8a 10px, #1d4ed8 10px, #1d4ed8 20px)`;

    return (
        <div className="relative w-full h-full bg-green-800 overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
             
             {/* Container for all Cards */}
             <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
                 {displayList.map((s, idx) => {
                     // Determine Position & Rotation based on Phase
                     const isChosenDealtCard = idx < 5; // We only deal the first 5 cards from the list visually
                     
                     // Grid Layout Logic
                     const cols = 8;
                     const row = Math.floor(idx / cols);
                     const col = idx % cols;
                     const gridX = (col - 3.5) * 70; // rough px spacing
                     const gridY = (row - 2) * 90;

                     // Deal Layout Logic - Larger spacing
                     const dealX = (idx - 2) * 160; 
                     
                     let x = 0, y = 0, rotateY = 0, opacity = 1, scale = 1, zIndex = 1;

                     if (phase === 'SHOW_UP') {
                         x = gridX; y = gridY; rotateY = 180; // 180 = Front Visible
                     } else if (phase === 'FLIP_DOWN') {
                         x = gridX; y = gridY; rotateY = 0; // 0 = Back Visible
                     } else if (phase === 'GATHER' || phase === 'SHUFFLE') {
                         x = 0; y = 0; rotateY = 0;
                         if (phase === 'SHUFFLE') {
                             x = (Math.random() - 0.5) * 20;
                             y = (Math.random() - 0.5) * 20;
                         }
                     } else if (phase === 'DEAL' || phase === 'PICK' || phase === 'REVEAL') {
                         if (isChosenDealtCard) {
                             x = dealX; y = 0; rotateY = 0; scale = 1.6; zIndex = 10; // Increased Scale significantly
                             if (phase === 'REVEAL' && revealedCardIndex === idx) {
                                 rotateY = 180; scale = 2.0; zIndex = 50;
                             } else if (phase === 'REVEAL') {
                                 opacity = 0.2;
                             }
                         } else {
                             opacity = 0; // Hide non-dealt cards
                         }
                     }

                     // MAGIC: If this is the card we picked to REVEAL, make sure it shows the WINNER info
                     const studentToShow = (phase === 'REVEAL' && revealedCardIndex === idx) ? winner : s;

                     return (
                         <motion.div
                            key={s.id}
                            initial={{ x: gridX, y: gridY, rotateY: 180 }}
                            animate={{ x, y, rotateY, opacity, scale, zIndex }}
                            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                            className="absolute w-16 h-24 md:w-24 md:h-36 cursor-pointer"
                            onClick={() => isChosenDealtCard ? handleCardPick(idx) : null}
                            style={{ 
                                perspective: '1000px',
                                transformStyle: 'preserve-3d'
                            }}
                         >
                             {/* Card Back - Visible at 0deg */}
                             <div className="absolute inset-0 rounded-lg border-2 border-white shadow-xl flex items-center justify-center overflow-hidden bg-blue-900"
                                  style={{ 
                                      backfaceVisibility: 'hidden', 
                                      WebkitBackfaceVisibility: 'hidden',
                                      transform: 'rotateY(0deg)',
                                      background: cardBackPattern
                                  }}>
                                  <div className="absolute inset-2 border-2 border-white/30 rounded-md"></div>
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/50 text-xs font-bold">?</div>
                             </div>

                             {/* Card Front - Visible at 180deg */}
                             <div 
                                className="absolute inset-0 bg-white rounded-lg border-2 border-yellow-400 shadow-xl flex flex-col items-center justify-center p-1"
                                style={{ 
                                    backfaceVisibility: 'hidden', 
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)' 
                                }}
                             >
                                  <div className="text-3xl md:text-5xl">{studentToShow.avatar}</div>
                                  <div className="text-[10px] md:text-xs font-bold text-center mt-1 leading-tight line-clamp-2">{studentToShow.name}</div>
                             </div>
                         </motion.div>
                     );
                 })}
             </div>
             
             {phase === 'PICK' && (
                 <div className="absolute bottom-10 animate-bounce">
                     <div className="bg-black/50 text-white px-6 py-2 rounded-full font-bold text-xl backdrop-blur-sm border border-white/20">
                         👇 Chọn 1 lá bài bất kỳ 👇
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- 12. Dice (Number Slot) Mode ---
const DiceVisualizer: React.FC<VisualizerProps> = ({ winner, candidates, duration, onComplete }) => {
    // Determine winner number (1-based index)
    const winnerIdx = candidates.findIndex(s => s.id === winner.id) + 1;
    const tens = Math.floor(winnerIdx / 10);
    const units = winnerIdx % 10;
    
    // Stop randomizer: > 0.5 means Tens stop first, else Units stop first
    const [stopTensFirst] = useState(() => Math.random() > 0.5);
    const [showIdentity, setShowIdentity] = useState(false);

    const tensRef = useRef<HTMLDivElement>(null);
    const unitsRef = useRef<HTMLDivElement>(null);

    const slotHeight = 200; // px
    
    useEffect(() => {
        // Animation setup
        const totalDuration = duration * 1000;
        
        // Target scroll positions (approx 20 loops + target)
        const loops = 30;
        const tensTarget = (loops * 10 + tens) * slotHeight;
        const unitsTarget = (loops * 10 + units) * slotHeight;

        // Start times and durations
        const tensDuration = stopTensFirst ? totalDuration : totalDuration + 1500;
        const unitsDuration = stopTensFirst ? totalDuration + 1500 : totalDuration;
        
        const startTime = performance.now();
        
        const animate = (time: number) => {
            const elapsed = time - startTime;
            
            // Tens
            if (tensRef.current) {
                const tProg = Math.min(elapsed / tensDuration, 1);
                const ease = 1 - Math.pow(1 - tProg, 4); // Quartic ease out
                tensRef.current.scrollTop = tensTarget * ease;
            }

            // Units
            if (unitsRef.current) {
                const uProg = Math.min(elapsed / unitsDuration, 1);
                const ease = 1 - Math.pow(1 - uProg, 4);
                unitsRef.current.scrollTop = unitsTarget * ease;
            }

            if (elapsed < Math.max(tensDuration, unitsDuration) + 100) { // Buffer
                 requestAnimationFrame(animate);
                 if (Math.random() < 0.1) playTick();
            } else {
                 // Animation done. Wait for recognition delay.
                 playWin();
                 setTimeout(() => {
                     setShowIdentity(true);
                     fireConfetti();
                     setTimeout(onComplete, 2000);
                 }, 2000); // 2 seconds delay for students to check their number
            }
        };

        requestAnimationFrame(animate);
    }, []);

    // Helper to generate column numbers repeated
    const renderNumbers = (target: number) => {
        // Render 0-9 repeatedly, ending with target
        const nums = [];
        for(let i=0; i < 35; i++) {
            nums.push(...[0,1,2,3,4,5,6,7,8,9]);
        }
        nums.push(target); // Ensure it ends on target
        return nums.map((n, i) => (
            <div key={i} className="flex items-center justify-center font-mono font-black text-8xl text-gray-800 bg-white border-b border-gray-100 box-border" style={{ height: `${slotHeight}px` }}>
                {n}
            </div>
        ));
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-blue-50">
             {!showIdentity ? (
                 <div className="flex gap-4 md:gap-8 items-center bg-gray-900 p-8 rounded-3xl shadow-2xl border-8 border-gray-700">
                     {/* Tens Column */}
                     <div className="relative overflow-hidden bg-white rounded-xl shadow-inner border-4 border-gray-400" style={{ width: '150px', height: `${slotHeight}px` }}>
                          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
                          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                          <div ref={tensRef} className="h-full overflow-hidden">
                              {renderNumbers(tens)}
                          </div>
                     </div>
                     
                     <div className="text-white text-6xl font-black">-</div>

                     {/* Units Column */}
                     <div className="relative overflow-hidden bg-white rounded-xl shadow-inner border-4 border-gray-400" style={{ width: '150px', height: `${slotHeight}px` }}>
                          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
                          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                          <div ref={unitsRef} className="h-full overflow-hidden">
                              {renderNumbers(units)}
                          </div>
                     </div>
                 </div>
             ) : (
                  <motion.div initial={{scale: 0}} animate={{scale: 1}} className="text-center p-12 bg-white rounded-3xl shadow-2xl border-8 border-indigo-500 z-10">
                      <div className="text-9xl mb-6">{winner.avatar}</div>
                      <div className="text-5xl font-black text-indigo-800">{winner.name}</div>
                      <div className="text-gray-500 font-bold mt-4 text-2xl uppercase tracking-widest bg-gray-100 rounded-full py-2 px-6 inline-block">Số thứ tự: {winnerIdx}</div>
                  </motion.div>
             )}
        </div>
    )
}

// --- 13. Egg Hatch Mode (NEW) ---
const EggHatchVisualizer: React.FC<VisualizerProps> = ({ winner, onComplete }) => {
    const [step, setStep] = useState<'FLY_IN' | 'DROP' | 'CRACK' | 'HATCH'>('FLY_IN');

    useEffect(() => {
        // Step 1: Fly In (0s - 2s)
        const t1 = setTimeout(() => {
            setStep('DROP');
            playTick();
        }, 2000);

        // Step 2: Drop & Land (2s - 3s) -> Start Crack
        const t2 = setTimeout(() => {
            setStep('CRACK');
        }, 3000);

        // Step 3: Crack animation (3s - 5s) -> Hatch
        const t3 = setTimeout(() => {
            setStep('HATCH');
            playWin();
            fireConfetti();
            setTimeout(onComplete, 3000);
        }, 5500);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="relative w-full h-full bg-sky-300 overflow-hidden flex flex-col items-center justify-end">
            <div className="absolute bottom-0 w-full h-32 bg-green-500 border-t-8 border-green-600"></div>
            
            {/* Cloud */}
            <motion.div 
                className="absolute top-10 left-10 text-9xl opacity-80"
                animate={{ x: [0, 50, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
            >☁️</motion.div>

            {/* Bird (Pelican) with Basket */}
            <motion.div
                className="absolute top-[10vh] z-20 flex flex-col items-center"
                initial={{ x: '-20vw' }}
                animate={{ x: '120vw' }}
                transition={{ duration: 4, ease: 'linear' }}
            >
                <div className="text-[12rem] -mb-10 scale-x-[-1]">🦢</div>
                <div className="text-8xl">🧺</div>
            </motion.div>

            {/* Egg Container */}
            <div className="absolute top-[30vh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                {step !== 'FLY_IN' && (
                    <motion.div
                        initial={{ y: 0, opacity: 0 }}
                        animate={
                            step === 'DROP' ? { y: '50vh', opacity: 1 } : 
                            step === 'CRACK' ? { y: '50vh', opacity: 1, rotate: [0, -10, 10, -10, 10, 0] } :
                            { y: '50vh', opacity: 0, scale: 2 } // Disappear on hatch
                        }
                        transition={
                            step === 'DROP' ? { type: 'spring', bounce: 0.4, duration: 0.8 } :
                            step === 'CRACK' ? { duration: 0.5, repeat: Infinity } : {}
                        }
                        className="text-9xl relative"
                    >
                        🥚
                    </motion.div>
                )}

                {/* Hatched Student */}
                {step === 'HATCH' && (
                    <motion.div
                        initial={{ scale: 0, y: '55vh' }}
                        animate={{ scale: 1.5, y: -200 }} // Move UP 200px from the egg center to be visible
                        transition={{ type: 'spring', bounce: 0.6 }}
                        className="bg-white p-6 rounded-3xl border-4 border-yellow-400 shadow-2xl text-center"
                    >
                        <div className="text-8xl mb-2">{winner.avatar}</div>
                        <div className="text-3xl font-black text-indigo-700 whitespace-nowrap">{winner.name}</div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

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
    case PresentationMode.CLAW_MACHINE: return <ClawMachineVisualizer {...props} />;
    case PresentationMode.LUCKY_CARDS: return <LuckyCardsVisualizer {...props} />;
    case PresentationMode.DICE: return <DiceVisualizer {...props} />;
    case PresentationMode.EGG_HATCH: return <EggHatchVisualizer {...props} />;
    case PresentationMode.SIMPLE:
    default: return <SimpleVisualizer {...props} />;
  }
};
