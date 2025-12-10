import React, { useState, useEffect } from 'react';
import { Question, QuestionType, Difficulty, QuestionBank } from '../types';
import { generateId } from '../services/storage.service';
import { Plus, Trash2, HelpCircle, AlertCircle, Save, RotateCcw, Edit, X, Calculator, Folder, FolderPlus, FolderOpen } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface QuestionManagerProps {
    questions: Question[];
    onUpdateQuestions: (questions: Question[]) => void;
    questionBanks: QuestionBank[];
    onUpdateBanks: (banks: QuestionBank[]) => void;
}

const DIFFICULTY_COLORS: {[key in Difficulty]: string} = {
    'EASY': 'bg-green-100 text-green-700',
    'MEDIUM': 'bg-yellow-100 text-yellow-700',
    'HARD': 'bg-red-100 text-red-700'
};

const DIFFICULTY_LABELS: {[key in Difficulty]: string} = {
    'EASY': 'Dễ',
    'MEDIUM': 'TB',
    'HARD': 'Khó'
};

const QuestionManager: React.FC<QuestionManagerProps> = ({ questions, onUpdateQuestions, questionBanks, onUpdateBanks }) => {
    const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT'>('LIST');
    const [importText, setImportText] = useState('');
    const [debugLog, setDebugLog] = useState<string[]>([]);
    
    // Bank State
    const [selectedBankId, setSelectedBankId] = useState<string>('default');
    const [newBankName, setNewBankName] = useState('');
    const [isCreatingBank, setIsCreatingBank] = useState(false);

    // Filtered Questions
    const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>([]);

    useEffect(() => {
        // Fallback if selected bank deleted
        if (!questionBanks.find(b => b.id === selectedBankId)) setSelectedBankId('default');
        
        const filtered = questions.filter(q => (q.bankId || 'default') === selectedBankId);
        setDisplayedQuestions(filtered);
    }, [questions, selectedBankId, questionBanks]);

    // Manual Entry State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newQuestionContent, setNewQuestionContent] = useState('');
    const [newQuestionType, setNewQuestionType] = useState<QuestionType>('ESSAY');
    const [newQuestionDiff, setNewQuestionDiff] = useState<Difficulty>('MEDIUM');
    const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']); 
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
    const [sequenceSteps, setSequenceSteps] = useState<string[]>(['', '', '']);
    const [matchingPairs, setMatchingPairs] = useState<{left: string, right: string}[]>([{left: '', right: ''}, {left: '', right: ''}]);

    // --- Bank Actions ---
    const addBank = () => {
        if (!newBankName.trim()) return;
        const newBank: QuestionBank = {
            id: generateId(),
            name: newBankName.trim(),
            dateCreated: Date.now()
        };
        onUpdateBanks([...questionBanks, newBank]);
        setNewBankName('');
        setIsCreatingBank(false);
        setSelectedBankId(newBank.id);
    };

    const deleteBank = (bankId: string) => {
        if (bankId === 'default') {
            alert("Không thể xóa bộ câu hỏi mặc định!");
            return;
        }
        if (window.confirm(`Xóa bộ câu hỏi này sẽ XÓA TẤT CẢ câu hỏi bên trong.\nBạn có chắc chắn?`)) {
            // Delete questions in this bank
            const remainingQs = questions.filter(q => q.bankId !== bankId);
            onUpdateQuestions(remainingQs);
            
            // Delete bank
            const remainingBanks = questionBanks.filter(b => b.id !== bankId);
            onUpdateBanks(remainingBanks);
            
            setSelectedBankId('default');
        }
    };

    // --- Question Actions ---
    const deleteQuestion = (id: string) => {
        if(window.confirm("Xóa câu hỏi này?")) {
            onUpdateQuestions(questions.filter(q => q.id !== id));
            if (editingId === id) cancelEditing();
        }
    };

    const resetQuestionStatus = () => {
        if(displayedQuestions.length === 0) return;
        if(window.confirm(`Bạn có chắc muốn đặt lại trạng thái "Chưa trả lời" cho ${displayedQuestions.length} câu hỏi trong bộ này?`)) {
            const updatedQuestions = questions.map(q => {
                if ((q.bankId || 'default') === selectedBankId) {
                    return { ...q, isAnswered: false };
                }
                return q;
            });
            onUpdateQuestions(updatedQuestions);
            alert("Đã làm mới trạng thái thành công!");
        }
    };

    const startEditing = (q: Question) => {
        setEditingId(q.id);
        setNewQuestionContent(q.content);
        setNewQuestionType(q.type);
        setNewQuestionDiff(q.difficulty || 'MEDIUM');
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
        setActiveTab('LIST');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewQuestionContent('');
        setNewQuestionType('ESSAY');
        setNewQuestionDiff('MEDIUM');
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
                        difficulty: newQuestionDiff,
                        // DO NOT change bankId on edit unless explicit move feature added
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
                difficulty: newQuestionDiff,
                isAnswered: false,
                bankId: selectedBankId // Assign to current bank
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
        addToLog(`--- NHẬP VÀO BỘ: ${questionBanks.find(b=>b.id===selectedBankId)?.name} ---`);
        
        const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
        const parsedQuestions: Question[] = [];
        let currentQ: Partial<Question> | null = null;
        let currentOptions: string[] = [];
        let currentSequenceSteps: string[] = []; 
        let currentPairs: {left: string, right: string}[] = [];

        const questionStartRegex = /^(Câu|Bài|Question)\s*\d+[:.]?/i;
        const optionRegex = /^([A-D])\./i;
        const answerRegex = /^(Đáp án|Answer|Result)[:\s]*([A-D])/i;
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
                    currentQ.bankId = selectedBankId; // Important
                    parsedQuestions.push(currentQ as Question);
                    addToLog(`-> Saved: ${currentQ.type} [${currentQ.difficulty}]`);
                }
            }
        };

        lines.forEach((line, idx) => {
            if (questionStartRegex.test(line)) {
                saveCurrent();

                let diff: Difficulty = 'MEDIUM';
                if (line.includes('[Khó]')) diff = 'HARD';
                else if (line.includes('[Dễ]')) diff = 'EASY';
                
                let content = line.replace(questionStartRegex, '').replace(/\[.*\]/g, '').trim();
                if (!content) content = line;

                currentQ = {
                    id: generateId(),
                    content: content,
                    type: 'ESSAY',
                    difficulty: diff
                };
                currentOptions = [];
                currentPairs = [];
                currentSequenceSteps = [];
                addToLog(`-> New Question detected (Line ${idx+1})`);
            } 
            else if (currentQ && line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    const left = parts[0].trim();
                    const right = parts.slice(1).join('|').trim();
                    currentPairs.push({left, right});
                    addToLog(`-> Found Pair: ${left} <-> ${right}`);
                }
            }
            else if (currentQ && optionRegex.test(line)) {
                const optContent = line.replace(optionRegex, '').trim();
                currentOptions.push(optContent);
            }
            else if (currentQ && answerRegex.test(line)) {
                const match = line.match(answerRegex);
                if (match && match[2]) {
                    const charCode = match[2].toUpperCase().charCodeAt(0) - 65; 
                    currentQ.correctAnswer = charCode;
                }
            }
            else if (currentQ && sequenceStepRegex.test(line) && currentOptions.length === 0 && currentPairs.length === 0) {
                 const match = line.match(sequenceStepRegex);
                 if (match && match[2]) {
                     currentSequenceSteps.push(match[2].trim());
                 }
            }
            else if (currentQ && currentOptions.length === 0 && currentPairs.length === 0 && currentSequenceSteps.length === 0) {
                 currentQ.content += " " + line;
            }
        });

        saveCurrent();

        addToLog(`--- KẾT THÚC: Tìm thấy ${parsedQuestions.length} câu hỏi ---`);
        if (parsedQuestions.length > 0) {
            onUpdateQuestions([...questions, ...parsedQuestions]);
            alert(`Đã nhập thành công ${parsedQuestions.length} câu hỏi vào bộ đang chọn!`);
            setImportText('');
        } else {
            alert("Không tìm thấy câu hỏi nào. Vui lòng kiểm tra lại định dạng.");
        }
    };

    return (
        <div className="flex gap-4 h-full">
            {/* LEFT SIDEBAR: BANKS */}
            <div className="w-1/4 min-w-[220px] bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm"><FolderOpen size={18}/> Bộ Câu Hỏi</h3>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {questionBanks.map(bank => (
                        <div 
                            key={bank.id} 
                            onClick={() => setSelectedBankId(bank.id)}
                            className={`p-3 rounded-lg text-sm cursor-pointer flex justify-between items-center group ${selectedBankId === bank.id ? 'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Folder size={16} className={selectedBankId === bank.id ? 'fill-indigo-200' : ''}/>
                                <span className="truncate">{bank.name}</span>
                            </div>
                            {bank.id !== 'default' && (
                                <button onClick={(e) => { e.stopPropagation(); deleteBank(bank.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {isCreatingBank ? (
                        <div className="p-2 border rounded bg-white">
                            <input 
                                autoFocus
                                className="w-full text-xs border p-1 rounded mb-1 outline-none" 
                                placeholder="Tên bộ..."
                                value={newBankName}
                                onChange={e => setNewBankName(e.target.value)}
                                onKeyDown={e => { if(e.key === 'Enter') addBank(); else if (e.key === 'Escape') setIsCreatingBank(false); }}
                            />
                            <div className="flex gap-1">
                                <button onClick={addBank} className="flex-1 bg-green-500 text-white text-xs py-1 rounded">Lưu</button>
                                <button onClick={() => setIsCreatingBank(false)} className="flex-1 bg-gray-200 text-xs py-1 rounded">Hủy</button>
                            </div>
                        </div>
                    ) : (
                         <button onClick={() => setIsCreatingBank(true)} className="w-full py-2 text-xs text-indigo-600 font-bold border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 mt-2">
                             <FolderPlus size={14}/> Tạo Bộ Mới
                         </button>
                    )}
                </div>
            </div>

            {/* RIGHT: CONTENT */}
            <div className="flex-grow bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <HelpCircle className="text-pink-600" /> {questionBanks.find(b=>b.id===selectedBankId)?.name}
                        </h2>
                        <span className="text-xs text-gray-400 font-bold">{displayedQuestions.length} câu hỏi</span>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-lg items-center">
                        <button 
                            onClick={() => setActiveTab('LIST')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'LIST' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Danh sách
                        </button>
                        <button 
                            onClick={() => setActiveTab('IMPORT')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'IMPORT' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Nhập nhanh
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <button 
                            onClick={resetQuestionStatus}
                            className="px-3 py-2 text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            title="Đặt lại trạng thái 'Chưa trả lời' cho bộ này"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                {activeTab === 'LIST' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Manual Entry Form */}
                        <div className={`bg-gray-50 p-4 rounded-xl border-2 mb-4 space-y-3 ${editingId ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                    {editingId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới vào bộ này'}
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
                                
                                <select 
                                    value={newQuestionDiff} 
                                    onChange={(e) => setNewQuestionDiff(e.target.value as Difficulty)}
                                    className={`border rounded-lg px-3 py-2 text-sm font-bold shadow-sm ${newQuestionDiff === 'HARD' ? 'bg-red-50 text-red-700' : newQuestionDiff === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
                                >
                                    <option value="EASY">Dễ</option>
                                    <option value="MEDIUM">TB</option>
                                    <option value="HARD">Khó</option>
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

                            {/* Options Renders (MCQ, Sequence, etc.) - REUSED from previous code but kept inside the logic flow */}
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
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Sequence Steps */}
                             {newQuestionType === 'SEQUENCE' && (
                                 <div className="bg-white p-3 rounded-lg border border-gray-200">
                                     <div className="text-xs text-gray-500 font-bold mb-2 uppercase">Nhập các bước theo THỨ TỰ ĐÚNG:</div>
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
                                     <div className="text-xs text-gray-500 font-bold mb-2 uppercase">Nhập các cặp tương ứng:</div>
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

                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {displayedQuestions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">Chưa có câu hỏi nào trong bộ này.</div>
                            ) : (
                                displayedQuestions.map((q, idx) => (
                                    <div key={q.id} className={`border rounded-lg p-4 transition-colors ${editingId === q.id ? 'border-pink-500 ring-2 ring-pink-100 bg-white' : q.isAnswered ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-pink-300 shadow-sm'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold">#{idx+1}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${q.type === 'MCQ' ? 'bg-blue-500' : q.type === 'SEQUENCE' ? 'bg-purple-500' : q.type === 'MATCHING' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                                                        {q.type === 'MCQ' ? 'Trắc nghiệm' : q.type === 'SEQUENCE' ? 'Sắp xếp' : q.type === 'MATCHING' ? 'Ghép nối' : 'Tự luận'}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${DIFFICULTY_COLORS[q.difficulty || 'MEDIUM']}`}>
                                                        {DIFFICULTY_LABELS[q.difficulty || 'MEDIUM']}
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
                         <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                            <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={16}/> Hướng dẫn nhập nhanh</h4>
                            <p className="text-xs mb-2">Đang nhập vào bộ: <b>{questionBanks.find(b=>b.id===selectedBankId)?.name}</b></p>
                            <p className="text-xs mb-2">Thêm [Khó], [TB], [Dễ] vào dòng đầu để set độ khó.</p>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                             <div className="flex flex-col">
                                 <label className="text-xs font-bold text-gray-500 mb-1">Dán nội dung vào đây:</label>
                                 <textarea 
                                    className="flex-grow w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none font-mono"
                                    placeholder={`Câu 1 [TB]: Nội dung...`}
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                ></textarea>
                             </div>
                             <div className="flex flex-col bg-gray-900 rounded-lg p-3 overflow-hidden">
                                 <div className="flex justify-between items-center mb-1">
                                     <label className="text-xs font-bold text-gray-400">Debug Log:</label>
                                 </div>
                                 <div className="flex-grow overflow-y-auto font-mono text-xs text-green-400 space-y-1 custom-scrollbar">
                                     {debugLog.map((log, i) => <div key={i} className="border-b border-gray-800 pb-0.5">{log}</div>)}
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
        </div>
    );
};

export default QuestionManager;