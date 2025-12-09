
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

// --- 1. Simple Mode ---
export const SimpleVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
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

// --- 2. Slot Machine ---
export const SlotVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
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
};

// --- 3. Box Visualizer ---
export const BoxVisualizer: React.FC<VisualizerProps> = ({ winner, duration, onComplete }) => {
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

// --- 4. Spotlight ---
export const SpotlightVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [displayList] = useState(candidates);

    useEffect(() => {
        const winnerIndex = displayList.findIndex(s => s.id === winner.id);
        const length = displayList.length;
        const totalDurationMs = duration * 1000;
        
        const desiredSpeed = 120; 
        const approxSteps = Math.floor(totalDurationMs / desiredSpeed);
        
        let loops = Math.floor((approxSteps - winnerIndex) / length);
        if (loops < 2) loops = 2; 

        const totalSteps = (loops * length) + winnerIndex;
        const exactSpeed = totalDurationMs / totalSteps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setHighlightIndex(prev => (prev + 1) % length);
            playTick();

            if (currentStep >= totalSteps) {
                clearInterval(interval);
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
