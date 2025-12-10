import React, { useState } from 'react';
import { ClassGroup, Student, Gender, Settings, AcademicLevel, QuestionBank } from '../types';
import { getUniqueRandomAvatar, generateId } from '../services/storage.service';
import { Plus, Trash2, Edit2, Upload, Download, Users, UserPlus, FileSpreadsheet, X, Grid2X2, RotateCcw, CheckSquare, Square, Layers, Save, UserX, UserCheck, Shield, Sparkles, GraduationCap, Folder } from 'lucide-react';

interface ClassManagerProps {
  classes: ClassGroup[];
  activeClassId: string | null;
  onUpdateClasses: (classes: ClassGroup[]) => void;
  onSetActive: (id: string) => void;
  settings: Settings; 
  questionBanks: QuestionBank[]; // New prop
}

// Badge Definitions for UI
const BADGE_ICONS: {[key: string]: string} = {
    'FIRST_PICK': '🌱', 
    'HIGH_SCORE_20': '🔥', 
    'HIGH_SCORE_50': '👑', 
    'HIGH_SCORE_100': '💎', 
    'HIGH_SCORE_200': '🚀', 
    'HIGH_SCORE_500': '🌌', 
    'LUCKY_STAR': '🍀', 
    'SURVIVOR': '🛡️', 
    'QUIZ_WIZARD': '🧙‍♂️'
};

const ACADEMIC_COLORS: {[key in AcademicLevel]: string} = {
    'GOOD': 'bg-green-100 text-green-700',
    'FAIR': 'bg-blue-100 text-blue-700',
    'PASS': 'bg-yellow-100 text-yellow-700',
    'FAIL': 'bg-red-100 text-red-700'
};

const ACADEMIC_LABELS: {[key in AcademicLevel]: string} = {
    'GOOD': 'Tốt',
    'FAIR': 'Khá',
    'PASS': 'Đạt',
    'FAIL': 'CĐ'
};

const ClassManager: React.FC<ClassManagerProps> = ({ classes, activeClassId, onUpdateClasses, onSetActive, settings, questionBanks }) => {
  const [newClassName, setNewClassName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [groupCountInput, setGroupCountInput] = useState<number>(4);
  
  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bulkGroupName, setBulkGroupName] = useState('');

  // Attendance Mode
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);

  // --- Class Actions ---
  const addClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassGroup = {
      id: generateId(),
      name: newClassName,
      students: [],
      recentPickHistory: [],
      activeBankId: 'default'
    };
    onUpdateClasses([...classes, newClass]);
    setNewClassName('');
    onSetActive(newClass.id);
  };

  const deleteClass = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lớp này không? Hành động này không thể hoàn tác.')) {
      const updated = classes.filter(c => c.id !== id);
      onUpdateClasses(updated);
      if (activeClassId === id) {
          onSetActive(updated.length > 0 ? updated[0].id : '');
      }
    }
  };

  const updateClassBank = (bankId: string) => {
      if(!activeClass) return;
      const updated = { ...activeClass, activeBankId: bankId };
      onUpdateClasses(classes.map(c => c.id === activeClassId ? updated : c));
  };

  const resetClassScores = () => {
      if (!activeClass) return;
      if (window.confirm(`Xác nhận reset ĐIỂM PHIÊN (Current Score) của lớp "${activeClass.name}" về 0?\nĐiểm Tích Lũy (XP) sẽ được giữ nguyên.`)) {
          const updatedStudents = activeClass.students.map(s => ({ 
              ...s, 
              score: 0,
              lastPickedDate: null
          }));
          const updatedClass = { ...activeClass, students: updatedStudents, recentPickHistory: [] };
          onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
          alert("Đã reset điểm phiên thành công!");
      }
  };

  const resetClassXP = () => {
      if (!activeClass) return;
      if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn reset ĐIỂM TÍCH LŨY (XP) của toàn bộ học sinh trong lớp "${activeClass.name}" về 0 không?\nHành động này không thể hoàn tác và sẽ khóa lại các trò chơi yêu cầu XP.`)) {
          const updatedStudents = activeClass.students.map(s => ({ 
              ...s, 
              cumulativeScore: 0,
              achievements: []
          }));
          const updatedClass = { ...activeClass, students: updatedStudents };
          onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
          alert("Đã reset XP và Danh hiệu thành công!");
      }
  };

  // --- Student Actions ---
  const activeClass = classes.find(c => c.id === activeClassId);

  const addStudent = (name: string, gender: Gender = 'M') => {
    if (!activeClass) return;
    const usedAvatars = activeClass.students.map(s => s.avatar);
    const availablePool = settings.commonAvatars.filter(a => !usedAvatars.includes(a));
    const avatar = availablePool.length > 0 
        ? availablePool[Math.floor(Math.random() * availablePool.length)]
        : getUniqueRandomAvatar(settings.commonAvatars);

    const student: Student = {
      id: generateId(),
      name,
      gender,
      avatar: avatar,
      score: 0,
      cumulativeScore: 0,
      tags: [],
      lastPickedDate: null,
      group: '',
      achievements: [],
      isAbsent: false,
      academicLevel: 'PASS' // Default
    };
    const updatedClass = { ...activeClass, students: [...activeClass.students, student] };
    onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
  };

  const processImport = () => {
    if (!activeClass) return;
    const lines = importText.split('\n').filter(l => l.trim());
    const usedAvatars = new Set<string>(activeClass.students.map(s => s.avatar));

    const newStudents: Student[] = lines.map(line => {
      let gender: Gender = 'M';
      let name = line.trim();
      let level: AcademicLevel = 'PASS';

      if (name.toUpperCase().includes('(NỮ)') || name.toUpperCase().includes('(F)') || name.toLowerCase().includes('female')) {
        gender = 'F';
      }
      
      if (name.includes('[Tốt]')) level = 'GOOD';
      else if (name.includes('[Khá]')) level = 'FAIR';
      else if (name.includes('[CĐ]')) level = 'FAIL';

      name = name.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').trim();
      
      const availablePool = settings.commonAvatars.filter(a => !usedAvatars.has(a));
      const avatar = availablePool.length > 0 
          ? availablePool[Math.floor(Math.random() * availablePool.length)]
          : getUniqueRandomAvatar(settings.commonAvatars);
          
      usedAvatars.add(avatar);

      return {
        id: generateId(),
        name,
        gender,
        avatar,
        score: 0,
        cumulativeScore: 0,
        tags: [],
        lastPickedDate: null,
        group: '',
        achievements: [],
        isAbsent: false,
        academicLevel: level
      };
    });

    const updatedClass = { ...activeClass, students: [...activeClass.students, ...newStudents] };
    onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
    setImportText('');
    setIsImporting(false);
  };

  const updateStudent = (student: Student) => {
     if (!activeClass) return;
     const updatedStudents = activeClass.students.map(s => s.id === student.id ? student : s);
     const updatedClass = { ...activeClass, students: updatedStudents };
     onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
     setEditingStudent(null);
  };

  const deleteStudent = (studentId: string) => {
    if (!activeClass) return;
    if (!window.confirm('Xóa học sinh này?')) return;
    const updatedStudents = activeClass.students.filter(s => s.id !== studentId);
    const updatedClass = { ...activeClass, students: updatedStudents };
    onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
  };

  const toggleAbsent = (studentId: string) => {
     if (!activeClass) return;
     const updatedStudents = activeClass.students.map(s => s.id === studentId ? { ...s, isAbsent: !s.isAbsent } : s);
     const updatedClass = { ...activeClass, students: updatedStudents };
     onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
  };

  const autoSplitGroups = () => {
      if (!activeClass) return;
      const count = groupCountInput;
      if (count <= 0) {
          alert("Số nhóm phải lớn hơn 0");
          return;
      }
      const shuffled = [...activeClass.students].sort(() => 0.5 - Math.random());
      const updatedStudents = shuffled.map((s, idx) => ({
          ...s,
          group: `Nhóm ${(idx % count) + 1}`
      }));
      const updatedClass = { ...activeClass, students: updatedStudents };
      onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
      alert(`Đã chia lớp thành ${count} nhóm ngẫu nhiên.`);
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedStudentIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedStudentIds(newSet);
  };

  const selectAll = () => {
      if (!activeClass) return;
      if (selectedStudentIds.size === activeClass.students.length) setSelectedStudentIds(new Set());
      else setSelectedStudentIds(new Set(activeClass.students.map(s => s.id)));
  };

  const assignBulkGroup = () => {
      if (!activeClass || !bulkGroupName.trim()) {
          alert("Vui lòng nhập tên nhóm!");
          return;
      }
      if (selectedStudentIds.size === 0) {
          alert("Chưa chọn học sinh nào!");
          return;
      }

      const updatedStudents = activeClass.students.map(s => {
          if (selectedStudentIds.has(s.id)) {
              return { ...s, group: bulkGroupName.trim() };
          }
          return s;
      });

      const updatedClass = { ...activeClass, students: updatedStudents };
      onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
      
      setIsSelectionMode(false);
      setSelectedStudentIds(new Set());
      setBulkGroupName('');
  };

  const exportCSV = () => {
    if (!activeClass) return;
    const headers = "ID,Name,Gender,Score,CumulativeScore,Group,AcademicLevel,Achievements,IsAbsent\n";
    const rows = activeClass.students.map(s => `${s.id},${s.name},${s.gender},${s.score},${s.cumulativeScore || 0},${s.group || ''},${s.academicLevel || 'PASS'},${(s.achievements || []).join('|')},${s.isAbsent ? 'Yes' : 'No'}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeClass.name}_export.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col h-full max-h-[85vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> Quản Lý Lớp Học
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
           <select 
             className="border border-gray-300 rounded-lg px-3 py-2 flex-grow focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
             value={activeClassId || ''}
             onChange={(e) => {
                 onSetActive(e.target.value);
                 setIsSelectionMode(false);
                 setSelectedStudentIds(new Set());
                 setIsAttendanceMode(false);
             }}
           >
             <option value="" disabled>Chọn lớp...</option>
             {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.students.length} HS)</option>)}
           </select>
           {activeClassId && (
               <button onClick={() => deleteClass(activeClassId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Xóa lớp">
                   <Trash2 size={20} />
               </button>
           )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-shrink-0">
        <input 
          type="text" 
          placeholder="Tên lớp mới..." 
          className="border border-gray-300 rounded-lg px-4 py-2 flex-grow focus:outline-none focus:border-indigo-500"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />
        <button onClick={addClass} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1">
            <Plus size={18} /> Tạo Lớp
        </button>
      </div>

      {activeClass ? (
        <>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4 border-b pb-4 items-start sm:items-center flex-shrink-0">
                {/* Active Question Bank Selector */}
                <div className="flex items-center gap-2 bg-pink-50 p-1.5 rounded-lg border border-pink-100">
                    <Folder size={16} className="text-pink-600 ml-2"/>
                    <span className="text-xs font-bold text-pink-700 hidden lg:inline">Bộ câu hỏi:</span>
                    <select 
                        className="text-sm bg-transparent border-none font-bold text-gray-700 outline-none w-32 md:w-40"
                        value={activeClass.activeBankId || 'default'}
                        onChange={(e) => updateClassBank(e.target.value)}
                    >
                        {questionBanks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>

                <button onClick={() => setIsImporting(!isImporting)} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium">
                    <FileSpreadsheet size={16} /> <span className="hidden xl:inline">Nhập Excel</span>
                </button>
                
                <div className="flex items-center gap-2 bg-purple-50 p-1 rounded-md">
                     <span className="text-xs font-semibold text-purple-700 pl-2 hidden md:inline">Chia nhóm:</span>
                     <input 
                        type="number" 
                        min="1" 
                        max="20"
                        className="w-10 text-sm border-purple-200 border rounded px-1 py-0.5"
                        value={groupCountInput}
                        onChange={(e) => setGroupCountInput(parseInt(e.target.value) || 1)}
                     />
                    <button onClick={autoSplitGroups} className="flex items-center gap-2 px-2 py-1 bg-purple-200 text-purple-800 rounded-md hover:bg-purple-300 text-sm font-medium transition-colors" title="Chia ngẫu nhiên">
                        <Grid2X2 size={16} /> <span className="hidden lg:inline">Ngẫu nhiên</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-md">
                     <button 
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setIsAttendanceMode(false);
                            setSelectedStudentIds(new Set());
                        }} 
                        className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
                     >
                        <Layers size={16} />
                     </button>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
                     <button 
                        onClick={() => {
                            setIsAttendanceMode(!isAttendanceMode);
                            setIsSelectionMode(false);
                        }} 
                        className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isAttendanceMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                     >
                        {isAttendanceMode ? <UserCheck size={16} /> : <UserX size={16} />} 
                     </button>
                </div>
                
                <div className="ml-auto flex gap-2">
                    <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium" title="Xuất CSV">
                        <Download size={16} />
                    </button>
                    <button onClick={resetClassScores} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 text-sm font-medium" title="Reset điểm phiên">
                        <RotateCcw size={16} />
                    </button>
                    <button onClick={resetClassXP} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm font-medium" title="Reset XP Lớp (Cẩn thận!)">
                        <Sparkles size={16} />
                    </button>
                </div>
            </div>
            
            {isSelectionMode && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center gap-3 animate-fade-in">
                    <button onClick={selectAll} className="text-xs font-bold text-blue-700 hover:underline px-2">
                        {selectedStudentIds.size === activeClass.students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                    <span className="text-xs font-semibold text-gray-500">Đã chọn: {selectedStudentIds.size}</span>
                    <div className="w-px h-4 bg-blue-300"></div>
                    <input 
                        className="text-sm px-2 py-1 rounded border border-blue-300 outline-none w-40"
                        placeholder="Nhập tên nhóm..."
                        value={bulkGroupName}
                        onChange={e => setBulkGroupName(e.target.value)}
                    />
                    <button 
                        onClick={assignBulkGroup}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700 flex items-center gap-1"
                    >
                        <Save size={14} /> Lưu
                    </button>
                    <button onClick={() => setIsSelectionMode(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
            )}

            {isImporting && (
                <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex-shrink-0">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">Dán danh sách tên (Mỗi tên một dòng):</h4>
                    <p className="text-xs text-gray-500 mb-2">Mẹo: Thêm (Nữ) để gán giới tính. Thêm [Tốt], [Khá], [Đạt], [CĐ] để gán học lực.</p>
                    <textarea 
                        className="w-full h-32 border p-2 rounded-md text-sm mb-2 font-mono" 
                        placeholder="Nguyễn Văn A [Tốt]&#10;Trần Thị B (Nữ) [Khá]&#10;Lê C [CĐ]"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                    ></textarea>
                    <button onClick={processImport} className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700">Xử lý nhập liệu</button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 flex-grow min-h-0">
                {activeClass.students.map(student => (
                    <div 
                        key={student.id} 
                        onClick={() => {
                            if (isSelectionMode) toggleSelection(student.id);
                            else if (isAttendanceMode) toggleAbsent(student.id);
                        }}
                        className={`flex items-center justify-between bg-gray-50 p-3 rounded-lg border transition-all cursor-pointer h-max group relative
                        ${isSelectionMode && selectedStudentIds.has(student.id) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : ''}
                        ${student.isAbsent ? 'opacity-50 grayscale bg-gray-200 border-dashed' : 'border-gray-200 hover:border-indigo-300'}
                        `}
                    >
                        {student.isAbsent && <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold uppercase text-xs tracking-widest pointer-events-none z-10">Vắng</div>}
                        
                        <div className="flex items-center gap-3 overflow-hidden">
                            {isSelectionMode && (
                                <div className={`text-blue-600 ${selectedStudentIds.has(student.id) ? 'opacity-100' : 'opacity-30'}`}>
                                    {selectedStudentIds.has(student.id) ? <CheckSquare size={18}/> : <Square size={18}/>}
                                </div>
                            )}
                            {isAttendanceMode && (
                                <div className={`text-gray-600`}>
                                    {student.isAbsent ? <UserX size={18} className="text-red-500"/> : <UserCheck size={18} className="text-green-500"/>}
                                </div>
                            )}
                            <span className="text-2xl">{student.avatar}</span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-gray-800 truncate">{student.name}</p>
                                    {student.achievements && student.achievements.map((badge, idx) => (
                                        <span key={idx} className="text-[10px]" title={badge}>{BADGE_ICONS[badge]}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                     <p className="text-xs text-gray-500 flex items-center gap-1" title="Điểm phiên / Tích lũy">
                                        <span className={`w-2 h-2 rounded-full ${student.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        {student.score} <span className="text-[10px] text-gray-400">({student.cumulativeScore || 0})</span>
                                    </p>
                                    <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${ACADEMIC_COLORS[student.academicLevel || 'PASS']}`}>
                                        {ACADEMIC_LABELS[student.academicLevel || 'PASS']}
                                    </span>
                                    {student.group && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                                            {student.group}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {!isSelectionMode && !isAttendanceMode && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-white">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-white">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2 flex-shrink-0">
                <input 
                    type="text" 
                    id="quickAddName"
                    placeholder="Thêm nhanh 1 học sinh (Nhấn Enter)..." 
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-grow text-sm focus:border-indigo-500 outline-none"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            if(val.trim()) {
                                addStudent(val);
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                />
            </div>
        </>
      ) : (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2">
              Chưa chọn lớp nào. Vui lòng tạo hoặc chọn một lớp.
          </div>
      )}

      {/* Edit Modal (Keeping existing logic) */}
      {editingStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
                  <h3 className="text-lg font-bold mb-4">Chỉnh sửa học sinh</h3>
                  <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Tên</label>
                      <input 
                        className="w-full border rounded-md p-2" 
                        value={editingStudent.name} 
                        onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} 
                      />
                  </div>
                  <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Học lực</label>
                      <div className="grid grid-cols-2 gap-2">
                           {(['GOOD', 'FAIR', 'PASS', 'FAIL'] as AcademicLevel[]).map(level => (
                               <button 
                                key={level}
                                onClick={() => setEditingStudent({...editingStudent, academicLevel: level})}
                                className={`text-xs font-bold py-1.5 rounded border ${editingStudent.academicLevel === level ? ACADEMIC_COLORS[level] + ' border-transparent ring-2 ring-indigo-300' : 'bg-white border-gray-200 text-gray-500'}`}
                               >
                                   {ACADEMIC_LABELS[level]}
                               </button>
                           ))}
                      </div>
                  </div>
                  <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nhóm (Tùy chọn)</label>
                      <input 
                        className="w-full border rounded-md p-2" 
                        placeholder="VD: Nhóm 1"
                        value={editingStudent.group || ''} 
                        onChange={e => setEditingStudent({...editingStudent, group: e.target.value})} 
                      />
                  </div>
                  <div className="flex gap-3 mb-3">
                      <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Điểm phiên</label>
                          <input 
                            type="number"
                            className="w-full border rounded-md p-2" 
                            value={editingStudent.score} 
                            onChange={e => setEditingStudent({...editingStudent, score: parseInt(e.target.value) || 0})} 
                          />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Điểm Tích Lũy</label>
                          <input 
                            type="number"
                            className="w-full border rounded-md p-2" 
                            value={editingStudent.cumulativeScore || 0} 
                            onChange={e => setEditingStudent({...editingStudent, cumulativeScore: parseInt(e.target.value) || 0})} 
                          />
                      </div>
                  </div>
                  <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Giới tính</label>
                      <div className="flex gap-2">
                          <button 
                            className={`flex-1 py-1.5 rounded-md text-sm ${editingStudent.gender === 'M' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100'}`}
                            onClick={() => setEditingStudent({...editingStudent, gender: 'M'})}
                          >Nam</button>
                          <button 
                            className={`flex-1 py-1.5 rounded-md text-sm ${editingStudent.gender === 'F' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-gray-100'}`}
                            onClick={() => setEditingStudent({...editingStudent, gender: 'F'})}
                          >Nữ</button>
                      </div>
                  </div>
                  <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Avatar (Bao gồm cả đặc biệt)</label>
                      <div className="flex flex-wrap gap-2 h-20 overflow-y-auto border p-2 rounded-md">
                          {[...settings.commonAvatars, ...settings.specialAvatars].map(av => (
                              <button key={av} onClick={() => setEditingStudent({...editingStudent, avatar: av})} className={`text-xl p-1 rounded hover:bg-gray-100 ${editingStudent.avatar === av ? 'bg-yellow-100' : ''}`}>
                                  {av}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingStudent(null)} className="px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-md">Hủy</button>
                      <button onClick={() => updateStudent(editingStudent)} className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Lưu</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClassManager;