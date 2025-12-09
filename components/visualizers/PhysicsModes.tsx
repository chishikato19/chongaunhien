

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Student } from '../../types';
import { playTick, playWin } from '../../services/sound';
import { fireConfetti } from '../../utils/animationUtils';

interface VisualizerProps {
  candidates: Student[];
  winner: Student;
  duration: number;
  onComplete: () => void;
}

// --- Wheel of Fortune ---
export const WheelVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [currentSelected, setCurrentSelected] = useState("...");
  
  const displayList = [...candidates];
  if (!displayList.find(s => s.id === winner.id)) displayList.push(winner);
  
  // Math for centering the winner
  const winnerIndex = displayList.findIndex(s => s.id === winner.id);
  const segmentAngle = 360 / displayList.length;
  
  // To center the segment at the top (270 degrees in CSS transform), 
  // we calculate where the start of the segment is, then add half a segment.
  // Target = 270 (Top) - (Index * Angle) - (Angle / 2)
  const targetAngle = 270 - (winnerIndex * segmentAngle) - (segmentAngle / 2);
  
  // Add multiple full spins (e.g., 5-10 spins)
  const spins = 10;
  const finalRotation = (360 * spins) + targetAngle;

  useEffect(() => {
    const startTime = performance.now();
    const totalDuration = duration * 1000;
    
    let frameId: number;

    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
        
        const currentRot = finalRotation * ease;
        setRotation(currentRot);

        // Calculate who is currently under the pointer (at 270deg / Top)
        const normalizedRot = currentRot % 360;
        // The pointer is at 270. We reverse calculate which segment index overlaps 270.
        // Rotation moves the wheel.
        // Effective Angle = (SegmentStart + CurrentRot) % 360
        // We want Effective Angle approx 270.
        // logic: index = floor( (270 - currentRot) / segmentAngle ) normalized
        let indexAtPointer = Math.floor((270 - normalizedRot) / segmentAngle);
        indexAtPointer = ((indexAtPointer % displayList.length) + displayList.length) % displayList.length;
        
        setCurrentSelected(displayList[indexAtPointer].name);

        if (progress < 1) {
             // Tick sound every segment pass (rough approximation)
             if (Math.floor(currentRot / segmentAngle) !== Math.floor((finalRotation * (1 - Math.pow(1 - (Math.min((elapsed-16)/totalDuration,1)), 4))) / segmentAngle) && progress < 0.98) {
                 playTick();
             }
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
        <div className="absolute top-4 bg-white/90 backdrop-blur px-8 py-3 rounded-2xl shadow-xl border-4 border-indigo-100 z-30 min-w-[300px] text-center">
             <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Đang quay...</div>
             <div className="text-4xl font-black text-indigo-700 truncate max-w-md mx-auto">{currentSelected}</div>
        </div>

        <div className="relative mt-16 flex-grow flex items-center justify-center">
            {/* POINTER ARROW */}
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-40 filter drop-shadow-xl">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30 60L5 10H55L30 60Z" fill="#DC2626" stroke="white" strokeWidth="4"/>
                    <circle cx="30" cy="10" r="5" fill="white"/>
                </svg>
            </div>

            <div 
                ref={canvasRef}
                className="relative rounded-full border-[12px] border-gray-800 shadow-2xl bg-white overflow-hidden"
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    width: 'min(80vw, 80vh)',
                    height: 'min(80vw, 80vh)',
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

// --- Race Mode ---
interface Racer {
    student: Student;
    progress: number;
    velocity: number;
}

export const RaceVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [racers, setRacers] = useState<Racer[]>([]);
    const [finished, setFinished] = useState(false);
    const requestRef = useRef<number>(0);
    
    useEffect(() => {
        const pool = [...candidates]; 
        const initialRacers: Racer[] = pool.map(s => ({
            student: s,
            progress: 0,
            velocity: Math.random() * 0.5,
        }));

        setRacers(initialRacers);
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
                            <div key={racer.student.id} className="relative w-full group border-b border-dashed border-white/10"
                                 style={{ height: '64px', zIndex: isRevealed ? 100 : (100 - idx), ...stackStyle }}>
                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform" style={{ left: `${visualLeft}%`, transition: 'left 0.1s linear' }}>
                                    <div className={`flex flex-col items-center z-10 transform ${isWinner && finished ? 'scale-150' : 'scale-100'}`}>
                                        <span className={`text-5xl md:text-6xl filter drop-shadow-md transform scale-x-[-1] transition-transform`}>{racer.student.avatar}</span> 
                                        {racer.velocity > 1.5 && !finished && <div className="absolute top-6 left-0 w-10 h-10 bg-gray-400 blur-md -z-10 animate-ping rounded-full opacity-30"></div>}
                                    </div>
                                    <div className={`ml-3 px-3 py-1 rounded-lg text-sm md:text-base font-bold whitespace-nowrap shadow-md ${isRevealed ? 'bg-yellow-400 text-black border-2 border-yellow-200 scale-125 origin-left' : 'bg-gray-800/90 text-gray-200 border border-gray-600'}`}>
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

// --- Galaxy Mode ---
export const GalaxyVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
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
            if(progress > 0.5) currentSpeed *= 0.98; 
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
                  <div className={`text-8xl md:text-9xl transition-opacity duration-1000 ${radius === 0 ? 'opacity-100' : 'opacity-0'}`}>{winner.avatar}</div>
                  {radius === 0 && <div className="absolute -bottom-24 whitespace-nowrap text-white font-black text-5xl drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-bounce">{winner.name}</div>}
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
                         <div key={student.id} className="absolute flex flex-col items-center transition-all duration-1000" style={{ transform: `translate(${x}px, ${y}px)`, opacity: radius === 0 ? 0 : 1 }}>
                             <div className="text-4xl md:text-6xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{student.avatar}</div>
                             <div className="text-xs md:text-sm font-bold text-white/90 max-w-[100px] truncate text-center mt-1 bg-black/50 px-2 rounded">{student.name}</div>
                         </div>
                     )
                 })}
             </div>
        </div>
    )
}

// --- Claw Machine Mode ---
export const ClawMachineVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, onComplete }) => {
    const [displayPrizes] = useState(() => {
        const others = candidates.filter(s => s.id !== winner.id);
        const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 14); 
        const list = [...shuffledOthers];
        const randomPos = Math.floor(Math.random() * (list.length + 1));
        list.splice(randomPos, 0, winner);
        return list;
    });

    const [clawState, setClawState] = useState<'IDLE' | 'OSCILLATING' | 'MOVING_TO_TARGET' | 'DROPPING' | 'GRABBING' | 'LIFTING' | 'REVEAL'>('IDLE');
    const [clawLeft, setClawLeft] = useState(50); 
    const [clawHeight, setClawHeight] = useState(0); 

    useEffect(() => {
        setClawState('OSCILLATING');
        let oscillateTime = 0;
        const oscillateInterval = setInterval(() => {
             oscillateTime += 0.1;
             setClawLeft(50 + Math.sin(oscillateTime) * 40);
        }, 50);

        setTimeout(() => {
            clearInterval(oscillateInterval);
            const winnerIdx = displayPrizes.findIndex(s => s.id === winner.id);
            const itemWidth = 100 / displayPrizes.length;
            const targetLeft = (itemWidth * winnerIdx) + (itemWidth / 2);
            
            setClawState('MOVING_TO_TARGET');
            setClawLeft(targetLeft);

            setTimeout(() => {
                setClawState('DROPPING');
                setClawHeight(70); 

                setTimeout(() => {
                    setClawState('GRABBING');
                    playTick();
                    setTimeout(() => {
                        setClawState('LIFTING');
                        setClawHeight(0); 
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
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#fce7f3_20%,_#fbcfe8_20%)] bg-[length:20px_20px] opacity-50"></div>
            <div className="absolute top-0 w-full h-12 bg-gray-800 z-20 shadow-xl border-b-4 border-gray-600"></div>
            <div className="absolute top-8 z-30 flex flex-col items-center" style={{ left: `${clawLeft}%`, height: '80%', transform: `translateX(-50%)`, transition: clawState === 'OSCILLATING' ? 'left 0.1s linear' : 'left 1s ease-in-out' }}>
                <div className="w-1.5 bg-gray-600 transition-all duration-[1000ms] ease-in-out" style={{ height: `${clawHeight}%` }}></div>
                <div className="relative transition-all duration-[1000ms] ease-in-out" style={{ transform: `translateY(${clawHeight * 5}px)` }}>
                    <div className="w-16 h-12 bg-gray-700 rounded-t-xl border-2 border-gray-500 relative z-10"></div>
                    <motion.div className="absolute top-8 -left-4 w-4 h-16 bg-gray-500 rounded-full origin-top-right border border-gray-700" animate={{ rotate: clawState === 'GRABBING' || clawState === 'LIFTING' || clawState === 'REVEAL' ? 25 : -15 }}></motion.div>
                    <motion.div className="absolute top-8 -right-4 w-4 h-16 bg-gray-500 rounded-full origin-top-left border border-gray-700" animate={{ rotate: clawState === 'GRABBING' || clawState === 'LIFTING' || clawState === 'REVEAL' ? -25 : 15 }}></motion.div>
                    {(clawState === 'LIFTING' || clawState === 'REVEAL') && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 animate-bounce">
                             <div className="relative w-16 h-16 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center">
                                 <div className="text-4xl">{winner.avatar}</div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {clawState === 'REVEAL' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-3xl shadow-2xl z-50 text-center border-8 border-yellow-400">
                    <div className="text-9xl mb-4">{winner.avatar}</div>
                    <div className="text-4xl font-black text-indigo-600">{winner.name}</div>
                </motion.div>
            )}

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