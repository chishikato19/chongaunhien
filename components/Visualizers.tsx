
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
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-4 text-gray-500 animate-pulse">Đang chọn...</h2>
      <div className="text-6xl font-black text-indigo-600 drop-shadow-lg text-center p-8 bg-white rounded-2xl shadow-xl border-4 border-indigo-100">
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

  const fontSize = displayList.length > 30 ? '0.6rem' : displayList.length > 20 ? '0.8rem' : '1.125rem';

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden relative">
        <div className="mb-6 bg-white/90 backdrop-blur px-6 py-2 rounded-xl shadow-lg border-2 border-indigo-100 z-30 min-w-[200px] text-center">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang kim chỉ</div>
             <div className="text-2xl font-black text-indigo-700 truncate max-w-xs">{currentSelected}</div>
        </div>

        <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 drop-shadow-xl filter"></div>
            </div>
            
            <div 
                ref={canvasRef}
                className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border-8 border-gray-800 shadow-2xl bg-white overflow-hidden"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {displayList.map((student, index) => {
                    const angle = segmentAngle * index;
                    return (
                        <div
                            key={student.id}
                            className="absolute w-full h-full left-0 top-0 text-center origin-center"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <div className="pt-4 font-bold truncate px-2" style={{ color: `hsl(${index * (360 / displayList.length)}, 70%, 50%)`, fontSize: fontSize}}>
                                {student.avatar} {displayList.length < 40 ? student.name.split(' ')[0] : ''}
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
    yJitter: number;
    rotation: number;
}

const RaceVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [racers, setRacers] = useState<Racer[]>([]);
    const [finished, setFinished] = useState(false);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    
    // Limits visual candidates to avoid performance hits on massive classes, but keeps enough for fun
    const displayCandidates = useRef<Student[]>([]);

    useEffect(() => {
        // Initialization
        const others = candidates.filter(c => c.id !== winner.id);
        // Show winner + up to 29 others for performance, shuffled
        const shuffledOthers = others.sort(() => 0.5 - Math.random());
        const pool = [winner, ...shuffledOthers];
        
        displayCandidates.current = pool;

        const initialRacers: Racer[] = pool.map(s => ({
            student: s,
            progress: 0,
            velocity: Math.random() * 0.5, // Start with random speeds
            yJitter: 0,
            rotation: 0
        }));

        setRacers(initialRacers);
        startTimeRef.current = performance.now();
        
        // Base speed factor depends on desired duration roughly
        // If duration is 10s, we need avg speed to be around 10%/sec aka 0.16 per frame (60fps)
        const baseSpeedFactor = (100 / (duration * 60)) * 1.5; 

        const animate = (time: number) => {
            setRacers(prevRacers => {
                let raceWon = false;
                
                // Play ticking sound randomly for effect
                if (Math.random() < 0.1) playTick();

                const newRacers = prevRacers.map(racer => {
                    const isWinner = racer.student.id === winner.id;
                    
                    // 1. CHAOS ENGINE: Randomly change velocity every frame
                    // Add random acceleration (-0.05 to +0.05)
                    let acceleration = (Math.random() - 0.5) * 0.1;
                    
                    // Occasional speed boost or stumble
                    if (Math.random() < 0.05) acceleration += 0.3; // Boost
                    if (Math.random() < 0.05) acceleration -= 0.2; // Stumble

                    racer.velocity += acceleration;

                    // Clamp velocity to keep it moving forward generally, but varied
                    // Min speed 0.2, Max speed 2.0 (relative multiplier)
                    if (racer.velocity < 0.2) racer.velocity = 0.2;
                    if (racer.velocity > 2.5) racer.velocity = 2.5;

                    // 2. RUBBER BANDING / THE WALL
                    // If not winner, HARD CAP at 96%
                    // If winner, slight boost if lagging behind too much to ensure they don't lose by accident visually (though rare with this logic)
                    if (!isWinner && racer.progress > 96) {
                        racer.velocity = 0; // Hit the invisible wall
                    }

                    // 3. Apply Movement
                    let moveAmount = racer.velocity * baseSpeedFactor;
                    
                    // Fun wobble effect
                    racer.yJitter = Math.sin(time * 0.02 + racer.student.id.length) * 3; // Up/down bounce
                    racer.rotation = Math.sin(time * 0.05) * 10; // Left/right shake

                    const newProgress = racer.progress + moveAmount;

                    // Check Finish
                    if (isWinner && newProgress >= 100) {
                        raceWon = true;
                        return { ...racer, progress: 100 };
                    }

                    return { ...racer, progress: Math.min(newProgress, isWinner ? 100 : 96.5) };
                });

                if (raceWon) {
                    setFinished(true);
                    playWin();
                    setTimeout(() => {
                        fireConfetti();
                        onComplete();
                    }, 500);
                    // Stop loop
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

             <h2 className="text-center text-xl font-bold py-2 uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700 flex justify-between px-4 shadow-lg">
                <span className="flex items-center gap-2">🏁 Đua Tốc Độ Hỗn Loạn</span>
            </h2>
            
            <div className="flex-grow overflow-y-auto px-4 py-8 custom-scrollbar relative">
                {/* Finish Line */}
                <div className="absolute right-12 top-0 bottom-0 w-12 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] bg-contain opacity-80 z-0 border-l-4 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>

                <div className="relative pb-10 pt-2">
                    {racers.map((racer, idx) => {
                        const isWinner = racer.student.id === winner.id;
                        const isRevealed = finished && isWinner;
                        
                        // Stacked cards effect if too many people
                        const stackStyle = isCrowded && idx !== 0 ? { marginTop: '-36px' } : { marginTop: '8px' };
                        
                        // Visual mapping: 0-100 progress maps to roughly 0-90% of screen width to allow avatar width
                        const visualLeft = racer.progress * 0.88; 

                        return (
                            <div key={racer.student.id} 
                                 className="relative w-full group transition-all duration-300 border-b border-dashed border-white/10"
                                 style={{ 
                                     height: '48px',
                                     zIndex: isRevealed ? 100 : (100 - idx),
                                     ...stackStyle
                                 }}
                            >
                                {/* The moving avatar container */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform"
                                    style={{ 
                                        left: `${visualLeft}%`,
                                        transform: `translateY(${racer.yJitter}px) rotate(${racer.rotation}deg)`,
                                        transition: 'left 0.1s linear' // Smooth out the choppy JS updates slightly
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className={`flex flex-col items-center z-10 transform ${isWinner && finished ? 'scale-150' : 'scale-100'}`}>
                                        <span className={`text-4xl filter drop-shadow-md transform scale-x-[-1] transition-transform`}>
                                            {racer.student.avatar}
                                        </span> 
                                        
                                        {/* Dust/Speed Effect when fast */}
                                        {racer.velocity > 1.5 && !finished && (
                                            <div className="absolute top-3 left-0 w-8 h-8 bg-gray-400 blur-md -z-10 animate-ping rounded-full opacity-30"></div>
                                        )}
                                    </div>

                                    {/* Name Bubble */}
                                    <div className={`
                                        ml-2 px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap shadow-md
                                        ${isRevealed 
                                            ? 'bg-yellow-400 text-black border border-yellow-200 scale-125' 
                                            : 'bg-gray-800/80 text-gray-300 border border-gray-600'}
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
        const itemHeight = 80;
        
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
        <div className="flex justify-center items-center h-full">
            <div className="bg-yellow-500 p-4 rounded-xl shadow-2xl border-4 border-yellow-600">
                <div className="bg-white h-[80px] w-[300px] overflow-hidden relative rounded-lg border-2 border-gray-800">
                    <div className="absolute top-1/2 w-full h-[2px] bg-red-500/50 z-10 -translate-y-1/2"></div>
                    <div ref={colRef} className="overflow-hidden h-full">
                        {slots.map((s, i) => (
                            <div key={i} className="h-[80px] flex items-center justify-center text-2xl font-bold text-gray-800 border-b border-gray-100">
                                <span className="mr-3 text-3xl">{s.avatar}</span> {s.name}
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
        <div className="flex flex-col items-center justify-center h-full perspective-800">
            <div className="relative w-64 h-64 mt-20">
                 <motion.div
                    className="absolute left-0 right-0 top-0 flex flex-col items-center justify-center z-10"
                    initial={{ y: 50, scale: 0, opacity: 0 }}
                    animate={isOpen ? { y: -150, scale: 1.2, opacity: 1 } : { y: 50, scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.1 }}
                >
                    <div className="text-8xl drop-shadow-2xl">{winner.avatar}</div>
                    <div className="bg-white px-4 py-2 rounded-lg font-bold text-indigo-700 shadow-xl mt-2 whitespace-nowrap border-2 border-indigo-200">
                        {winner.name}
                    </div>
                </motion.div>

                <motion.div
                    className="absolute top-0 left-0 w-full h-16 bg-red-600 rounded-t-lg z-30 origin-bottom shadow-lg border-b-4 border-red-800"
                    variants={shakeVariants}
                    animate={isOpen ? { rotateX: -110, y: -20 } : "shake"}
                    transition={isOpen ? { duration: 0.6 } : {}}
                    onUpdate={() => { if(!isOpen && Math.random() > 0.8) playTick() }}
                >
                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-8 bg-yellow-400"></div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">🎀</div>
                </motion.div>

                <div className="absolute bottom-0 left-0 w-full h-48 bg-red-500 rounded-b-lg shadow-2xl z-20 flex items-center justify-center overflow-hidden border-t border-black/10">
                     <div className="absolute left-1/2 -translate-x-1/2 h-full w-8 bg-yellow-400"></div>
                     <div className="absolute top-1/2 -translate-y-1/2 w-full h-8 bg-yellow-400"></div>
                </div>
            </div>
             <div className="h-24"></div>
        </div>
    )
}

// --- 6. Spotlight ---
const SpotlightVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [highlightIndex, setHighlightIndex] = useState(0);
    
    // IMPORTANT: Shuffle display list so winner is NOT always at index 0 or first visually.
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
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-4 p-4 overflow-y-auto">
            {displayList.map((student, idx) => (
                <div 
                    key={student.id} 
                    className={`
                        flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 transition-all duration-100
                        ${highlightIndex === idx ? 'scale-125 border-yellow-400 bg-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.8)] z-10' : 'border-gray-200 bg-white opacity-50 grayscale'}
                    `}
                >
                    <div className="text-xl md:text-2xl">{student.avatar}</div>
                    <div className="text-[10px] md:text-xs font-bold truncate w-full text-center px-1">{student.name}</div>
                </div>
            ))}
        </div>
    )
}

// --- 7. Grid Elimination (Updated to random placement) ---
const GridEliminationVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
    
    // Mix the display list so winner position is unknown
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
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-2 p-4 overflow-y-auto">
             <div className="w-full text-center mb-4">
                 <h2 className="text-2xl font-bold text-white drop-shadow-md">Ai sẽ là người cuối cùng?</h2>
             </div>
            {displayList.map((student) => {
                const isEliminated = eliminatedIds.has(student.id);
                const isWinner = student.id === winner.id;
                
                return (
                    <div 
                        key={student.id} 
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-300
                            ${isEliminated ? 'opacity-10 scale-90 bg-gray-800 border-gray-700 blur-sm' : 'bg-white border-indigo-200 shadow-md scale-100'}
                            ${isWinner && eliminatedIds.size === displayList.length - 1 ? 'scale-125 border-yellow-400 bg-yellow-50 shadow-[0_0_40px_rgba(255,255,255,0.8)] z-20' : ''}
                        `}
                    >
                        <div className="text-xl">{student.avatar}</div>
                        <div className={`font-bold text-sm max-w-[100px] truncate ${isEliminated ? 'text-gray-500' : 'text-gray-800'}`}>
                            {student.name}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// --- 8. Flip Card Mode (New) ---
const FlipVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
    const [finalReveal, setFinalReveal] = useState(false);

    // Prepare grid
    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.sort(() => 0.5 - Math.random()); // Shuffle
    });

    useEffect(() => {
        // Elimination sequence
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
        <div className="flex flex-wrap justify-center items-center h-full content-center gap-4 p-8 overflow-y-auto perspective-1000">
             {displayList.map(student => {
                 const isFlipped = flippedIds.has(student.id);
                 const isWinner = student.id === winner.id;
                 const showWinner = finalReveal && isWinner;

                 return (
                     <div key={student.id} className="relative w-24 h-32 md:w-32 md:h-40 perspective-1000 transition-all duration-500">
                         <motion.div 
                            className="w-full h-full relative preserve-3d transition-transform duration-700"
                            animate={{ 
                                rotateY: isFlipped ? 180 : (showWinner ? 360 : 0),
                                scale: showWinner ? 1.5 : 1
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                         >
                             {/* Front */}
                             <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border-2 border-indigo-200 flex flex-col items-center justify-center z-10">
                                 <div className="text-4xl">{student.avatar}</div>
                                 <div className="text-xs font-bold text-center mt-2 px-1">{student.name}</div>
                             </div>
                             
                             {/* Back (Eliminated state) */}
                             <div className="absolute inset-0 backface-hidden bg-gray-200 rounded-xl shadow-inner border-2 border-gray-300 flex items-center justify-center" style={{ transform: 'rotateY(180deg)' }}>
                                 <X className="text-gray-400 opacity-50" size={48} />
                             </div>
                         </motion.div>
                     </div>
                 )
             })}
        </div>
    );
};

// --- 9. Galaxy Mode (New) ---
const GalaxyVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [angleOffset, setAngleOffset] = useState(0);
    const [radius, setRadius] = useState(200);
    const [speed, setSpeed] = useState(0.05);

    const [displayList] = useState(() => {
        const list = [...candidates];
        if (!list.find(c => c.id === winner.id)) list.push(winner);
        return list.slice(0, 20); // Limit to 20 for orbit to look good, or handle more with larger radius
    });

    useEffect(() => {
        let frame = 0;
        let currentAngle = 0;
        let currentSpeed = 0.1; // Initial speed

        const animate = () => {
            currentAngle += currentSpeed;
            setAngleOffset(currentAngle);
            
            // Slow down logic
            const progress = frame / (duration * 60);
            if(progress > 0.5) {
                currentSpeed *= 0.98; // Friction
            }
            if(currentSpeed < 0.002) currentSpeed = 0.002;

            if (progress < 1) {
                frame++;
                requestAnimationFrame(animate);
                if(frame % 10 === 0) playTick();
            } else {
                setRadius(0); // Collapse to sun
                playWin();
                fireConfetti();
                setTimeout(onComplete, 2000);
            }
        };
        requestAnimationFrame(animate);
    }, []);

    return (
        <div className="flex items-center justify-center h-full relative bg-black overflow-hidden">
             {/* Background Stars */}
             <div className="absolute inset-0 opacity-50" style={{backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px)', backgroundSize: '100px 100px'}}></div>

             {/* Central Sun (Winner Reveal) */}
             <div className="absolute z-20 w-32 h-32 rounded-full bg-yellow-400 shadow-[0_0_100px_rgba(253,224,71,0.6)] flex items-center justify-center transition-all duration-1000 scale-100">
                  <div className={`text-6xl transition-opacity duration-1000 ${radius === 0 ? 'opacity-100' : 'opacity-0'}`}>
                      {winner.avatar}
                  </div>
                  {radius === 0 && (
                      <div className="absolute -bottom-12 whitespace-nowrap text-white font-bold text-2xl drop-shadow-md animate-bounce">
                          {winner.name}
                      </div>
                  )}
             </div>

             {/* Orbiting Planets */}
             <div className="relative w-full h-full flex items-center justify-center">
                 {displayList.map((student, idx) => {
                     if(radius === 0 && student.id !== winner.id) return null; // Hide others at end
                     if(radius === 0 && student.id === winner.id) return null; // Handled by sun

                     const angleStep = (2 * Math.PI) / displayList.length;
                     const angle = angleOffset + (idx * angleStep);
                     const x = Math.cos(angle) * radius;
                     const y = Math.sin(angle) * radius;
                     
                     // Responsive radius scaling could be added here
                     const scale = Math.abs(Math.sin(angle)); // Pseudo-3D depth effect? simple for now

                     return (
                         <div 
                            key={student.id}
                            className="absolute flex flex-col items-center transition-all duration-1000"
                            style={{ 
                                transform: `translate(${x}px, ${y}px)`,
                                opacity: radius === 0 ? 0 : 1
                            }}
                         >
                             <div className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{student.avatar}</div>
                             <div className="text-[10px] text-white/80 max-w-[60px] truncate text-center">{student.name}</div>
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
