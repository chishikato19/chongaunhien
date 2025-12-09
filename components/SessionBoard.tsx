import React, { useState } from 'react';
import { ClassGroup, Settings, Student, PresentationMode } from '../types';
import { HelpCircle, Hand, Grid2X2, Play, ChevronUp, ChevronDown, XCircle, Pin, CheckCircle, Dices, CornerDownLeft } from 'lucide-react';
import { BADGE_INFO, BADGE_ICONS } from '../utils/gameLogic';

interface SessionBoardProps {
    activeClass: ClassGroup;
    sessionPicks: number;
    sessionPoints: number;
    settings: Settings;
    classTotalCumulativeScore: number;
    preferredMode: PresentationMode | 'RANDOM';
    setPreferredMode: (m: PresentationMode | 'RANDOM') => void;
    onOpenQuestion: () => void;
    onManualPick: () => void;
    onGroupSpin: () => void;
    onRandomizer: () => void;
    pendingStudents: Student[];
    handleGradeFromStage: (s: Student, pts: number, type: 'SCORE' | 'LUCKY') => void;
    handleRemoveFromStage: (id: string) => void;
    handleLuckyGradeFromStage: (s: Student) => void;
    isGroupSpin: boolean;
}

const SessionBoard: React.FC<SessionBoardProps> = ({
    activeClass, sessionPicks, sessionPoints, settings, classTotalCumulativeScore,
    preferredMode, setPreferredMode, onOpenQuestion, onManualPick, onGroupSpin, onRandomizer,
    pendingStudents, handleGradeFromStage, handleRemoveFromStage, handleLuckyGradeFromStage, isGroupSpin
}) => {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    const groupScores: {[key: string]: number} = {};
    const groupMembers: {[key: string]: Student[]} = {};
    activeClass.students.forEach(s => {
        if(s.group) {
            groupScores[s.group] = (groupScores[s.group] || 0) + s.score;
            if(!groupMembers[s.group]) groupMembers[s.group] = [];
            groupMembers[s.group].push(s);
        }
    });
    const sortedGroups = Object.entries(groupScores).sort((a,b) => b[1] - a[1]);
    const sortedStudents = [...activeClass.students].sort((a, b) => b.score - a.score);

    // Rank Statistics
    const rankCounts: {[key: string]: number} = {
        'RANK_PROFESSOR': 0, 'RANK_PHD': 0, 'RANK_MASTER': 0, 'RANK_BACHELOR': 0, 'RANK_APPRENTICE': 0
    };
    activeClass.students.forEach(s => {
        s.achievements?.forEach(b => {
            if (rankCounts[b] !== undefined) rankCounts[b]++;
        });
    });

    const plusPoints = isGroupSpin ? settings.groupPoints : settings.maxPoints;
    const minusPoints = isGroupSpin ? settings.groupMinusPoints : settings.minusPoints;

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in pb-40">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <div className="text-xs font-bold text-gray-500 uppercase">Lớp đang chọn</div>
                        <div className="font-bold text-indigo-700">{activeClass.name}</div>
                    </div>
                    <div className="flex flex-col items-start bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-indigo-500 font-bold uppercase">Tổng XP Lớp</span>
                            <span className="text-lg font-black text-indigo-800">{classTotalCumulativeScore} XP</span>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={onOpenQuestion} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm"><HelpCircle size={18} /> <span className="hidden sm:inline">Hiện câu hỏi</span></button>
                    <button onClick={onManualPick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm"><Hand size={18} /> <span className="hidden sm:inline">Thủ công</span></button>
                    <button onClick={onGroupSpin} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm"><Grid2X2 size={18}/> Quay Nhóm</button>
                    <div className="flex rounded-lg shadow-md">
                        <select 
                            className="bg-indigo-700 text-white px-2 py-2 rounded-l-lg font-bold text-xs sm:text-sm outline-none border-r border-indigo-500 hover:bg-indigo-800 cursor-pointer max-w-[100px] sm:max-w-none"
                            value={preferredMode}
                            onChange={(e) => setPreferredMode(e.target.value as PresentationMode | 'RANDOM')}
                        >
                            <option value="RANDOM">🎲 Ngẫu nhiên</option>
                            <option value={PresentationMode.SIMPLE}>✨ Đơn giản</option>
                            {Object.values(PresentationMode).filter(m => m !== PresentationMode.SIMPLE).map(mode => {
                                const threshold = settings.gameUnlockThresholds?.[mode] || 0;
                                const isLocked = classTotalCumulativeScore < threshold;
                                return <option key={mode} value={mode} disabled={isLocked}>{isLocked ? '🔒' : ''} {mode} {isLocked ? `(${threshold} XP)` : ''}</option>;
                            })}
                        </select>
                        <button onClick={onRandomizer} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg font-bold text-sm flex items-center justify-center gap-2"><Play fill="currentColor" size={16} /> QUAY SỐ</button>
                    </div>
                </div>
            </div>

            {/* Rank Statistics Bar */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-center items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Thống kê Học Vị:</span>
                {Object.entries(rankCounts).map(([rank, count]) => count > 0 && (
                    <div key={rank} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                        <span className="text-lg">{BADGE_ICONS[rank]}</span>
                        <div className="flex flex-col leading-none">
                             <span className="text-[10px] font-bold text-gray-600">{BADGE_INFO[rank]?.split(':')[0]}</span>
                             <span className="text-[10px] text-indigo-600 font-black">{count}</span>
                        </div>
                    </div>
                ))}
                {Object.values(rankCounts).every(c => c === 0) && <span className="text-xs text-gray-300 italic">Chưa có ai đạt học vị...</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-indigo-500">
                    <div className="text-gray-500 text-xs font-bold uppercase">Lượt gọi</div>
                    <div className="text-2xl font-black">{sessionPicks}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="text-gray-500 text-xs font-bold uppercase">Điểm phiên</div>
                    <div className="text-2xl font-black">{sessionPoints}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col max-h-[70vh]">
                    <div className="bg-indigo-600 text-white p-3 font-bold flex justify-between items-center shrink-0"><span>🏆 Xếp Hạng Cá Nhân</span></div>
                    <div className="overflow-y-auto flex-grow">
                    {sortedStudents.map((s, idx) => (
                        <div key={s.id} className={`flex items-center p-3 border-b hover:bg-gray-50 ${idx < 3 ? 'bg-yellow-50/50' : ''} ${s.isAbsent ? 'opacity-50 grayscale bg-gray-100' : ''}`}>
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-600' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div>
                            <div className="text-2xl mr-3 relative">{s.avatar}{s.isAbsent && <div className="absolute inset-0 flex items-center justify-center text-red-500"><XCircle size={20} fill="white"/></div>}</div>
                            <div className="flex-grow">
                                <div className="font-bold text-gray-800 flex items-center gap-1">{s.name}{s.achievements && s.achievements.map((badge, bIdx) => (<span key={bIdx} className="text-sm" title={BADGE_INFO[badge]}>{BADGE_ICONS[badge]}</span>))}</div>
                                <div className="text-[10px] text-gray-400 flex gap-2">
                                    <span>{s.group || 'Chưa phân nhóm'}</span>
                                    <span className="text-indigo-400 font-medium">XP: {s.cumulativeScore || 0}</span>
                                    {s.isAbsent && <span className="text-red-500 font-bold uppercase ml-1">Vắng</span>}
                                </div>
                            </div>
                            <div className="font-black text-indigo-600">{s.score}</div>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col max-h-[70vh]">
                    <div className="bg-purple-600 text-white p-3 font-bold shrink-0"><span>🛡️ Xếp Hạng Nhóm</span></div>
                    <div className="p-2 overflow-y-auto flex-grow">
                        {sortedGroups.length > 0 ? sortedGroups.map(([gName, score], idx) => (
                            <div key={gName} className="border-b last:border-0">
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50 transition-colors" onClick={() => setExpandedGroup(expandedGroup === gName ? null : gName)}>
                                    <div className="flex items-center gap-2">
                                        {expandedGroup === gName ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                        <span className="font-bold text-gray-700">{idx+1}. {gName}</span>
                                    </div>
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold text-sm">{score} điểm</span>
                                </div>
                                {expandedGroup === gName && (
                                    <div className="bg-gray-50 p-2 pl-8 text-sm space-y-1">
                                        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Thành viên:</div>
                                        {groupMembers[gName]?.map(m => (
                                            <div key={m.id} className={`flex justify-between items-center text-gray-600 ${m.isAbsent ? 'opacity-50' : ''}`}><span>{m.avatar} {m.name} {m.isAbsent && '(Vắng)'}</span><span className="font-medium">{m.score}</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : <div className="p-4 text-center text-gray-400 text-sm">Chưa có nhóm</div>}
                    </div>
                </div>
            </div>

            {pendingStudents.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border-t border-indigo-100 p-4 z-40 animate-slide-up">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 mb-2"><Pin size={16} className="text-indigo-600" /><h3 className="text-xs font-bold uppercase text-gray-500">Danh sách đang làm bài / Chờ chấm</h3></div>
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                            {pendingStudents.map(student => (
                                <div key={student.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3 min-w-[250px] shadow-sm">
                                    <div className="text-3xl">{student.avatar}</div>
                                    <div className="flex-grow min-w-0">
                                        <div className="font-bold text-gray-800 truncate">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.group || 'Cá nhân'}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleGradeFromStage(student, plusPoints, 'SCORE')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm" title="Đúng (+Điểm)"><CheckCircle size={16} /></button>
                                        <button onClick={() => handleGradeFromStage(student, -minusPoints, 'SCORE')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm" title="Sai (-Điểm)"><XCircle size={16} /></button>
                                        <button onClick={() => handleLuckyGradeFromStage(student)} className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow-sm" title="Điểm may mắn ngẫu nhiên"><Dices size={16} /></button>
                                        <button onClick={() => handleRemoveFromStage(student.id)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300" title="Về chỗ (Hủy)"><CornerDownLeft size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionBoard;