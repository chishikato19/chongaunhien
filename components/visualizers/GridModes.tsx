
import React, { useEffect, useState } from 'react';
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

// --- Grid Elimination ---
export const GridEliminationVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
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

// --- Flip Card Mode ---
export const FlipVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, duration, onComplete }) => {
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

// --- Lucky Cards Mode (Dealer Style) ---
export const LuckyCardsVisualizer: React.FC<VisualizerProps> = ({ candidates, winner, onComplete }) => {
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

    const cardBackPattern = `repeating-linear-gradient(45deg, #1e3a8a, #1e3a8a 10px, #1d4ed8 10px, #1d4ed8 20px)`;

    return (
        <div className="relative w-full h-full bg-green-800 overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
             
             <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
                 {displayList.map((s, idx) => {
                     const isChosenDealtCard = idx < 5; 
                     const cols = 8;
                     const row = Math.floor(idx / cols);
                     const col = idx % cols;
                     const gridX = (col - 3.5) * 70; 
                     const gridY = (row - 2) * 90;
                     const dealX = (idx - 2) * 160; 
                     
                     let x = 0, y = 0, rotateY = 0, opacity = 1, scale = 1, zIndex = 1;

                     if (phase === 'SHOW_UP') {
                         x = gridX; y = gridY; rotateY = 180;
                     } else if (phase === 'FLIP_DOWN') {
                         x = gridX; y = gridY; rotateY = 0;
                     } else if (phase === 'GATHER' || phase === 'SHUFFLE') {
                         x = 0; y = 0; rotateY = 0;
                         if (phase === 'SHUFFLE') {
                             x = (Math.random() - 0.5) * 20;
                             y = (Math.random() - 0.5) * 20;
                         }
                     } else if (phase === 'DEAL' || phase === 'PICK' || phase === 'REVEAL') {
                         if (isChosenDealtCard) {
                             x = dealX; y = 0; rotateY = 0; scale = 1.6; zIndex = 10;
                             if (phase === 'REVEAL' && revealedCardIndex === idx) {
                                 rotateY = 180; scale = 2.0; zIndex = 50;
                             } else if (phase === 'REVEAL') {
                                 opacity = 0.2;
                             }
                         } else {
                             opacity = 0; 
                         }
                     }

                     const studentToShow = (phase === 'REVEAL' && revealedCardIndex === idx) ? winner : s;

                     return (
                         <motion.div
                            key={s.id}
                            initial={{ x: gridX, y: gridY, rotateY: 180 }}
                            animate={{ x, y, rotateY, opacity, scale, zIndex }}
                            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                            className="absolute w-16 h-24 md:w-24 md:h-36 cursor-pointer"
                            onClick={() => isChosenDealtCard ? handleCardPick(idx) : null}
                            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                         >
                             <div className="absolute inset-0 rounded-lg border-2 border-white shadow-xl flex items-center justify-center overflow-hidden bg-blue-900"
                                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)', background: cardBackPattern }}>
                                  <div className="absolute inset-2 border-2 border-white/30 rounded-md"></div>
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/50 text-xs font-bold">?</div>
                             </div>
                             <div className="absolute inset-0 bg-white rounded-lg border-2 border-yellow-400 shadow-xl flex flex-col items-center justify-center p-1"
                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
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
