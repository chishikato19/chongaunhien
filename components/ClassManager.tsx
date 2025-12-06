
import React, { useState } from 'react';
import { ClassGroup, Student, Gender } from '../types';
import { getRandomAvatar, getUniqueRandomAvatar, AVATAR_POOL, generateId } from '../services/storage.service';
import { Plus, Trash2, Edit2, Upload, Download, Users, UserPlus, FileSpreadsheet, X, Grid2X2 } from 'lucide-react';

interface ClassManagerProps {
  classes: ClassGroup[];
  activeClassId: string | null;
  onUpdateClasses: (classes: ClassGroup[]) => void;
  onSetActive: (id: string) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({ classes, activeClassId, onUpdateClasses, onSetActive }) => {
  const [newClassName, setNewClassName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [groupCountInput, setGroupCountInput] = useState<number>(4); // Default to 4 groups

  // --- Class Actions ---
  const addClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassGroup = {
      id: generateId(),
      name: newClassName,
      students: []
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

  // --- Student Actions ---
  const activeClass = classes.find(c => c.id === activeClassId);

  const addStudent = (name: string, gender: Gender = 'M') => {
    if (!activeClass) return;
    
    // Get currently used avatars to avoid duplicates
    const usedAvatars = activeClass.students.map(s => s.avatar);

    const student: Student = {
      id: generateId(),
      name,
      gender,
      avatar: getUniqueRandomAvatar(usedAvatars),
      score: 0,
      tags: [],
      lastPickedDate: null,
      group: ''
    };
    const updatedClass = { ...activeClass, students: [...activeClass.students, student] };
    onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
  };

  const processImport = () => {
    if (!activeClass) return;
    const lines = importText.split('\n').filter(l => l.trim());
    
    // Track used avatars within this import batch and existing class
    const usedAvatars = new Set<string>(activeClass.students.map(s => s.avatar));

    const newStudents: Student[] = lines.map(line => {
      // Simple parsing: Look for (F) or (M), default to M if unknown, remove flags from name
      let gender: Gender = 'M';
      let name = line.trim();
      
      if (name.toUpperCase().includes('(NỮ)') || name.toUpperCase().includes('(F)') || name.toLowerCase().includes('female')) {
        gender = 'F';
      }
      
      // Clean name
      name = name.replace(/\(.*\)/g, '').trim();

      // Pick unique
      const avatar = getUniqueRandomAvatar(Array.from(usedAvatars) as string[]);
      usedAvatars.add(avatar);

      return {
        id: generateId(),
        name,
        gender,
        avatar,
        score: 0,
        tags: [],
        lastPickedDate: null,
        group: ''
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

  const autoSplitGroups = () => {
      if (!activeClass) return;
      const count = groupCountInput;
      if (count <= 0) {
          alert("Số nhóm phải lớn hơn 0");
          return;
      }

      // Shuffle students first
      const shuffled = [...activeClass.students].sort(() => 0.5 - Math.random());
      
      const updatedStudents = shuffled.map((s, idx) => ({
          ...s,
          group: `Nhóm ${(idx % count) + 1}`
      }));

      const updatedClass = { ...activeClass, students: updatedStudents };
      onUpdateClasses(classes.map(c => c.id === activeClassId ? updatedClass : c));
      alert(`Đã chia lớp thành ${count} nhóm ngẫu nhiên.`);
  };

  const exportCSV = () => {
    if (!activeClass) return;
    const headers = "ID,Name,Gender,Score,Group\n";
    const rows = activeClass.students.map(s => `${s.id},${s.name},${s.gender},${s.score},${s.group || ''}`).join('\n');
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
        
        {/* Class Selector */}
        <div className="flex gap-2 w-full md:w-auto">
           <select 
             className="border border-gray-300 rounded-lg px-3 py-2 flex-grow focus:ring-2 focus:ring-indigo-500"
             value={activeClassId || ''}
             onChange={(e) => onSetActive(e.target.value)}
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

      {/* Add Class */}
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
                <button onClick={() => setIsImporting(!isImporting)} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium">
                    <FileSpreadsheet size={16} /> Nhập Excel/Dán
                </button>
                <div className="flex items-center gap-2 bg-purple-50 p-1 rounded-md">
                     <span className="text-xs font-semibold text-purple-700 pl-2">Số nhóm:</span>
                     <input 
                        type="number" 
                        min="1" 
                        max="20"
                        className="w-12 text-sm border-purple-200 border rounded px-1 py-0.5"
                        value={groupCountInput}
                        onChange={(e) => setGroupCountInput(parseInt(e.target.value) || 1)}
                     />
                    <button onClick={autoSplitGroups} className="flex items-center gap-2 px-3 py-1 bg-purple-200 text-purple-800 rounded-md hover:bg-purple-300 text-sm font-medium transition-colors">
                        <Grid2X2 size={16} /> Chia Ngẫu Nhiên
                    </button>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium">
                    <Download size={16} /> Xuất CSV
                </button>
            </div>

            {/* Import Area */}
            {isImporting && (
                <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex-shrink-0">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">Dán danh sách tên (Mỗi tên một dòng):</h4>
                    <p className="text-xs text-gray-500 mb-2">Mẹo: Thêm (Nữ) hoặc (F) vào tên để tự động gán giới tính.</p>
                    <textarea 
                        className="w-full h-32 border p-2 rounded-md text-sm mb-2" 
                        placeholder="Nguyễn Văn A&#10;Trần Thị B (Nữ)&#10;Lê C"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                    ></textarea>
                    <button onClick={processImport} className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700">Xử lý nhập liệu</button>
                </div>
            )}

            {/* Student List Grid - ADJUSTED HEIGHT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 flex-grow min-h-0">
                {activeClass.students.map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors group h-max">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-2xl">{student.avatar}</span>
                            <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">{student.name}</p>
                                <div className="flex items-center gap-2">
                                     <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${student.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        {student.score} điểm
                                    </p>
                                    {student.group && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                                            {student.group}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingStudent(student)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-white">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteStudent(student.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-white">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Single Student Input (Quick Add) */}
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

      {/* Edit Modal */}
      {editingStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
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
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nhóm (Tùy chọn)</label>
                      <input 
                        className="w-full border rounded-md p-2" 
                        placeholder="VD: Nhóm 1"
                        value={editingStudent.group || ''} 
                        onChange={e => setEditingStudent({...editingStudent, group: e.target.value})} 
                      />
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
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Avatar</label>
                      <div className="flex flex-wrap gap-2 h-20 overflow-y-auto border p-2 rounded-md">
                          {AVATAR_POOL.map(av => (
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
