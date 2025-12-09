import React from 'react';
import { X, HelpCircle, Pin } from 'lucide-react';
import { Student, PresentationMode } from '../types';
import { VisualizationContainer } from './visualizers/VisualizationContainer';

interface GameOverlayProps {
    winner: Student | null;
    roundCandidates: Student[];
    gameMode: PresentationMode;
    duration: number;
    showResultOverlay: boolean;
    scoreAnimation: { value: number, visible: boolean };
    isGroupSpin: boolean;
    groupPoints: number;
    groupMinusPoints: number;
    maxPoints: number;
    minusPoints: number;
    minLuckyPoints: number;
    maxLuckyPoints: number;
    minGroupLuckyPoints: number;
    maxGroupLuckyPoints: number;
    onClose: () => void;
    onComplete: () => void;
    onOpenQuestion: () => void;
    onAddScore: (points: number, close: boolean, type: 'SCORE' | 'LUCKY') => void;
    onPendingAdd: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
    winner, roundCandidates, gameMode, duration, showResultOverlay, scoreAnimation, isGroupSpin,
    groupPoints, groupMinusPoints, maxPoints, minusPoints, minLuckyPoints, maxLuckyPoints, minGroupLuckyPoints, maxGroupLuckyPoints,
    onClose, onComplete, onOpenQuestion, onAddScore, onPendingAdd
}) => {
    if (!winner) return null;

    const isKing = winner.achievements?.includes('KNOWLEDGE_KING');

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={onClose} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
                    <X />
                </button>
            </div>
            {!showResultOverlay ? (
                <div className="flex-grow relative">
                    <VisualizationContainer 
                        mode={gameMode} 
                        candidates={roundCandidates} 
                        winner={winner} 
                        duration={duration} 
                        onComplete={onComplete} 
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in z-50 backdrop-blur-sm">
                    {scoreAnimation.visible ? (
                         <div className="text-center animate-bounce-in">
                             <div className={`text-9xl font-black ${scoreAnimation.value >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                                 {scoreAnimation.value > 0 ? '+' : ''}{scoreAnimation.value}
                             </div>
                             <div className="text-white text-2xl font-bold mt-4 uppercase tracking-widest">
                                 {scoreAnimation.value >= 0 ? 'Điểm thưởng!' : 'Điểm trừ'}
                             </div>
                         </div>
                    ) : (
                        <div className={`bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 relative overflow-hidden transition-all duration-500 ${isKing ? 'border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : 'border-4 border-indigo-500'}`}>
                            {isKing && (
                                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(circle,_gold_10%,_transparent_70%)] animate-pulse"></div>
                            )}
                            
                            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 z-10"><X size={24}/></button>
                            
                            <div className="relative z-10">
                                {isKing && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl animate-bounce z-20">👑</div>
                                )}
                                <div className="text-8xl mb-4 animate-bounce filter drop-shadow-lg relative inline-block">
                                    {winner.avatar}
                                </div>
                                
                                <h1 className={`text-4xl font-black mb-2 ${isKing ? 'text-yellow-600' : 'text-indigo-800'}`}>{winner.name}</h1>
                                
                                {isKing && <div className="mb-4 inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-yellow-300">Vị Vua Tri Thức</div>}

                                {winner.group && !isGroupSpin && (
                                    <div className="mb-8 block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-200 mx-auto w-max">{winner.group}</div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <button onClick={onOpenQuestion} className="col-span-2 py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg hover:bg-pink-700 flex items-center justify-center gap-2 transform hover:scale-105">
                                        <HelpCircle size={24}/><span className="text-xl">Trả lời câu hỏi</span>
                                    </button>
                                    <button onClick={() => onAddScore(isGroupSpin ? groupPoints : maxPoints, true, 'SCORE')} className="py-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 hover:bg-green-100 flex flex-col items-center justify-center">
                                        <span className="text-xl">+{isGroupSpin ? groupPoints : maxPoints}</span>
                                    </button>
                                    <button onClick={() => onAddScore(-(isGroupSpin ? groupMinusPoints : minusPoints), true, 'SCORE')} className="py-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-100 flex flex-col items-center justify-center">
                                        <span className="text-xl">-{isGroupSpin ? groupMinusPoints : minusPoints}</span>
                                    </button>
                                    <button onClick={() => { 
                                        const min = isGroupSpin ? minGroupLuckyPoints : minLuckyPoints; 
                                        const max = isGroupSpin ? maxGroupLuckyPoints : maxLuckyPoints; 
                                        onAddScore(Math.floor(Math.random()*(max-min+1))+min, true, 'LUCKY'); 
                                    }} className="py-4 bg-yellow-50 text-yellow-700 font-bold rounded-xl border border-yellow-200 hover:bg-yellow-100 flex flex-col items-center justify-center">
                                        <span className="text-xl">🎲</span>
                                    </button>
                                    <button onClick={onPendingAdd} className="py-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 flex flex-col items-center justify-center">
                                        <Pin size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameOverlay;