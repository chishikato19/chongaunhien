

import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import { generateId } from '../services/storage.service';
import { Plus, Trash2, HelpCircle, AlertCircle, Save, RefreshCcw, Edit, X, Calculator, GripVertical, Shuffle } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface QuestionManagerProps {
    questions: Question[];
    onUpdateQuestions: (questions: Question[]) => void;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ questions, onUpdateQuestions }) => {
    const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT'>('LIST');
    const [importText, setImportText] = useState('');
    const [debugLog, setDebugLog] = useState<string[]>([]);
    
    // Manual Entry State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newQuestionContent, setNewQuestionContent] = useState('');
    const [newQuestionType, setNewQuestionType] = useState<QuestionType>('ESSAY');
    const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']); // A, B, C, D
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
    // Sequence State
    const [sequenceSteps, setSequenceSteps] = useState<string[]>(['', '', '']);
    // Matching State
    const [matchingPairs, setMatchingPairs] = useState<{left: string, right: string}[]>([{left: '', right: ''}, {left: '', right: ''}]);

    // --- Actions ---
    const deleteQuestion = (id: string) => {
        if(window.confirm("Xóa câu hỏi này?")) {
            onUpdateQuestions(questions.filter(q => q.id !== id));
            if (editingId === id) cancelEditing();
        }
    };

    const resetQuestionStatus = () => {
        if(window.confirm("Bạn có chắc muốn đặt lại trạng thái 'Đã trả lời' cho tất cả câu hỏi?")) {
            const resetQuestions = questions.map(q => ({ ...q, isAnswered: false }));
            onUpdateQuestions(resetQuestions);
            alert("Đã reset trạng thái câu hỏi!");
        }
    };

    const startEditing = (q: Question) => {
        setEditingId(q.id);
        setNewQuestionContent(q.content);
        setNewQuestionType(q.type);
        if (q.type === 'MCQ') {
            setMcqOptions(q.options || ['', '', '', '']);
            setCorrectAnswerIndex(q.correctAnswer || 0);
        } else if (q.type === 'SEQUENCE') {
            setSequenceSteps(q.options || ['', '', '']);
        } else if (q.type === 'MATCHING') {
            setMatchingPairs(q.pairs || [{left: '', right: ''}, {left: '', right: ''}]);
        } else {
             setMcqOptions(['', '', '', '']);
             setCorrectAnswerIndex(0);
        }
        // Ensure we are on the list tab to see the form
        setActiveTab('LIST');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewQuestionContent('');
        setNewQuestionType('ESSAY');
        setMcqOptions(['', '', '', '']);
        setSequenceSteps(['', '', '']);
        setMatchingPairs([{left: '', right: ''}, {left: '', right: ''}]);
        setCorrectAnswerIndex(0);
    };

    const saveQuestion = () => {
        if(!newQuestionContent.trim()) {
            alert("Vui lòng nhập nội dung câu hỏi!");
            return;
        }

        if (newQuestionType === 'MCQ') {
            const filteredOptions = mcqOptions.filter(o => o.trim() !== '');
            if (filteredOptions.length < 2) {
                alert("Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn!");
                return;
            }
        }

        if (newQuestionType === 'SEQUENCE') {
            const filteredSteps = sequenceSteps.filter(s => s.trim() !== '');
            if (filteredSteps.length < 2) {
                alert("Câu hỏi sắp xếp cần ít nhất 2 bước!");
                return;
            }
        }

        if (newQuestionType === 'MATCHING') {
             const filteredPairs = matchingPairs.filter(p => p.left.trim() !== '' && p.right.trim() !== '');
             if (filteredPairs.length < 2) {
                 alert("Câu hỏi ghép nối cần ít nhất 2 cặp!");
                 return;
             }
        }

        if (editingId) {
            // Update existing
            const updatedQuestions = questions.map(q => {
                if (q.id === editingId) {
                    const updatedQ: Question = {
                        ...q,
                        content: newQuestionContent,
                        type: newQuestionType,
                    };
                    if (newQuestionType === 'MCQ') {
                         updatedQ.options = mcqOptions;
                         updatedQ.correctAnswer = correctAnswerIndex;
                    } else if (newQuestionType === 'SEQUENCE') {
                         updatedQ.options = sequenceSteps.filter(s => s.trim() !== '');
                    } else if (newQuestionType === 'MATCHING') {
                        updatedQ.pairs = matchingPairs.filter(p => p.left.trim() !== '' || p.right.trim() !== '');
                    }
                    return updatedQ;
                }
                return q;
            });
            onUpdateQuestions(updatedQuestions);
            cancelEditing();
        } else {
            // Add new
            let newQ: Question = {
                id: generateId(),
                content: newQuestionContent,
                type: newQuestionType,
                isAnswered: false
            };

            if (newQuestionType === 'MCQ') {
                newQ.options = mcqOptions;
                newQ.correctAnswer = correctAnswerIndex;
            } else if (newQuestionType === 'SEQUENCE') {
                newQ.options = sequenceSteps.filter(s => s.trim() !== '');
            } else if (newQuestionType === 'MATCHING') {
                newQ.pairs = matchingPairs.filter(p => p.left.trim() !== '' || p.right.trim() !== '');
            }

            onUpdateQuestions([...questions, newQ]);
            
            // Reset Form
            setNewQuestionContent('');
            setMcqOptions(['', '', '', '']);
            setSequenceSteps(['', '', '']);
            setMatchingPairs([{left: '', right: ''}, {left: '', right: ''}]);
            setCorrectAnswerIndex(0);
        }
    };

    const updateMcqOption = (index: number, value: string) => {
        const newOpts = [...mcqOptions];
        newOpts[index] = value;
        setMcqOptions(newOpts);
    };

    const updateSequenceStep = (index: number, value: string) => {
        const newSteps = [...sequenceSteps];
        newSteps[index] = value;
        setSequenceSteps(newSteps);
    };

    const addSequenceStep = () => {
        setSequenceSteps([...sequenceSteps, '']);
    };

    const removeSequenceStep = (index: number) => {
        if (sequenceSteps.length <= 2) return;
        setSequenceSteps(sequenceSteps.filter((_, i) => i !== index));
    };

    // Matching Helpers
    const updatePair = (index: number, field: 'left' | 'right', value: string) => {
        const newPairs = [...matchingPairs];
        newPairs[index][field] = value;
        setMatchingPairs(newPairs);
    };
    const addPair = () => setMatchingPairs([...matchingPairs, {left: '', right: ''}]);
    const removePair = (index: number) => {
        if (matchingPairs.length <= 2) return;
        setMatchingPairs(matchingPairs.filter((_, i) => i !== index));
    };

    const addToLog = (msg: string) => setDebugLog(prev => [...prev, msg]);

    const processImport = () => {
        setDebugLog([]);
        addToLog("--- BẮT ĐẦU PHÂN TÍCH ---");
        
        const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
        const parsedQuestions: Question[] = [];
        let currentQ: Partial<Question> | null = null;
        let currentOptions: string[] = [];
        let currentSequenceSteps: string[] = []; // NEW
        let currentPairs: {left: string, right: string}[] = [];

        // Regex helpers
        // Detect "Câu 1:", "Bài 1:", "Question 1:", "1.", "1)" ONLY if it seems to be a header
        // For import, we need to be strict. Let's assume Question starts with "Câu", "Bài", "Question" followed by number
        const questionStartRegex = /^(Câu|Bài|Question)\s*\d+[:.]?/i;
        
        const optionRegex = /^([A-D])\./i;
        const answerRegex = /^(Đáp án|Answer|Result)[:\s]*([A-D])/i;
        const matchingPairRegex = /^(.*?)(\|)(.*)$/; 
        // Sequence regex: lines starting with "1.", "2.", "-" inside a question block that ISN'T MCQ
        const sequenceStepRegex = /^(\d+\.|-)\s+(.*)/;

        const saveCurrent = () => {
             if (currentQ) {
                if (currentOptions.length > 0) {
                    currentQ.type = 'MCQ';
                    currentQ.options = [...currentOptions];
                } else if (currentPairs.length > 0) {
                    currentQ.type = 'MATCHING';
                    currentQ.pairs = [...currentPairs];
                } else if (currentSequenceSteps.length > 0) {
                    currentQ.type = 'SEQUENCE';
                    currentQ.options = [...currentSequenceSteps];
                } else {
                    currentQ.type = 'ESSAY';
                }

                if(currentQ.content) {
                    currentQ.isAnswered = false;
                    parsedQuestions.push(currentQ as Question);
                    addToLog(`-> Saved previous question: ${currentQ.type} - ${currentQ.content?.substring(0, 20)}...`);
                }
            }
        };

        lines.forEach((line, idx) => {
            addToLog(`Line ${idx + 1}: "${line}"`);

            // 1. Detect New Question
            if (questionStartRegex.test(line)) {
                saveCurrent();

                // Start new
                let content = line.replace(questionStartRegex, '').trim();
                if (!content) content = line; // Backup if replace wipes it

                currentQ = {
                    id: generateId(),
                    content: content,
                    type: 'ESSAY', // Default
                };
                currentOptions = [];
                currentPairs = [];
                currentSequenceSteps = [];
                addToLog(`-> New Question detected`);
            } 
            // 2. Detect Matching Pair (using | separator)
            else if (currentQ && line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    const left = parts[0].trim();
                    const right = parts.slice(1).join('|').trim(); // Join rest in case | exists in content
                    currentPairs.push({left, right});
                    addToLog(`-> Found Pair: ${left} <-> ${right}`);
                }
            }
            // 3. Detect MCQ Options (A. B. C. D.)
            else if (currentQ && optionRegex.test(line)) {
                const optContent = line.replace(optionRegex, '').trim();
                currentOptions.push(optContent);
                addToLog(`-> Found MCQ Option: ${optContent}`);
            }
            // 4. Detect Answer (For MCQ)
            else if (currentQ && answerRegex.test(line)) {
                const match = line.match(answerRegex);
                if (match && match[2]) {
                    const charCode = match[2].toUpperCase().charCodeAt(0) - 65; // A=0, B=1
                    currentQ.correctAnswer = charCode;
                    addToLog(`-> Found Answer Index: ${charCode} (${match[2]})`);
                }
            }
            // 5. Detect Sequence Steps (1. Step, - Step) IF not MCQ and not Matching
            else if (currentQ && sequenceStepRegex.test(line) && currentOptions.length === 0 && currentPairs.length === 0) {
                 const match = line.match(sequenceStepRegex);
                 if (match && match[2]) {
                     currentSequenceSteps.push(match[2].trim());
                     addToLog(`-> Found Sequence Step: ${match[2].trim()}`);
                 }
            }
            // 6. Append to content if it's a continuation
            else if (currentQ && currentOptions.length === 0 && currentPairs.length === 0 && currentSequenceSteps.length === 0) {
                 // Only append if it doesn't look like a start of something else
                 currentQ.content += " " + line;
            }
        });

        saveCurrent();

        addToLog(`--- KẾT THÚC: Tìm thấy ${parsedQuestions.length} câu hỏi ---`);
        if (parsedQuestions.length > 0) {
            onUpdateQuestions([...questions, ...parsedQuestions]);
            alert(`Đã nhập thành công ${parsedQuestions.length} câu hỏi!`);
            setImportText('');
        } else {
            alert("Không tìm thấy câu hỏi nào. Vui lòng kiểm tra lại định dạng (Bắt đầu bằng 'Câu X:')");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="text-pink-600" /> Ngân Hàng Câu Hỏi
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('LIST')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'LIST' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        Danh sách ({questions.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('IMPORT')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'IMPORT' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        Nhập từ Word/Text
                    </button>
                </div>
            </div>

            {activeTab === 'LIST' && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Manual Entry Form */}
                    <div className={`bg-gray-50 p-4 rounded-xl border-2 mb-4 space-y-3 ${editingId ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}>
                         <div className="flex justify-between items-center mb-1">
                             <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                 {editingId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
                                 <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded normal-case font-normal flex items-center gap-1">
                                    <Calculator size={10} /> Hỗ trợ LaTeX: $$...$$
                                 </span>
                             </h3>
                             {editingId && (
                                 <button onClick={cancelEditing} className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600">
                                     <X size={12}/> Hủy bỏ
                                 </button>
                             )}
                         </div>
                         <div className="flex gap-2">
                            <select 
                                value={newQuestionType} 
                                onChange={(e) => setNewQuestionType(e.target.value as QuestionType)}
                                className="border rounded-lg px-3 py-2 bg-white text-sm font-bold shadow-sm"
                            >
                                <option value="ESSAY">Tự luận</option>
                                <option value="MCQ">Trắc nghiệm</option>
                                <option value="SEQUENCE">Sắp xếp</option>
                                <option value="MATCHING">Ghép nối</option>
                            </select>
                            <div className="flex-grow flex flex-col">
                                <input 
                                    value={newQuestionContent}
                                    onChange={(e) => setNewQuestionContent(e.target.value)}
                                    placeholder="Nhập nội dung câu hỏi..."
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none shadow-sm"
                                />
                                {newQuestionContent.includes('$') && (
                                    <div className="mt-1 text-sm bg-white border p-2 rounded-md text-gray-700">
                                        <span className="text-xs font-bold text-gray-400 block">Xem trước:</span>
                                        <MathRenderer text={newQuestionContent} />
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* MCQ Options */}
                         {newQuestionType === 'MCQ' && (
                             <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-gray-200">
                                 {['A', 'B', 'C', 'D'].map((label, idx) => (
                                     <div key={label} className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2">
                                            <input 
                                                type="radio" 
                                                name="correctAnswer" 
                                                checked={correctAnswerIndex === idx}
                                                onChange={() => setCorrectAnswerIndex(idx)}
                                                className="w-4 h-4 accent-green-600 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold text-gray-500 w-4">{label}.</span>
                                            <input 
                                                className="flex-grow border rounded px-2 py-1 text-sm focus:border-pink-500 outline-none" 
                                                placeholder={`Lựa chọn ${label}`}
                                                value={mcqOptions[idx]}
                                                onChange={(e) => updateMcqOption(idx, e.target.value)}
                                            />
                                         </div>
                                         {mcqOptions[idx].includes('$') && (
                                             <div className="ml-8 text-xs text-gray-600">
                                                 <MathRenderer text={mcqOptions[idx]} />
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         )}
                         
                         {/* Sequence Steps */}
                         {newQuestionType === 'SEQUENCE' && (
                             <div className="bg-white p-3 rounded-lg border border-gray-200">
                                 <div className="text-xs text-gray-500 font-bold mb-2 uppercase">Nhập các bước theo THỨ TỰ ĐÚNG (Hệ thống sẽ tự xáo trộn khi chơi):</div>
                                 <div className="space-y-2">
                                     {sequenceSteps.map((step, idx) => (
                                         <div key={idx} className="flex items-center gap-2">
                                             <span className="text-gray-400 font-bold w-6 text-right">{idx + 1}.</span>
                                             <input 
                                                 className="flex-grow border rounded px-2 py-1 text-sm focus:border-pink-500 outline-none"
                                                 placeholder={`Bước ${idx + 1}...`}
                                                 value={step}
                                                 onChange={(e) => updateSequenceStep(idx, e.target.value)}
                                             />
                                             <button onClick={() => removeSequenceStep(idx)} className="text-red-400 hover:text-red-600 p-1" disabled={sequenceSteps.length <= 2}>
                                                 <Trash2 size={16}/>
                                             </button>
                                         </div>
                                     ))}
                                     <button onClick={addSequenceStep} className="ml-8 text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-1">
                                         <Plus size={12}/> Thêm bước
                                     </button>
                                 </div>
                             </div>
                         )}

                         {/* Matching Pairs */}
                         {newQuestionType === 'MATCHING' && (
                             <div className="bg-white p-3 rounded-lg border border-gray-200">
                                 <div className="text-xs text-gray-500 font-bold mb-2 uppercase">Nhập các cặp tương ứng (Hệ thống sẽ xáo trộn cột phải khi chơi):</div>
                                 <div className="space-y-2">
                                     {matchingPairs.map((pair, idx) => (
                                         <div key={idx} className="flex items-center gap-2">
                                             <div className="flex-1 flex flex-col">
                                                 <input 
                                                     className="w-full border rounded px-2 py-1 text-sm focus:border-pink-500 outline-none"
                                                     placeholder={`Vế trái ${idx + 1}`}
                                                     value={pair.left}
                                                     onChange={(e) => updatePair(idx, 'left', e.target.value)}
                                                 />
                                             </div>
                                             <div className="text-gray-400 font-bold">↔</div>
                                             <div className="flex-1 flex flex-col">
                                                 <input 
                                                     className="w-full border rounded px-2 py-1 text-sm focus:border-pink-500 outline-none"
                                                     placeholder={`Vế phải ${idx + 1}`}
                                                     value={pair.right}
                                                     onChange={(e) => updatePair(idx, 'right', e.target.value)}
                                                 />
                                             </div>
                                             <button onClick={() => removePair(idx)} className="text-red-400 hover:text-red-600 p-1" disabled={matchingPairs.length <= 2}>
                                                 <Trash2 size={16}/>
                                             </button>
                                         </div>
                                     ))}
                                     <button onClick={addPair} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-1">
                                         <Plus size={12}/> Thêm cặp
                                     </button>
                                 </div>
                             </div>
                         )}

                         <div className="flex justify-end">
                            <button onClick={saveQuestion} className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 font-bold flex items-center gap-2 shadow-sm">
                                {editingId ? <><Save size={18}/> Lưu Thay Đổi</> : <><Plus size={18}/> Thêm Câu Hỏi</>}
                            </button>
                         </div>
                    </div>

                    {/* Reset Button */}
                    {questions.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button onClick={resetQuestionStatus} className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600">
                                <RefreshCcw size={12}/> Reset trạng thái "Đã trả lời"
                            </button>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {questions.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Chưa có câu hỏi nào. Hãy nhập thêm!</div>
                        ) : (
                            questions.map((q, idx) => (
                                <div key={q.id} className={`border rounded-lg p-4 transition-colors ${editingId === q.id ? 'border-pink-500 ring-2 ring-pink-100 bg-white' : q.isAnswered ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-pink-300 shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold">#{idx+1}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${q.type === 'MCQ' ? 'bg-blue-500' : q.type === 'SEQUENCE' ? 'bg-purple-500' : q.type === 'MATCHING' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                                                    {q.type === 'MCQ' ? 'Trắc nghiệm' : q.type === 'SEQUENCE' ? 'Sắp xếp' : q.type === 'MATCHING' ? 'Ghép nối' : 'Tự luận'}
                                                </span>
                                                {q.isAnswered && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-green-100 text-green-700 border border-green-200">
                                                        Đã trả lời
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`font-medium ${q.isAnswered ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                <MathRenderer text={q.content} />
                                            </div>
                                            {q.type === 'MCQ' && q.options && (
                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`text-xs p-1.5 rounded border ${i === q.correctAnswer ? 'bg-green-50 border-green-300 text-green-800 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}>
                                                            {String.fromCharCode(65+i)}. <MathRenderer text={opt} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'SEQUENCE' && q.options && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 flex items-center gap-1">
                                                            <span className="font-bold text-purple-400">{i+1}.</span> <MathRenderer text={opt} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'MATCHING' && q.pairs && (
                                                <div className="mt-2 space-y-1">
                                                    {q.pairs.map((pair, i) => (
                                                        <div key={i} className="text-xs text-gray-600 flex gap-2">
                                                            <span className="font-bold">•</span>
                                                            <span><MathRenderer text={pair.left} /></span>
                                                            <span>↔</span>
                                                            <span><MathRenderer text={pair.right} /></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => startEditing(q)} className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded" title="Sửa">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => deleteQuestion(q.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded" title="Xóa">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'IMPORT' && (
                <div className="flex flex-col h-full gap-4">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 overflow-y-auto">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={16}/> Hướng dẫn nhập nhanh (Copy từ Word)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-bold text-xs uppercase mb-1">1. Định dạng chung</p>
                                <p className="text-xs mb-2">Mỗi câu hỏi phải bắt đầu bằng <b>"Câu X:"</b> hoặc <b>"Bài X:"</b>.</p>
                                
                                <p className="font-bold text-xs uppercase mb-1">2. Trắc nghiệm</p>
                                <pre className="bg-white p-2 rounded border text-[10px] mb-2">
                                    Câu 1: 1 + 1 bằng mấy?{"\n"}
                                    A. 1{"\n"}
                                    B. 2{"\n"}
                                    Đáp án: B
                                </pre>

                                <p className="font-bold text-xs uppercase mb-1">3. Ghép nối (Dùng dấu |)</p>
                                <pre className="bg-white p-2 rounded border text-[10px]">
                                    Câu 2: Ghép thủ đô{"\n"}
                                    Việt Nam | Hà Nội{"\n"}
                                    Nhật Bản | Tokyo
                                </pre>
                            </div>
                            <div>
                                <p className="font-bold text-xs uppercase mb-1">4. Sắp xếp (Dùng số thứ tự)</p>
                                <pre className="bg-white p-2 rounded border text-[10px] mb-2">
                                    Câu 3: Quy trình rửa tay{"\n"}
                                    1. Làm ướt tay{"\n"}
                                    2. Lấy xà phòng{"\n"}
                                    3. Chà tay
                                </pre>
                                <p className="text-[10px] italic text-gray-500">Lưu ý: Nhập theo thứ tự đúng. Hệ thống sẽ tự xáo trộn.</p>

                                <p className="font-bold text-xs uppercase mb-1 mt-2">5. Tự luận & Toán</p>
                                <pre className="bg-white p-2 rounded border text-[10px]">
                                    Câu 4: Cảm nghĩ về bài thơ.{"\n\n"}
                                    Câu 5: Tính $$ \frac&#123;1&#125;&#123;2&#125; + x $$
                                </pre>
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                         <div className="flex flex-col">
                             <label className="text-xs font-bold text-gray-500 mb-1">Dán nội dung vào đây:</label>
                             <textarea 
                                className="flex-grow w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none font-mono"
                                placeholder={`Câu 1: Câu hỏi tự luận...\n\nCâu 2: Trắc nghiệm?\nA. Đúng\nB. Sai\nĐáp án: A\n\nCâu 3: Sắp xếp\n1. Bước một\n2. Bước hai`}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                            ></textarea>
                         </div>
                         <div className="flex flex-col bg-gray-900 rounded-lg p-3 overflow-hidden">
                             <div className="flex justify-between items-center mb-1">
                                 <label className="text-xs font-bold text-gray-400">Debug Log (Nhật ký xử lý):</label>
                                 <span className="text-xs text-gray-600">Kiểm tra lỗi tại đây</span>
                             </div>
                             <div className="flex-grow overflow-y-auto font-mono text-xs text-green-400 space-y-1 custom-scrollbar">
                                 {debugLog.length === 0 && <span className="opacity-50 italic">Chưa có dữ liệu xử lý...</span>}
                                 {debugLog.map((log, i) => (
                                     <div key={i} className="border-b border-gray-800 pb-0.5">{log}</div>
                                 ))}
                             </div>
                         </div>
                     </div>

                     <div className="flex justify-end">
                         <button 
                            onClick={processImport} 
                            disabled={!importText.trim()}
                            className="bg-pink-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                             <Save size={18}/> Phân Tích & Lưu
                         </button>
                     </div>
                </div>
            )}
        </div>
    );
};

export default QuestionManager;