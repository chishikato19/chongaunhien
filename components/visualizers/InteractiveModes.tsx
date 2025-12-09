
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

// --- Dice (Number Slot) Mode ---
export const DiceVisualizer: React.FC<VisualizerProps> = ({ winner, candidates, duration, onComplete }) => {
    const winnerIdx = candidates.findIndex(s => s.id === winner.id) + 1;
    const tens = Math.floor(winnerIdx / 10);
    const units = winnerIdx % 10;
    
    const [stopTensFirst] = useState(() => Math.random() > 0.5);
    const [showIdentity, setShowIdentity] = useState(false);

    const tensRef = useRef<HTMLDivElement>(null);
    const unitsRef = useRef<HTMLDivElement>(null);
    const slotHeight = 200; 
    
    useEffect(() => {
        const totalDuration = duration * 1000;
        const loops = 30;
        const tensTarget = (loops * 10 + tens) * slotHeight;
        const unitsTarget = (loops * 10 + units) * slotHeight;
        const tensDuration = stopTensFirst ? totalDuration : totalDuration + 1500;
        const unitsDuration = stopTensFirst ? totalDuration + 1500 : totalDuration;
        const startTime = performance.now();
        
        const animate = (time: number) => {
            const elapsed = time - startTime;
            if (tensRef.current) {
                const tProg = Math.min(elapsed / tensDuration, 1);
                const ease = 1 - Math.pow(1 - tProg, 4); 
                tensRef.current.scrollTop = tensTarget * ease;
            }
            if (unitsRef.current) {
                const uProg = Math.min(elapsed / unitsDuration, 1);
                const ease = 1 - Math.pow(1 - uProg, 4);
                unitsRef.current.scrollTop = unitsTarget * ease;
            }
            if (elapsed < Math.max(tensDuration, unitsDuration) + 100) { 
                 requestAnimationFrame(animate);
                 if (Math.random() < 0.1) playTick();
            } else {
                 playWin();
                 setTimeout(() => {
                     setShowIdentity(true);
                     fireConfetti();
                     setTimeout(onComplete, 2000);
                 }, 2000); 
            }
        };
        requestAnimationFrame(animate);
    }, []);

    const renderNumbers = (target: number) => {
        const nums = [];
        for(let i=0; i < 35; i++) nums.push(...[0,1,2,3,4,5,6,7,8,9]);
        nums.push(target); 
        return nums.map((n, i) => (
            <div key={i} className="flex items-center justify-center font-mono font-black text-8xl text-gray-800 bg-white border-b border-gray-100 box-border" style={{ height: `${slotHeight}px` }}>{n}</div>
        ));
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-blue-50">
             {!showIdentity ? (
                 <div className="flex gap-4 md:gap-8 items-center bg-gray-900 p-8 rounded-3xl shadow-2xl border-8 border-gray-700">
                     <div className="relative overflow-hidden bg-white rounded-xl shadow-inner border-4 border-gray-400" style={{ width: '150px', height: `${slotHeight}px` }}>
                          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
                          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                          <div ref={tensRef} className="h-full overflow-hidden">{renderNumbers(tens)}</div>
                     </div>
                     <div className="text-white text-6xl font-black">-</div>
                     <div className="relative overflow-hidden bg-white rounded-xl shadow-inner border-4 border-gray-400" style={{ width: '150px', height: `${slotHeight}px` }}>
                          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
                          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                          <div ref={unitsRef} className="h-full overflow-hidden">{renderNumbers(units)}</div>
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

// --- Egg Hatch Mode ---
export const EggHatchVisualizer: React.FC<VisualizerProps> = ({ winner, onComplete }) => {
    const [step, setStep] = useState<'FLY_IN' | 'DROP' | 'CRACK' | 'HATCH'>('FLY_IN');

    useEffect(() => {
        const t1 = setTimeout(() => { setStep('DROP'); playTick(); }, 2000);
        const t2 = setTimeout(() => { setStep('CRACK'); }, 3000);
        const t3 = setTimeout(() => { setStep('HATCH'); playWin(); fireConfetti(); setTimeout(onComplete, 3000); }, 5500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="relative w-full h-full bg-sky-300 overflow-hidden flex flex-col items-center justify-end">
            <div className="absolute bottom-0 w-full h-32 bg-green-500 border-t-8 border-green-600"></div>
            <motion.div className="absolute top-10 left-10 text-9xl opacity-80" animate={{ x: [0, 50, 0] }} transition={{ duration: 10, repeat: Infinity }}>☁️</motion.div>
            <motion.div className="absolute top-[10vh] z-20 flex flex-col items-center" initial={{ x: '-20vw' }} animate={{ x: '120vw' }} transition={{ duration: 4, ease: 'linear' }}>
                <div className="text-[12rem] -mb-10 scale-x-[-1]">🦢</div>
                <div className="text-8xl">🧺</div>
            </motion.div>
            <div className="absolute top-[30vh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                {step !== 'FLY_IN' && (
                    <motion.div
                        initial={{ y: 0, opacity: 0 }}
                        animate={
                            step === 'DROP' ? { y: '50vh', opacity: 1 } : 
                            step === 'CRACK' ? { y: '50vh', opacity: 1, rotate: [0, -10, 10, -10, 10, 0] } :
                            { y: '50vh', opacity: 0, scale: 2 } 
                        }
                        transition={
                            step === 'DROP' ? { type: 'spring', bounce: 0.4, duration: 0.8 } :
                            step === 'CRACK' ? { duration: 0.5, repeat: Infinity } : {}
                        }
                        className="text-9xl relative"
                    >🥚</motion.div>
                )}
                {step === 'HATCH' && (
                    <motion.div
                        initial={{ scale: 0, y: '55vh' }}
                        animate={{ scale: 1.5, y: -200 }} 
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
