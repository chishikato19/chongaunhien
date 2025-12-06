import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import { generateId } from '../services/storage.service';
import { Plus, Trash2, HelpCircle, AlertCircle, Save, RefreshCcw, Edit, X, Calculator } from 'lucide-react';
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

        if (editingId) {
            // Update existing
            const updatedQuestions = questions.map(q => {
                if (q.id === editingId) {
                    return {
                        ...q,
                        content: newQuestionContent,
                        type: newQuestionType,
                        options: newQuestionType === 'MCQ' ? mcqOptions : undefined,
                        correctAnswer: newQuestionType === 'MCQ' ? correctAnswerIndex : undefined
                    };
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
            }

            onUpdateQuestions([...questions, newQ]);
            
            // Reset Form
            setNewQuestionContent('');
            setMcqOptions(['', '', '', '']);
            setCorrectAnswerIndex(0);
        }
    };

    const updateMcqOption = (index: number, value: string) => {
        const newOpts = [...mcqOptions];
        newOpts[index] = value;
        setMcqOptions(newOpts);
    };

    const addToLog = (msg: string) => setDebugLog(prev => [...prev, msg]);

    const processImport = () => {
        setDebugLog([]);
        addToLog("--- BẮT ĐẦU PHÂN TÍCH ---");
        
        const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
        const parsedQuestions: Question[] = [];
        let currentQ: Partial<Question> | null = null;
        let currentOptions: string[] = [];

        // Regex helpers
        const questionStartRegex = /^(Câu|Bài)\s*\d+[:.]?|(Question)\s*\d+[:.]?|^\d+\.\s/i;
        const optionRegex = /^([A-D])\./i;
        const answerRegex = /^(Đáp án|Answer|Result)[:\s]*([A-D])/i;

        lines.forEach((line, idx) => {
            addToLog(`Line ${idx + 1}: "${line}"`);

            // 1. Detect New Question
            if (questionStartRegex.test(line) || (!currentQ && !optionRegex.test(line) && !answerRegex.test(line))) {
                // Save previous if exists
                if (currentQ) {
                    if (currentOptions.length > 0) {
                        currentQ.type = 'MCQ';
                        currentQ.options = [...currentOptions];
                    } else {
                        currentQ.type = 'ESSAY';
                    }
                    if(currentQ.content) {
                        currentQ.isAnswered = false;
                        parsedQuestions.push(currentQ as Question);
                        addToLog(`-> Saved previous question: ${currentQ.content?.substring(0, 20)}...`);
                    }
                }

                // Start new
                let content = line.replace(questionStartRegex, '').trim();
                if (!questionStartRegex.test(line)) content = line;

                currentQ = {
                    id: generateId(),
                    content: content,
                    type: 'ESSAY', // Default
                    options: []
                };
                currentOptions = [];
                addToLog(`-> New Question detected`);
            } 
            // 2. Detect Options (A. B. C. D.)
            else if (currentQ && optionRegex.test(line)) {
                const optContent = line.replace(optionRegex, '').trim();
                currentOptions.push(optContent);
                addToLog(`-> Found Option: ${optContent}`);
            }
            // 3. Detect Answer
            else if (currentQ && answerRegex.test(line)) {
                const match = line.match(answerRegex);
                if (match && match[2]) {
                    const charCode = match[2].toUpperCase().charCodeAt(0) - 65; // A=0, B=1
                    currentQ.correctAnswer = charCode;
                    addToLog(`-> Found Answer Index: ${charCode} (${match[2]})`);
                }
            }
            // 4. Append to content if it's a continuation
            else if (currentQ && currentOptions.length === 0) {
                 currentQ.content += " " + line;
            }
        });

        // Save last one
        if (currentQ) {
            if (currentOptions.length > 0) {
                currentQ.type = 'MCQ';
                currentQ.options = [...currentOptions];
            }
             currentQ.isAnswered = false;
             parsedQuestions.push(currentQ as Question);
             addToLog(`-> Saved last question.`);
        }

        addToLog(`--- KẾT THÚC: Tìm thấy ${parsedQuestions.length} câu hỏi ---`);
        if (parsedQuestions.length > 0) {
            onUpdateQuestions([...questions, ...parsedQuestions]);
            alert(`Đã nhập thành công ${parsedQuestions.length} câu hỏi!`);
            setImportText('');
        } else {
            alert("Không tìm thấy câu hỏi nào. Vui lòng kiểm tra lại định dạng.");
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
                            </select>
                            <div className="flex-grow flex flex-col">
                                <input 
                                    value={newQuestionContent}
                                    onChange={(e) => setNewQuestionContent(e.target.value)}
                                    placeholder="Nhập nội dung câu hỏi (VD: Tính $$ \sqrt{25} $$)..."
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
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${q.type === 'MCQ' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                                    {q.type === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận'}
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
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>Copy câu hỏi từ Word hoặc file Text dán vào ô bên dưới.</li>
                            <li>Định dạng nhận diện: <b>Câu 1: Nội dung...</b> hoặc mỗi dòng một câu hỏi.</li>
                            <li>Trắc nghiệm: Các dòng tiếp theo bắt đầu bằng <b>A.</b>, <b>B.</b>, <b>C.</b>...</li>
                            <li>Đáp án đúng: Thêm dòng <b>Đáp án: A</b> hoặc <b>Answer: B</b> ở cuối mỗi câu.</li>
                            <li><b>Toán học:</b> Dùng cặp dấu $$ để nhập công thức. VD: $$ \frac&#123;1&#125;&#123;2&#125; $$</li>
                        </ul>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                         <div className="flex flex-col">
                             <label className="text-xs font-bold text-gray-500 mb-1">Dán nội dung vào đây:</label>
                             <textarea 
                                className="flex-grow w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none font-mono"
                                placeholder={`Câu 1: Tính diện tích hình tròn bán kính r?\nA. $$ S = \pi r^2 $$\nB. $$ S = 2\pi r $$\nĐáp án: A`}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                             ></textarea>
                         </div>
                         <div className="flex flex-col bg-gray-900 rounded-lg p-3 overflow-hidden">
                             <div className="flex justify-between items-center mb-1">
                                 <label className="text-xs font-bold text-gray-400">Debug Log (Nhật ký xử lý):</label>
                                 <span className="text-[10px] text-gray-600">Kiểm tra lỗi tại đây</span>
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