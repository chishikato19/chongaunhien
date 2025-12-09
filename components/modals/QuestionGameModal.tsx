import React, { useState, useEffect, useRef } from 'react';
import { Question, Student } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { Play, X, Award, ShieldAlert, GripVertical, Check, ArrowLeft } from 'lucide-react';
import { playTick, playWin } from '../../services/sound';

interface QuestionGameModalProps {
    question: Question;
    winner: Student | null;
    onClose: () => void;
    onStartRandomizer: () => void;
    onCorrectAnswer: () => void; // Parent handles scoring
}

export const QuestionGameModal: React.FC<QuestionGameModalProps> = ({ question, winner, onClose, onStartRandomizer, onCorrectAnswer }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
    
    // Sequence State
    const [sequenceUserOrder, setSequenceUserOrder] = useState<string[]>([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    
    // Matching State
    const [matchingSelectedLeft, setMatchingSelectedLeft] = useState<number | null>(null);
    const [matchingConnections, setMatchingConnections] = useState<Map<number, number>>(new Map());
    const [shuffledRightSide, setShuffledRightSide] = useState<{text: string, originalIndex: number}[]>([]);
    const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Initialize based on question type
        if (question.type === 'SEQUENCE' && question.options) {
            setSequenceUserOrder([...question.options].sort(() => 0.5 - Math.random()));
        }
        if (question.type === 'MATCHING' && question.pairs) {
            setMatchingSelectedLeft(null);
            setMatchingConnections(new Map());
            const rightSide = question.pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
            setShuffledRightSide(rightSide.sort(() => 0.5 - Math.random()));
        }
        setAnswerStatus('IDLE');
        setSelectedOption(null);
    }, [question]);

    const handleCheckMcq = (idx: number) => {
        setSelectedOption(idx);
        if (idx === question.correctAnswer) {
            setAnswerStatus('CORRECT');
            playWin();
            setTimeout(onCorrectAnswer, 1500);
        } else {
            setAnswerStatus('WRONG');
            playTick();
        }
    };

    const handleCheckEssay = (isCorrect: boolean) => {
        if (isCorrect) {
            setAnswerStatus('CORRECT');
            playWin();
            setTimeout(onCorrectAnswer, 1500);
        } else {
            setAnswerStatus('WRONG');
            playTick();
        }
    };

    // --- Sequence Logic ---
    const handleDragStart = (index: number) => setDraggedItemIndex(index);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (targetIndex: number) => {
        if (draggedItemIndex === null) return;
        const newOrder = [...sequenceUserOrder];
        const movedItem = newOrder.splice(draggedItemIndex, 1)[0];
        newOrder.splice(targetIndex, 0, movedItem);
        setSequenceUserOrder(newOrder);
        setDraggedItemIndex(null);
    };

    const handleCheckSequence = () => {
        if (!question.options) return;
        const isCorrect = sequenceUserOrder.every((val, index) => val === question.options![index]);
        if (isCorrect) {
            setAnswerStatus('CORRECT');
            playWin();
            setTimeout(onCorrectAnswer, 2000);
        } else {
            setAnswerStatus('WRONG');
            playTick();
            setTimeout(() => setAnswerStatus('IDLE'), 1000);
        }
    };

    // --- Matching Logic ---
    const handleLeftClick = (index: number) => {
        if (matchingConnections.has(index)) {
            const newMap = new Map(matchingConnections);
            newMap.delete(index);
            setMatchingConnections(newMap);
        } else {
            setMatchingSelectedLeft(index);
        }
    };

    const handleRightClick = (rightIndex: number) => {
        if (matchingSelectedLeft !== null) {
            const newMap = new Map(matchingConnections);
            // remove if this right index was already paired
            for (let [key, val] of newMap.entries()) {
                if (val === rightIndex) newMap.delete(key);
            }
            newMap.set(matchingSelectedLeft, rightIndex);
            setMatchingConnections(newMap);
            setMatchingSelectedLeft(null);
        }
    };

    const handleCheckMatching = () => {
        if (!question.pairs) return;
        let isCorrect = true;
        if (matchingConnections.size !== question.pairs.length) isCorrect = false;
        else {
            matchingConnections.forEach((rightIdxInShuffled, leftIdx) => {
                 if (shuffledRightSide[rightIdxInShuffled].originalIndex !== leftIdx) isCorrect = false;
            });
        }
        if (isCorrect) {
            setAnswerStatus('CORRECT');
            playWin();
            setTimeout(onCorrectAnswer, 2000);
        } else {
            setAnswerStatus('WRONG');
            playTick();
            setTimeout(() => setAnswerStatus('IDLE'), 1000);
        }
    };

    // Draw lines for matching
    const renderMatchingLines = () => {
        if (question.type !== 'MATCHING' || !question.pairs) return null;
        
        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{overflow: 'visible'}}>
                {Array.from(matchingConnections.entries()).map(([leftIdx, rightIdx]) => {
                    const leftEl = leftRefs.current[leftIdx];
                    const rightEl = rightRefs.current[rightIdx];
                    if (!leftEl || !rightEl) return null;

                    // Get relative coordinates within the modal content area?
                    // Simpler: use getBoundingClientRect but we need relative to SVG container
                    // Actually, the SVG is absolute inset-0 of the container. 
                    // Let's assume the container is relative.
                    const container = leftEl.closest('.matching-container');
                    if (!container) return null;
                    const cRect = container.getBoundingClientRect();
                    const lRect = leftEl.getBoundingClientRect();
                    const rRect = rightEl.getBoundingClientRect();

                    const x1 = lRect.right - cRect.left;
                    const y1 = lRect.top + lRect.height / 2 - cRect.top;
                    const x2 = rRect.left - cRect.left;
                    const y2 = rRect.top + rRect.height / 2 - cRect.top;

                    return (
                        <line 
                            key={`${leftIdx}-${rightIdx}`}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={answerStatus === 'CORRECT' ? '#22c55e' : answerStatus === 'WRONG' ? '#ef4444' : '#6366f1'}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    );
                })}
                {matchingSelectedLeft !== null && leftRefs.current[matchingSelectedLeft] && (
                     // Draw a pending line to mouse? (Too complex for now)
                     // Just highlight the node
                     null
                )}
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-4">
                   <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest text-white shadow-md
                       ${question.type === 'MCQ' ? 'bg-blue-500' : question.type === 'SEQUENCE' ? 'bg-purple-600' : question.type === 'MATCHING' ? 'bg-indigo-600' : 'bg-orange-500'}
                   `}>
                       {question.type === 'MCQ' ? 'TRẮC NGHIỆM' : question.type === 'SEQUENCE' ? 'SẮP XẾP' : question.type === 'MATCHING' ? 'GHÉP NỐI' : 'TỰ LUẬN'}
                   </span>
                </div>
                <button onClick={onClose} className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600"><X size={28}/></button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center p-8 overflow-y-auto bg-white relative">
                <div className="max-w-5xl w-full text-center mb-8 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-800 leading-tight mb-6">
                        <MathRenderer text={question.content} />
                    </h2>
                    {question.image && (
                       <div className="mt-6 flex justify-center">
                           <img src={question.image} alt="Question" className="max-h-[35vh] rounded-2xl border-4 border-gray-100 shadow-xl"/>
                       </div>
                    )}
                </div>

                {!winner && (
                     <div className="mb-8">
                         <button onClick={onStartRandomizer} className="bg-indigo-600 text-white text-xl font-bold px-8 py-4 rounded-full shadow-xl hover:bg-indigo-700 animate-bounce flex items-center gap-3">
                             <Play size={24} fill="currentColor"/> Quay số tìm người trả lời
                         </button>
                     </div>
                )}
                
                <div className={`transition-opacity duration-500 w-full flex justify-center ${!winner ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {question.type === 'MCQ' && question.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                            {question.options.map((opt, idx) => {
                                let btnClass = "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:shadow-lg";
                                if (selectedOption === idx) {
                                    if (answerStatus === 'CORRECT') btnClass = "bg-green-500 text-white border-green-600 shadow-xl scale-105";
                                    else if (answerStatus === 'WRONG') btnClass = "bg-red-500 text-white border-red-600 shadow-xl";
                                    else btnClass = "bg-blue-50 border-blue-500 text-blue-700 shadow-md"; 
                                } else if (answerStatus === 'WRONG' && idx === question.correctAnswer) {
                                    btnClass = "bg-green-100 text-green-800 border-green-300 animate-pulse";
                                }
                                return (
                                    <button key={idx} onClick={() => handleCheckMcq(idx)} disabled={answerStatus !== 'IDLE'} className={`p-6 rounded-2xl text-left font-bold text-xl transition-all flex items-center gap-4 ${btnClass}`}>
                                        <span className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-lg border border-black/5 flex-shrink-0">{String.fromCharCode(65 + idx)}</span>
                                        <span><MathRenderer text={opt} /></span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {question.type === 'SEQUENCE' && (
                        <div className="w-full max-w-3xl mx-auto">
                            <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 mb-8">
                                <p className="text-center text-purple-800 font-bold mb-4 flex items-center justify-center gap-2"><GripVertical size={20}/> Kéo thả để sắp xếp</p>
                                <div className="space-y-3">
                                    {sequenceUserOrder.map((step, idx) => (
                                        <div key={idx} draggable={answerStatus === 'IDLE'} onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} className={`p-4 bg-white rounded-xl shadow-sm border-2 cursor-grab active:cursor-grabbing flex items-center gap-4 transition-all ${answerStatus === 'CORRECT' ? 'border-green-400 bg-green-50' : answerStatus === 'WRONG' ? 'border-red-300' : 'border-gray-200 hover:border-purple-300'}`}>
                                            <div className="text-gray-300"><GripVertical /></div>
                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">{idx + 1}</div>
                                            <div className="font-bold text-gray-700 text-lg"><MathRenderer text={step} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {answerStatus === 'IDLE' && <button onClick={handleCheckSequence} className="w-full py-4 bg-purple-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-purple-700">KIỂM TRA ĐÁP ÁN</button>}
                        </div>
                    )}

                    {question.type === 'MATCHING' && question.pairs && (
                         <div className="w-full max-w-5xl mx-auto matching-container relative">
                             {/* SVG Overlay for Lines */}
                             {renderMatchingLines()}
                             
                             <div className="grid grid-cols-2 gap-16 md:gap-32 relative z-20">
                                 <div className="space-y-6">
                                     {question.pairs.map((pair, idx) => {
                                         const isSelected = matchingSelectedLeft === idx;
                                         const isConnected = matchingConnections.has(idx);
                                         return (
                                             <div 
                                                key={idx} 
                                                ref={el => { leftRefs.current[idx] = el; }}
                                                onClick={() => answerStatus === 'IDLE' && handleLeftClick(idx)} 
                                                className={`p-4 rounded-xl border-2 font-bold text-lg cursor-pointer transition-all relative flex items-center
                                                ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105' : isConnected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                                             >
                                                 <span className="mr-4 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">{idx + 1}</span>
                                                 <MathRenderer text={pair.left} />
                                                 {/* Connector Dot */}
                                                 <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : isSelected ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                             </div>
                                         )
                                     })}
                                 </div>
                                 <div className="space-y-6">
                                     {shuffledRightSide.map((item, idx) => {
                                         let connectedLeftIndex = -1;
                                         matchingConnections.forEach((rightIdx, leftIdx) => { if (rightIdx === idx) connectedLeftIndex = leftIdx; });
                                         const isConnected = connectedLeftIndex !== -1;
                                         return (
                                             <div 
                                                key={idx} 
                                                ref={el => { rightRefs.current[idx] = el; }}
                                                onClick={() => answerStatus === 'IDLE' && handleRightClick(idx)} 
                                                className={`p-4 rounded-xl border-2 font-bold text-lg cursor-pointer transition-all relative flex items-center justify-between
                                                ${isConnected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                                             >
                                                  {/* Connector Dot */}
                                                 <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                 <MathRenderer text={item.text} />
                                                 <span className="ml-4 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center">{String.fromCharCode(65+idx)}</span>
                                             </div>
                                         )
                                     })}
                                 </div>
                             </div>
                             {answerStatus === 'IDLE' && <div className="mt-12 text-center"><button onClick={handleCheckMatching} className="px-12 py-4 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700">KIỂM TRA CẶP</button></div>}
                             
                             {answerStatus !== 'IDLE' && (
                                 <div className="mt-8 text-center bg-gray-100 p-4 rounded-lg">
                                     <h4 className="font-bold text-gray-500 mb-2">ĐÁP ÁN ĐÚNG:</h4>
                                     <div className="flex flex-wrap gap-4 justify-center">
                                         {question.pairs.map((p, i) => {
                                             // Find index in shuffled right side
                                             const rightIdx = shuffledRightSide.findIndex(r => r.originalIndex === i);
                                             return (
                                                 <span key={i} className="bg-white px-3 py-1 rounded border shadow-sm text-sm">
                                                     <b>{i+1}</b> - <b>{String.fromCharCode(65+rightIdx)}</b>
                                                 </span>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                         </div>
                    )}

                    {question.type === 'ESSAY' && answerStatus === 'IDLE' && (
                        <div className="flex gap-6 justify-center mt-12">
                            <button onClick={() => handleCheckEssay(true)} className="flex items-center gap-3 px-10 py-5 bg-green-500 text-white rounded-2xl font-black text-xl hover:bg-green-600 shadow-xl"><Check size={28}/> TRẢ LỜI ĐÚNG</button>
                            <button onClick={() => handleCheckEssay(false)} className="flex items-center gap-3 px-10 py-5 bg-red-500 text-white rounded-2xl font-black text-xl hover:bg-red-600 shadow-xl"><X size={28}/> TRẢ LỜI SAI</button>
                        </div>
                    )}

                    {answerStatus !== 'IDLE' && (
                        <div className={`mt-8 animate-bounce-in p-6 rounded-2xl shadow-xl border-4 backdrop-blur-sm mx-auto max-w-lg ${answerStatus === 'CORRECT' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {answerStatus === 'CORRECT' ? <div className="font-black text-4xl flex items-center justify-center gap-3"><Award size={48}/> CHÍNH XÁC!</div> : <div className="font-black text-4xl flex items-center justify-center gap-3"><ShieldAlert size={48}/> SAI RỒI!</div>}
                        </div>
                    )}
                </div>
                
                {winner && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
                         <div className="bg-white px-6 py-3 rounded-full shadow-2xl border-2 border-indigo-100 flex items-center gap-4 animate-slide-up">
                             <span className="text-3xl">{winner.avatar}</span>
                             <div className="flex flex-col">
                                 <span className="text-xs text-gray-500 font-bold uppercase">Người chơi</span>
                                 <span className="font-black text-gray-800 text-lg">{winner.name}</span>
                             </div>
                             <button onClick={onClose} className="ml-4 p-2 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full"><X size={16}/></button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};