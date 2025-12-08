import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Play, BarChart2, Settings as SettingsIcon, Home, UserCheck, ShieldAlert, Award, RefreshCw, X, Grid2X2, Timer, Volume2, Trophy, LogOut, ChevronDown, ChevronUp, Users, Hand, Download, Upload, Database, Maximize, Minimize, Clock, PlayCircle, PauseCircle, RotateCcw, HelpCircle, BookOpen, CheckCircle, XCircle, FileClock, Tag, AlertTriangle, Cloud, CloudUpload, CloudDownload, Link, Save, Copy, Pin, Trash, CornerDownLeft } from 'lucide-react';
import * as Storage from './services/storage.service';
import { ClassGroup, Student, PresentationMode, SelectionLogic, Settings as GameSettings, Question } from './types';
import ClassManager from './components/ClassManager';
import QuestionManager from './components/QuestionManager'; 
import { VisualizationContainer } from './components/Visualizers';
import { playTick, playWin } from './services/sound';
import { MathRenderer } from './components/MathRenderer';

// --- Helper Functions ---
const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleTimeString() : 'Chưa gọi';

// --- HELP CONTENT ---
const HELP_CONTENT = [
    {
        title: "1. Tổng Quan",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p><b>ClassRandomizer</b> là ứng dụng hỗ trợ giáo viên chọn học sinh ngẫu nhiên, quản lý điểm số và tổ chức trò chơi trong lớp học.</p>
                <p>Ứng dụng chạy hoàn toàn trên trình duyệt, không cần cài đặt. Dữ liệu được lưu trong bộ nhớ máy (LocalStorage).</p>
            </div>
        )
    },
    {
        title: "2. Quản Lý Lớp & Học Sinh",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <ul className="list-disc pl-5 space-y-1">
                    <li><b>Tạo Lớp:</b> Nhập tên lớp và nhấn "Tạo Lớp".</li>
                    <li><b>Nhập Excel:</b> Copy danh sách tên từ cột Excel và dán vào ô nhập liệu. Máy sẽ tự tạo Avatar.</li>
                    <li><b>Chia Nhóm:</b> Nhập số lượng nhóm và nhấn "Chia ngẫu nhiên" để máy tự phân bổ học sinh.</li>
                    <li><b>Xuất/Nhập Dữ Liệu:</b> Dùng để sao lưu hoặc chuyển dữ liệu sang máy khác.</li>
                </ul>
            </div>
        )
    },
    {
        title: "3. Ngân Hàng Câu Hỏi",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <ul className="list-disc pl-5 space-y-1">
                    <li><b>Thêm thủ công:</b> Chọn loại câu hỏi (Trắc nghiệm/Tự luận) và nhập nội dung.</li>
                    <li><b>Công thức Toán học:</b> Hỗ trợ nhập công thức bằng cú pháp LaTeX. Ví dụ $$ x^2 $$ cho công thức dòng riêng, hoặc \( x \) cho công thức cùng dòng.</li>
                    <li><b>Nhập nhanh (Copy-Paste):</b> Copy từ Word theo định dạng: "Câu 1: Nội dung... A. Đáp án... Đáp án: A".</li>
                    <li><b>Reset:</b> Nút Reset sẽ đặt lại trạng thái để câu hỏi có thể được hỏi lại.</li>
                </ul>
            </div>
        )
    },
    {
        title: "4. Đồng Bộ Đám Mây (Google Sheets) V2",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p><b>Lưu ý:</b> Để lưu được nhiều dữ liệu (ảnh, câu hỏi dài) mà không bị lỗi giới hạn 50.000 ký tự, bạn cần sử dụng đoạn mã <b>Apps Script V2</b> dưới đây.</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Tạo 1 Google Sheet, vào <b>Tiện ích mở rộng > Apps Script</b>.</li>
                    <li>Copy toàn bộ đoạn code dưới đây và dán đè vào script cũ.</li>
                    <li>Nhấn <b>Triển khai (Deploy)</b> > <b>Tùy chọn triển khai mới (New deployment)</b>.</li>
                    <li>Chọn loại: <b>Web App</b>. Quyền truy cập: <b>Anyone (Bất kỳ ai)</b>.</li>
                    <li>Copy URL mới và dán vào phần cài đặt của App.</li>
                </ol>
                <div className="mt-2 relative bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <button 
                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white" 
                        title="Copy Code"
                        onClick={() => {
                            navigator.clipboard.writeText(`function doPost(e){var lock=LockService.getScriptLock();lock.tryLock(10000);try{var doc=SpreadsheetApp.getActiveSpreadsheet();var sheet=doc.getSheetByName('DB');if(!sheet){sheet=doc.insertSheet('DB');sheet.appendRow(['Key','Chunk1']);}var rawData=e.postData.contents;var payload=JSON.parse(rawData);var key=payload.key||'data';var value=JSON.stringify(payload.value);var chunks=[];var chunkSize=45000;for(var i=0;i<value.length;i+=chunkSize){chunks.push(value.substring(i,i+chunkSize));}var rows=sheet.getDataRange().getValues();var rowIndex=-1;for(var i=1;i<rows.length;i++){if(rows[i][0]==key){rowIndex=i+1;break;}}if(rowIndex>0){sheet.getRange(rowIndex,1,1,sheet.getLastColumn()).clearContent();sheet.getRange(rowIndex,1).setValue(key);sheet.getRange(rowIndex,2,1,chunks.length).setValues([chunks]);}else{var newRow=[key].concat(chunks);sheet.appendRow(newRow);}return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);}catch(e){return ContentService.createTextOutput(JSON.stringify({"result":"error","message":e.toString()})).setMimeType(ContentService.MimeType.JSON);}finally{lock.releaseLock();}} function doGet(e){var doc=SpreadsheetApp.getActiveSpreadsheet();var sheet=doc.getSheetByName('DB');var rows=sheet.getDataRange().getValues();var result={};for(var i=1;i<rows.length;i++){var key=rows[i][0];var fullString="";for(var j=1;j<rows[i].length;j++){fullString+=rows[i][j];}try{result[key]=JSON.parse(fullString);}catch(err){result[key]=fullString;}}return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);}`);
                            alert("Đã copy code! Hãy dán vào Google Apps Script.");
                        }}
                    >
                        <Copy size={16}/>
                    </button>
                    <pre className="text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-40">
{`function doPost(e) {
  var lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName('DB');
    if (!sheet) { sheet = doc.insertSheet('DB'); sheet.appendRow(['Key', 'Chunk1']); }
    
    var rawData = e.postData.contents; var payload = JSON.parse(rawData);
    var key = payload.key || 'data'; var value = JSON.stringify(payload.value);
    
    // CHUNKING (TÁCH DỮ LIỆU)
    var chunks = []; var chunkSize = 45000;
    for (var i = 0; i < value.length; i += chunkSize) {
      chunks.push(value.substring(i, i + chunkSize));
    }
    
    var rows = sheet.getDataRange().getValues(); var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == key) { rowIndex = i + 1; break; }
    }
    
    if (rowIndex > 0) {
       sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).clearContent();
       sheet.getRange(rowIndex, 1).setValue(key);
       sheet.getRange(rowIndex, 2, 1, chunks.length).setValues([chunks]);
    } else {
       var newRow = [key].concat(chunks);
       sheet.appendRow(newRow);
    }
    return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) { return ContentService.createTextOutput(JSON.stringify({"result":"error","message":e.toString()})).setMimeType(ContentService.MimeType.JSON); }
  finally { lock.releaseLock(); }
}

function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('DB');
  var rows = sheet.getDataRange().getValues();
  var result = {};
  for (var i = 1; i < rows.length; i++) {
    var key = rows[i][0];
    var fullString = "";
    for (var j = 1; j < rows[i].length; j++) { fullString += rows[i][j]; }
    try { result[key] = JSON.parse(fullString); } catch (err) { result[key] = fullString; }
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}`}
                    </pre>
                </div>
            </div>
        )
    },
    {
        title: "5. Chế Độ Quay & Trò Chơi",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p>Chọn chế độ ở thanh điều khiển bên dưới:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><b>🎲 Ngẫu nhiên:</b> Máy tự chọn trò chơi.</li>
                    <li><b>🏎️ Đua xe:</b> Mô phỏng cuộc đua kịch tính.</li>
                    <li><b>🎡 Vòng quay:</b> Vòng quay may mắn.</li>
                    <li><b>🏗️ Gắp thú:</b> Máy gắp chọn học sinh.</li>
                    <li><b>🃏 5 Lá bài:</b> Giáo viên chọn 1 trong 5 lá bài úp.</li>
                    <li><b>🥚 Trứng nở:</b> Chim bồ nông mang trứng thả xuống.</li>
                </ul>
            </div>
        )
    }
];

function App() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]); 
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'SETUP' | 'SESSION' | 'GAME' | 'SUMMARY'>('SETUP');
  const [setupTab, setSetupTab] = useState<'CLASSES' | 'QUESTIONS'>('CLASSES');

  const [showSettings, setShowSettings] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 
  const [showHelp, setShowHelp] = useState(false); 
  const [activeHelpTab, setActiveHelpTab] = useState(0);

  const [isFullScreen, setIsFullScreen] = useState(false);

  const [showManualPick, setShowManualPick] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); 
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFullScreen, setIsTimerFullScreen] = useState(false);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');

  const [settings, setSettings] = useState<GameSettings>(Storage.getSettings());

  const [winner, setWinner] = useState<Student | null>(null);
  const [gameMode, setGameMode] = useState<PresentationMode>(PresentationMode.SIMPLE);
  const [preferredMode, setPreferredMode] = useState<PresentationMode | 'RANDOM'>('RANDOM');
  const [gameLogic, setGameLogic] = useState<SelectionLogic>(SelectionLogic.RANDOM_INDIVIDUAL);
  const [roundCandidates, setRoundCandidates] = useState<Student[]>([]);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [groupModeEnabled, setGroupModeEnabled] = useState(false);
  const [isGroupSpin, setIsGroupSpin] = useState(false); 
  
  const [scoreAnimation, setScoreAnimation] = useState<{value: number, visible: boolean}>({value: 0, visible: false});

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionPicks, setSessionPicks] = useState(0);

  const [toast, setToast] = useState<{message: string, type: 'info'|'error'|'success'} | null>(null);

  // Cloud Sync State
  const [cloudUrl, setCloudUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // --- STAGE (PENDING LIST) STATE ---
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClasses(Storage.getClasses());
    setQuestions(Storage.getQuestions());
    setCloudUrl(Storage.getCloudUrl()); // Load URL
    const savedActiveId = Storage.getActiveClassId();
    if (savedActiveId) setActiveClassId(savedActiveId);

    const handleFullScreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
      let interval: any;
      if (isTimerRunning && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      playWin(); 
                      setIsTimerRunning(false);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      } else if (timeLeft === 0) {
          setIsTimerRunning(false);
      }
      return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const showToast = (message: string, type: 'info'|'error'|'success' = 'info') => {
      setToast({message, type});
  };

  const handleUpdateClasses = (newClasses: ClassGroup[]) => {
    setClasses(newClasses);
    Storage.saveClasses(newClasses);
  };

  const handleUpdateQuestions = (newQuestions: Question[]) => {
      setQuestions(newQuestions);
      Storage.saveQuestions(newQuestions);
  };

  const handleSetActiveClass = (id: string) => {
    setActiveClassId(id);
    Storage.setActiveClassId(id);
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      Storage.saveSettings(updated);
  };

  const handleSaveCloudUrl = () => {
      Storage.saveCloudUrl(cloudUrl);
      showToast("Đã lưu URL Script!", 'success');
  };

  const handleCloudUpload = async () => {
      if(!cloudUrl) { showToast("Vui lòng nhập Google Script URL trước!", 'error'); return; }
      if(!window.confirm("Bạn có chắc muốn lưu dữ liệu hiện tại lên Google Sheet? Dữ liệu cũ trên Sheet sẽ bị ghi đè.")) return;
      
      setIsSyncing(true);
      const fullData = {
          classes: Storage.getClasses(),
          settings: Storage.getSettings(),
          questions: Storage.getQuestions()
      };

      const res = await Storage.syncToCloud(cloudUrl, fullData);
      setIsSyncing(false);
      
      if(res.success) showToast(res.message, 'success');
      else showToast(res.message, 'error');
  };

  const handleCloudDownload = async () => {
      if(!cloudUrl) { showToast("Vui lòng nhập Google Script URL trước!", 'error'); return; }
      if(!window.confirm("CẢNH BÁO: Dữ liệu tải về sẽ GHI ĐÈ dữ liệu hiện tại trên máy này. Tiếp tục?")) return;

      setIsSyncing(true);
      const res = await Storage.syncFromCloud(cloudUrl);
      setIsSyncing(false);

      if(res.success && res.data) {
          const data = res.data;
          if(data.classes) {
              setClasses(data.classes);
              Storage.saveClasses(data.classes);
          }
          if(data.settings) {
              setSettings(data.settings);
              Storage.saveSettings(data.settings);
          }
          if(data.questions) {
              setQuestions(data.questions);
              Storage.saveQuestions(data.questions);
          }
          showToast(res.message, 'success');
      } else {
          showToast(res.message, 'error');
      }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId), [classes, activeClassId]);

  const startSession = () => {
      if (!activeClass || activeClass.students.length === 0) {
          showToast("Lớp học trống! Vui lòng chọn lớp có học sinh.", 'error');
          return;
      }
      setSessionPoints(0);
      setSessionPicks(0);
      setPendingStudents([]); // Clear stage on new session
      setCurrentView('SESSION');
  };

  const triggerEndSession = () => {
      setShowEndConfirm(true);
  };

  const confirmEndSession = () => {
      setShowEndConfirm(false);
      setCurrentView('SUMMARY');
  };

  const startRandomizer = () => {
    if (!activeClass) return;

    setShowResultOverlay(false);
    setScoreAnimation({value: 0, visible: false});
    setWinner(null);
    setIsGroupSpin(false); 

    const hasGroups = activeClass.students.some(s => s.group && s.group.trim() !== '');
    
    let chosenLogic = SelectionLogic.RANDOM_INDIVIDUAL;
    if (groupModeEnabled && hasGroups) {
        chosenLogic = SelectionLogic.GROUP_ROTATION;
    } else {
        const logics = [SelectionLogic.RANDOM_INDIVIDUAL, SelectionLogic.RANDOM_INDIVIDUAL, SelectionLogic.TAG_FILTER, SelectionLogic.ABSOLUTE_RANDOM];
        if (hasGroups) logics.push(SelectionLogic.GROUP_ROTATION);
        chosenLogic = logics[Math.floor(Math.random() * logics.length)];
    }
    setGameLogic(chosenLogic);

    let eligiblePool = [...activeClass.students];
    
    // EXCLUDE PENDING STUDENTS FROM POOL
    eligiblePool = eligiblePool.filter(s => !pendingStudents.find(p => p.id === s.id));

    if (chosenLogic === SelectionLogic.GROUP_ROTATION && hasGroups) {
        const groups: {[key: string]: Student[]} = {};
        eligiblePool.forEach(s => {
            const gName = s.group || 'Ungrouped';
            if (!groups[gName]) groups[gName] = [];
            groups[gName].push(s);
        });
        
        const groupUsage: {[key: string]: number} = {};
        Object.keys(groups).forEach(gName => {
            groupUsage[gName] = groups[gName].filter(s => s.lastPickedDate !== null).length;
        });
        const minUsage = Math.min(...Object.values(groupUsage));
        const candidateGroups = Object.keys(groupUsage).filter(g => groupUsage[g] === minUsage);
        
        let groupPool: Student[] = [];
        candidateGroups.forEach(g => groupPool = [...groupPool, ...groups[g]]);
        
        const unpickedInGroups = groupPool.filter(s => s.lastPickedDate === null);
        eligiblePool = unpickedInGroups.length > 0 ? unpickedInGroups : groupPool;
    }

    if (!settings.allowRepeats && chosenLogic !== SelectionLogic.ABSOLUTE_RANDOM) {
        const unpicked = eligiblePool.filter(s => s.lastPickedDate === null);
        if (unpicked.length > 0) eligiblePool = unpicked;
        else if (chosenLogic !== SelectionLogic.GROUP_ROTATION) {
             const sortedByDate = [...eligiblePool].sort((a, b) => (a.lastPickedDate || 0) - (b.lastPickedDate || 0));
             eligiblePool = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2));
        }
    }

    if (eligiblePool.length === 0) {
         // If pool is empty because everyone is pending
         if (activeClass.students.length > 0 && pendingStudents.length > 0) {
             showToast("Tất cả học sinh còn lại đang trên bảng! Hãy chấm điểm trước.", 'error');
             return;
         }
         eligiblePool = activeClass.students;
    }

    const pickedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setWinner(pickedWinner);

    let visualCandidates = [...activeClass.students];
    if (!visualCandidates.find(s => s.id === pickedWinner.id)) {
        visualCandidates.push(pickedWinner);
    }
    
    setRoundCandidates(visualCandidates);

    if (preferredMode !== 'RANDOM') {
        setGameMode(preferredMode);
    } else {
        const modes = [
            PresentationMode.SIMPLE, 
            PresentationMode.RACE, 
            PresentationMode.WHEEL, 
            PresentationMode.SLOT, 
            PresentationMode.BOX, 
            PresentationMode.SPOTLIGHT, 
            PresentationMode.GRID_ELIMINATION,
            PresentationMode.FLIP,
            PresentationMode.GALAXY,
            PresentationMode.CLAW_MACHINE,
            PresentationMode.LUCKY_CARDS,
            PresentationMode.DICE,
            PresentationMode.EGG_HATCH
        ];
        setGameMode(modes[Math.floor(Math.random() * modes.length)]);
    }
    
    setCurrentView('GAME');
  };

  const startGroupRandomizer = () => {
    if (!activeClass) return;

    const uniqueGroupNames = [...new Set(activeClass.students.map(s => s.group).filter(g => g && g.trim() !== ''))];
    if (uniqueGroupNames.length === 0) {
        showToast("Chưa có nhóm nào được tạo!", 'error');
        return;
    }

    setShowResultOverlay(false);
    setScoreAnimation({value: 0, visible: false});
    setWinner(null);
    setIsGroupSpin(true);

    // EXCLUDE PENDING GROUPS (If a group is "Pending", it means we picked "Group X" via spinner)
    // Note: pendingStudents usually contains individual students. If using group mode, we might add a "Group Winner" object to pending.
    // For simplicity, if we are in group mode, we check if any "GROUP_NAME" id exists in pending.
    
    const pendingGroupNames = pendingStudents.filter(s => s.id.startsWith('GROUP_')).map(s => s.name);
    const availableGroupNames = uniqueGroupNames.filter(g => !pendingGroupNames.includes(g as string));
    
    if (availableGroupNames.length === 0) {
         showToast("Tất cả các nhóm đang trên bảng/chờ chấm!", 'error');
         return;
    }

    const groupLastPicked: {[key: string]: number} = {};
    availableGroupNames.forEach(gName => {
        const studentsInGroup = activeClass.students.filter(s => s.group === gName);
        const latestPick = Math.max(...studentsInGroup.map(s => s.lastPickedDate || 0));
        groupLastPicked[gName as string] = latestPick;
    });

    const sortedGroups = availableGroupNames.sort((a, b) => groupLastPicked[a as string] - groupLastPicked[b as string]);
    let candidateGroupPool = sortedGroups;
    
    if (candidateGroupPool.length > 2) {
         const minTime = groupLastPicked[candidateGroupPool[0] as string];
         candidateGroupPool = candidateGroupPool.filter(g => groupLastPicked[g as string] === minTime);
         
         if (candidateGroupPool.length === 1 && sortedGroups.length > 1) {
             candidateGroupPool = sortedGroups.slice(0, Math.ceil(sortedGroups.length / 2));
         }
    }

    const winningGroupName = candidateGroupPool[Math.floor(Math.random() * candidateGroupPool.length)];

    const groupCandidates: Student[] = uniqueGroupNames.map((gName, idx) => ({
        id: `GROUP_${gName}`,
        name: gName as string,
        group: gName as string,
        avatar: Storage.GROUP_AVATAR_POOL[idx % Storage.GROUP_AVATAR_POOL.length],
        gender: 'M',
        score: 0,
        tags: [],
        lastPickedDate: null
    }));

    const winningGroupCandidate = groupCandidates.find(g => g.name === winningGroupName)!;

    setWinner(winningGroupCandidate);
    setRoundCandidates(groupCandidates);

    const modes = [
        PresentationMode.SIMPLE, 
        PresentationMode.RACE, 
        PresentationMode.WHEEL, 
        PresentationMode.BOX, 
        PresentationMode.SPOTLIGHT, 
        PresentationMode.FLIP, 
        PresentationMode.LUCKY_CARDS,
        PresentationMode.DICE,
        PresentationMode.EGG_HATCH
    ];
    setGameMode(modes[Math.floor(Math.random() * modes.length)]);
    
    setCurrentView('GAME');
  };

  const handleManualPick = (studentOrGroup: Student | {name: string, isGroup: boolean}) => {
      let winningCandidate: Student;
      let isGroup = false;

      if ('isGroup' in studentOrGroup && studentOrGroup.isGroup) {
          isGroup = true;
          const uniqueGroups = [...new Set(activeClass!.students.map(s => s.group).filter(g => g))];
          const idx = uniqueGroups.indexOf(studentOrGroup.name);
          
          winningCandidate = {
              id: `GROUP_${studentOrGroup.name}`,
              name: studentOrGroup.name,
              group: studentOrGroup.name,
              avatar: Storage.GROUP_AVATAR_POOL[idx % Storage.GROUP_AVATAR_POOL.length] || '🛡️',
              gender: 'M',
              score: 0,
              tags: [],
              lastPickedDate: null
          };
      } else {
          winningCandidate = studentOrGroup as Student;
      }

      setWinner(winningCandidate);
      setIsGroupSpin(isGroup);
      setScoreAnimation({value: 0, visible: false});
      setShowManualPick(false);
      setCurrentView('GAME'); 
      setShowResultOverlay(true); 
  };

  const handleGameComplete = () => {
    setShowResultOverlay(true);
    setSessionPicks(prev => prev + 1);
    
    if (winner && activeClass) {
        let updatedStudents = [...activeClass.students];
        const now = Date.now();

        if (isGroupSpin) {
            updatedStudents = updatedStudents.map(s => 
                s.group === winner.name ? { ...s, lastPickedDate: now } : s
            );
        } else {
            updatedStudents = updatedStudents.map(s => 
                s.id === winner.id ? { ...s, lastPickedDate: now } : s
            );
        }

        const updatedClass = { ...activeClass, students: updatedStudents };
        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
    }
  };

  const handleAddScore = (points: number, closeOverlay = true) => {
      setScoreAnimation({ value: points, visible: true });

      if (winner && activeClass) {
        let updatedStudents: Student[] = [];
        let finalPoints = points;
        
        if (isGroupSpin) {
            const targetGroup = winner.name; 
            updatedStudents = activeClass.students.map(s => 
                s.group === targetGroup ? { ...s, score: s.score + finalPoints } : s
            );
            const count = activeClass.students.filter(s => s.group === targetGroup).length;
            setSessionPoints(prev => prev + (finalPoints * count));
        } else {
            updatedStudents = activeClass.students.map(s => 
                s.id === winner.id ? { ...s, score: s.score + finalPoints } : s
            );
            setSessionPoints(prev => prev + finalPoints);
        }

        const updatedClass = { ...activeClass, students: updatedStudents };
        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
        
        if (closeOverlay) {
            setTimeout(() => {
                setCurrentView('SESSION');
                setScoreAnimation({ value: 0, visible: false });
                setShowQuestionModal(false);
            }, 1800);
        } else {
            setTimeout(() => {
                 setScoreAnimation({ value: 0, visible: false });
            }, 2000);
        }
    }
  };

  // --- STAGE LOGIC ---
  const handleAddToStage = () => {
      if (winner) {
          // Check duplicates just in case
          if (!pendingStudents.find(s => s.id === winner.id)) {
              setPendingStudents(prev => [...prev, winner]);
              showToast(`Đã thêm ${winner.name} vào danh sách chờ!`, 'success');
          }
          setCurrentView('SESSION');
          setShowResultOverlay(false);
      }
  };

  const handleRemoveFromStage = (studentId: string) => {
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleGradeFromStage = (student: Student, points: number) => {
      if (!activeClass) return;
      
      let updatedStudents: Student[] = [];
      const isGroupItem = student.id.startsWith('GROUP_');

      if (isGroupItem) {
           const targetGroup = student.name;
           updatedStudents = activeClass.students.map(s => 
               s.group === targetGroup ? { ...s, score: s.score + points } : s
           );
           const count = activeClass.students.filter(s => s.group === targetGroup).length;
           setSessionPoints(prev => prev + (points * count));
      } else {
           updatedStudents = activeClass.students.map(s => 
               s.id === student.id ? { ...s, score: s.score + points } : s
           );
           setSessionPoints(prev => prev + points);
      }

      const updatedClass = { ...activeClass, students: updatedStudents };
      handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
      
      if (points > 0) playWin();
      else playTick();

      // Remove from stage
      handleRemoveFromStage(student.id);
  };

  const handleOpenQuestion = () => {
      const availableQuestions = questions.filter(q => !q.isAnswered);
      
      if (availableQuestions.length === 0) {
          if (questions.length === 0) {
              showToast("Chưa có câu hỏi! Vào Cài đặt -> Câu hỏi để thêm.", 'error');
          } else {
              showToast("Tất cả câu hỏi đã được trả lời! Vào Ngân hàng câu hỏi để Reset.", 'info');
          }
          return;
      }

      const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      setActiveQuestion(randomQ);
      setAnswerStatus('IDLE');
      setSelectedOption(null);
      setShowQuestionModal(true);
  };

  const markQuestionAsAnswered = (qId: string) => {
      const updatedQs = questions.map(q => q.id === qId ? { ...q, isAnswered: true } : q);
      handleUpdateQuestions(updatedQs);
  };

  const handleCheckAnswer = (optionIndex: number) => {
      if (!activeQuestion || activeQuestion.type !== 'MCQ') return;
      setSelectedOption(optionIndex);
      
      if (optionIndex === activeQuestion.correctAnswer) {
          setAnswerStatus('CORRECT');
          playWin();
          markQuestionAsAnswered(activeQuestion.id);
          
          setTimeout(() => {
               setShowQuestionModal(false);
          }, 1500);
      } else {
          setAnswerStatus('WRONG');
          playTick(); 
          
          setTimeout(() => {
              setShowQuestionModal(false);
          }, 1500);
      }
  };

  const handleEssayGrade = (isCorrect: boolean) => {
      if (activeQuestion) markQuestionAsAnswered(activeQuestion.id);

      if (isCorrect) {
          setAnswerStatus('CORRECT');
          playWin();
          setTimeout(() => {
              setShowQuestionModal(false);
          }, 1500);
      } else {
          setAnswerStatus('WRONG');
          playTick();
          setTimeout(() => {
              setShowQuestionModal(false);
          }, 1500);
      }
  };

  const resetData = () => {
    if (!activeClassId) {
        showToast("Chưa chọn lớp để reset!", 'error');
        return;
    }

    if (window.confirm('CẢNH BÁO: Hành động này sẽ đặt toàn bộ ĐIỂM SỐ về 0 cho lớp đang chọn.\nDanh sách học sinh sẽ được GIỮ NGUYÊN.\n\nBạn có chắc chắn muốn tiếp tục?')) {
        const storedClasses = Storage.getClasses();
        let classFound = false;

        const updatedClasses = storedClasses.map(c => {
            if (c.id === activeClassId) {
                classFound = true;
                return {
                    ...c,
                    students: c.students.map(s => ({ ...s, score: 0, lastPickedDate: null }))
                };
            }
            return c;
        });

        if (!classFound) {
             const stateBasedReset = classes.map(c => {
                if (c.id === activeClassId) {
                    return {
                        ...c,
                        students: c.students.map(s => ({ ...s, score: 0, lastPickedDate: null }))
                    };
                }
                return c;
             });
             Storage.saveClasses(stateBasedReset);
             setClasses(stateBasedReset);
        } else {
             Storage.saveClasses(updatedClasses);
             setClasses(updatedClasses);
        }

        setSessionPoints(0);
        setSessionPicks(0);
        setPendingStudents([]); // Clear stage
        showToast("Đã reset điểm số thành công!", 'success');
    }
  };

  const handleExportData = () => {
      const dataToExport = {
          version: 1,
          date: new Date().toISOString(),
          classes: Storage.getClasses(),
          settings: Storage.getSettings(),
          activeClassId: Storage.getActiveClassId(),
          questions: Storage.getQuestions()
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_randomizer_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!window.confirm("CẢNH BÁO: Việc nhập dữ liệu sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại (Lớp học, Cài đặt, Câu hỏi).\n\nBạn nên 'Xuất dữ liệu' hiện tại trước khi tiếp tục.\nBạn có chắc chắn muốn nhập file này không?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);

              if (!Array.isArray(data.classes)) {
                  throw new Error("File không hợp lệ: Không tìm thấy danh sách lớp.");
              }

              Storage.saveClasses(data.classes);
              if (data.settings) Storage.saveSettings(data.settings);
              if (data.activeClassId) Storage.setActiveClassId(data.activeClassId);
              if (data.questions) Storage.saveQuestions(data.questions);

              setClasses(data.classes);
              setSettings(data.settings || Storage.getSettings());
              setActiveClassId(data.activeClassId || null);
              setQuestions(data.questions || []);

              showToast("Nhập dữ liệu thành công!", 'success');
          } catch (error) {
              console.error(error);
              showToast("Lỗi khi nhập file: File không đúng định dạng.", 'error');
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const getLuckyRangeText = () => {
      if (isGroupSpin) return `${settings.minGroupLuckyPoints}~${settings.maxGroupLuckyPoints}`;
      return `${settings.minLuckyPoints}~${settings.maxLuckyPoints}`;
  };

  const handleLuckyPointClick = () => {
      const min = isGroupSpin ? settings.minGroupLuckyPoints : settings.minLuckyPoints;
      const max = isGroupSpin ? settings.maxGroupLuckyPoints : settings.maxLuckyPoints;
      const points = Math.floor(Math.random() * (max - min + 1)) + min;
      handleAddScore(points);
  };


  const renderLeaderboard = () => {
      if (!activeClass) return null;
      
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

      // STAGE POINTS (For GradeFromStage buttons)
      const plusPoints = isGroupSpin ? settings.groupPoints : settings.maxPoints;
      const minusPoints = isGroupSpin ? settings.groupMinusPoints : settings.minusPoints;

      return (
          <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in pb-40">
              {/* --- NEW CONTROL PANEL POSITION --- */}
              <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                   <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                            <div className="text-xs font-bold text-gray-500 uppercase">Lớp đang chọn</div>
                            <div className="font-bold text-indigo-700">{activeClass.name}</div>
                        </div>
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 hidden sm:block">
                            {groupModeEnabled ? 'Chế độ Nhóm' : 'Chế độ Hỗn hợp'}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowManualPick(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm"
                            title="Gọi chỉ định"
                        >
                            <Hand size={18} /> <span className="hidden sm:inline">Thủ công</span>
                        </button>
                        <button 
                            onClick={startGroupRandomizer}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                            <Grid2X2 size={18}/> Quay Nhóm
                        </button>
                        
                        <div className="flex rounded-lg shadow-md">
                            <select 
                                className="bg-indigo-700 text-white px-2 py-2 rounded-l-lg font-bold text-xs sm:text-sm outline-none border-r border-indigo-500 hover:bg-indigo-800 cursor-pointer max-w-[100px] sm:max-w-none"
                                value={preferredMode}
                                onChange={(e) => setPreferredMode(e.target.value as PresentationMode | 'RANDOM')}
                            >
                                <option value="RANDOM">🎲 Ngẫu nhiên</option>
                                <option value={PresentationMode.RACE}>🏎️ Đua xe</option>
                                <option value={PresentationMode.WHEEL}>🎡 Vòng quay</option>
                                <option value={PresentationMode.SLOT}>🎰 Slot</option>
                                <option value={PresentationMode.BOX}>🎁 Hộp quà</option>
                                <option value={PresentationMode.FLIP}>🃏 Lật thẻ</option>
                                <option value={PresentationMode.SPOTLIGHT}>🔦 Tiêu điểm</option>
                                <option value={PresentationMode.GRID_ELIMINATION}>🧱 Loại trừ</option>
                                <option value={PresentationMode.GALAXY}>🌌 Vũ trụ</option>
                                <option value={PresentationMode.CLAW_MACHINE}>🏗️ Gắp thú</option>
                                <option value={PresentationMode.LUCKY_CARDS}>🎩 5 Lá bài</option>
                                <option value={PresentationMode.DICE}>🔢 Quay số</option>
                                <option value={PresentationMode.EGG_HATCH}>🥚 Trứng nở</option>
                                <option value={PresentationMode.SIMPLE}>✨ Đơn giản</option>
                            </select>
                            <button 
                                onClick={startRandomizer}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Play fill="currentColor" size={16} /> QUAY SỐ
                            </button>
                        </div>
                    </div>
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
                      <div className="bg-indigo-600 text-white p-3 font-bold flex justify-between items-center shrink-0">
                          <span>🏆 Xếp Hạng Cá Nhân</span>
                      </div>
                      <div className="overflow-y-auto flex-grow">
                        {sortedStudents.map((s, idx) => (
                            <div key={s.id} className={`flex items-center p-3 border-b hover:bg-gray-50 ${idx < 3 ? 'bg-yellow-50/50' : ''}`}>
                                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-600' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="text-2xl mr-3">{s.avatar}</div>
                                <div className="flex-grow">
                                    <div className="font-bold text-gray-800">{s.name}</div>
                                    <div className="text-[10px] text-gray-400">{s.group}</div>
                                </div>
                                <div className="font-black text-indigo-600">{s.score}</div>
                            </div>
                        ))}
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col max-h-[70vh]">
                      <div className="bg-purple-600 text-white p-3 font-bold shrink-0">
                          <span>🛡️ Xếp Hạng Nhóm</span>
                      </div>
                      <div className="p-2 overflow-y-auto flex-grow">
                          {sortedGroups.length > 0 ? sortedGroups.map(([gName, score], idx) => (
                              <div key={gName} className="border-b last:border-0">
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50 transition-colors"
                                    onClick={() => setExpandedGroup(expandedGroup === gName ? null : gName)}
                                  >
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
                                              <div key={m.id} className="flex justify-between items-center text-gray-600">
                                                  <span>{m.avatar} {m.name}</span>
                                                  <span className="font-medium">{m.score}</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )) : <div className="p-4 text-center text-gray-400 text-sm">Chưa có nhóm</div>}
                      </div>
                  </div>
              </div>

              {/* --- PENDING STUDENTS DOCK BAR --- */}
              {pendingStudents.length > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border-t border-indigo-100 p-4 z-40 animate-slide-up">
                      <div className="max-w-7xl mx-auto">
                           <div className="flex items-center gap-2 mb-2">
                               <Pin size={16} className="text-indigo-600" />
                               <h3 className="text-xs font-bold uppercase text-gray-500">Danh sách đang làm bài / Chờ chấm</h3>
                           </div>
                           <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                               {pendingStudents.map(student => (
                                   <div key={student.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3 min-w-[250px] shadow-sm">
                                       <div className="text-3xl">{student.avatar}</div>
                                       <div className="flex-grow min-w-0">
                                           <div className="font-bold text-gray-800 truncate">{student.name}</div>
                                           <div className="text-xs text-gray-500">{student.group || 'Cá nhân'}</div>
                                       </div>
                                       <div className="flex gap-1">
                                           <button onClick={() => handleGradeFromStage(student, plusPoints)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm" title="Đúng (+Điểm)">
                                               <CheckCircle size={16} />
                                           </button>
                                           <button onClick={() => handleGradeFromStage(student, -minusPoints)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm" title="Sai (-Điểm)">
                                               <XCircle size={16} />
                                           </button>
                                           <button onClick={() => handleRemoveFromStage(student.id)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300" title="Về chỗ (Hủy)">
                                               <CornerDownLeft size={16} />
                                           </button>
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

  const renderGameOverlay = () => {
     if (!winner) return null;
     const currentDuration = gameMode === PresentationMode.RACE ? settings.raceDuration : settings.spinDuration;
     const plusPoints = isGroupSpin ? settings.groupPoints : settings.maxPoints;
     const minusPoints = isGroupSpin ? settings.groupMinusPoints : settings.minusPoints;

     return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setCurrentView('SESSION')} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
                    <X />
                </button>
            </div>
            
            {!showResultOverlay && (
                <div className="flex-grow relative">
                    <VisualizationContainer 
                        mode={gameMode} 
                        candidates={roundCandidates} 
                        winner={winner} 
                        duration={currentDuration}
                        onComplete={handleGameComplete} 
                    />
                </div>
            )}

            {showResultOverlay && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in z-50 backdrop-blur-sm">
                    {scoreAnimation.visible ? (
                         <div className="text-center animate-bounce-in">
                             <div className={`text-9xl font-black ${scoreAnimation.value >= 0 ? 'text-green-400' : 'text-red-500'} drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]`}>
                                 {scoreAnimation.value > 0 ? '+' : ''}{scoreAnimation.value}
                             </div>
                             <div className="text-white text-2xl font-bold mt-4 uppercase tracking-widest">
                                 {scoreAnimation.value >= 0 ? 'Điểm thưởng!' : 'Điểm trừ'}
                             </div>
                         </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 transform transition-all scale-100 border-4 border-indigo-500 relative">
                            <button onClick={() => setCurrentView('SESSION')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                <X size={24}/>
                            </button>

                            <div className="text-8xl mb-4 animate-bounce filter drop-shadow-lg">{winner.avatar}</div>
                            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-1">
                                {isGroupSpin ? 'Nhóm Chiến Thắng' : 'Chúc mừng'}
                            </h2>
                            <h1 className="text-4xl font-black text-indigo-800 mb-2">{winner.name}</h1>
                            {winner.group && !isGroupSpin && <div className="mb-8 inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-200">{winner.group}</div>}
                            {isGroupSpin && <div className="mb-8 text-sm text-green-600 font-bold">Cộng điểm cho toàn bộ thành viên!</div>}
                            
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <button onClick={handleOpenQuestion} className="col-span-2 py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg hover:bg-pink-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105">
                                    <HelpCircle size={24}/>
                                    <span className="text-xl">Trả lời câu hỏi</span>
                                </button>
                                
                                <button onClick={() => handleAddScore(plusPoints)} className="py-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex flex-col items-center justify-center">
                                    <span className="text-xl">+{plusPoints}</span>
                                    <span className="text-[10px] uppercase opacity-70">Thưởng trực tiếp</span>
                                </button>
                                <button onClick={() => handleAddScore(-minusPoints)} className="py-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex flex-col items-center justify-center">
                                    <span className="text-xl">-{minusPoints}</span>
                                    <span className="text-[10px] uppercase opacity-70">Phạt trực tiếp</span>
                                </button>
                                <button onClick={handleLuckyPointClick} className="py-4 bg-yellow-50 text-yellow-700 font-bold rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors flex flex-col items-center justify-center">
                                    <span className="text-xl">🎲 +{getLuckyRangeText()}</span>
                                    <span className="text-[10px] uppercase opacity-70">May mắn</span>
                                </button>

                                {/* STAGE BUTTON */}
                                <button onClick={handleAddToStage} className="py-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center">
                                    <Pin size={24} />
                                    <span className="text-[10px] uppercase opacity-70 mt-1">Mời lên bảng</span>
                                </button>
                            </div>
                             <button onClick={() => setCurrentView('SESSION')} className="w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-medium mt-2">
                                    Quay về bảng xếp hạng
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showQuestionModal && activeQuestion && (
                <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
                     <div className={`bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative animate-fade-in ${answerStatus === 'WRONG' ? 'animate-shake border-4 border-red-500' : ''} ${answerStatus === 'CORRECT' ? 'border-4 border-green-500' : ''}`}>
                         <button onClick={() => setShowQuestionModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                         
                         <div className="text-center mb-8">
                             <div className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                                 {activeQuestion.type === 'MCQ' ? 'Trắc Nghiệm' : 'Tự Luận'}
                             </div>
                             <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">
                                 <MathRenderer text={activeQuestion.content} />
                             </h2>
                             {activeQuestion.image && (
                                <div className="mt-4 flex justify-center">
                                    <img src={activeQuestion.image} alt="Question" className="max-h-48 rounded-lg border border-gray-200 shadow-md"/>
                                </div>
                             )}
                         </div>

                         {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {activeQuestion.options.map((opt, idx) => {
                                     let btnClass = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                                     if (selectedOption === idx) {
                                         if (answerStatus === 'CORRECT') btnClass = "bg-green-500 text-white border-green-600";
                                         else if (answerStatus === 'WRONG') btnClass = "bg-red-500 text-white border-red-600";
                                     } else if (answerStatus === 'WRONG' && idx === activeQuestion.correctAnswer) {
                                         btnClass = "bg-green-100 text-green-800 border-green-300 animate-pulse";
                                     }

                                     return (
                                         <button 
                                            key={idx}
                                            onClick={() => handleCheckAnswer(idx)}
                                            disabled={answerStatus !== 'IDLE'}
                                            className={`p-4 rounded-xl border-2 text-left font-bold transition-all flex items-center gap-3 ${btnClass}`}
                                         >
                                             <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm border border-white/30">
                                                 {String.fromCharCode(65 + idx)}
                                             </span>
                                             <span><MathRenderer text={opt} /></span>
                                         </button>
                                     )
                                 })}
                             </div>
                         )}

                         {activeQuestion.type === 'ESSAY' && (
                             <div className="text-center">
                                 <div className="p-6 bg-gray-50 rounded-xl mb-6 border border-dashed border-gray-300">
                                     <p className="text-gray-500 italic">Mời học sinh trả lời câu hỏi...</p>
                                 </div>
                                 {answerStatus === 'IDLE' && (
                                     <div className="flex gap-4 justify-center">
                                         <button onClick={() => handleEssayGrade(true)} className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200">
                                             <CheckCircle /> Đúng
                                         </button>
                                         <button onClick={() => handleEssayGrade(false)} className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200">
                                             <XCircle /> Sai
                                         </button>
                                     </div>
                                 )}
                             </div>
                         )}

                         {answerStatus !== 'IDLE' && (
                             <div className="mt-6 text-center animate-bounce-in">
                                 {answerStatus === 'CORRECT' ? (
                                     <div className="text-green-600 font-black text-2xl flex items-center justify-center gap-2">
                                         <Award size={32}/> CHÍNH XÁC!
                                     </div>
                                 ) : (
                                     <div className="text-red-600 font-black text-2xl flex items-center justify-center gap-2">
                                         <ShieldAlert size={32}/> SAI RỒI!
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                </div>
            )}
        </div>
     );
  };

  const renderSummary = () => {
      return (
          <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
                  <Trophy size={64} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
                  <h1 className="text-3xl font-black text-gray-800 mb-2">Tổng Kết Phiên</h1>
                  <p className="text-gray-500 mb-8">Buổi học hôm nay thật tuyệt vời!</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-indigo-50 p-4 rounded-xl">
                          <div className="text-3xl font-black text-indigo-600">{sessionPicks}</div>
                          <div className="text-xs uppercase font-bold text-gray-400">Lượt gọi</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl">
                          <div className="text-3xl font-black text-green-600">{sessionPoints}</div>
                          <div className="text-xs uppercase font-bold text-gray-400">Tổng điểm</div>
                      </div>
                  </div>

                  <button onClick={() => setCurrentView('SETUP')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                      Về Màn Hình Chính
                  </button>
              </div>
          </div>
      )
  }

  if (currentView === 'SUMMARY') return renderSummary();
  if (currentView === 'GAME') return renderGameOverlay();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold text-white animate-fade-in flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-gray-800'
          }`}>
              {toast.type === 'error' && <AlertTriangle size={18}/>}
              {toast.type === 'success' && <CheckCircle size={18}/>}
              {toast.message}
          </div>
      )}

      {showTimerModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 pointer-events-auto">
              <div className={`${isTimerFullScreen ? 'fixed inset-0 w-full h-full max-w-none rounded-none bg-indigo-900 text-white flex flex-col justify-center' : 'bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative'}`}>
                   <button onClick={() => setShowTimerModal(false)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"><X size={24}/></button>
                   <button onClick={() => setIsTimerFullScreen(!isTimerFullScreen)} className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full">
                       {isTimerFullScreen ? <Minimize size={24}/> : <Maximize size={24}/>}
                   </button>
                   
                   {!isTimerFullScreen && <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-700"><Timer size={22}/> Đồng Hồ Đếm Ngược</h3>}
                   
                   <div className={`${isTimerFullScreen ? 'scale-150' : ''} text-center mb-6 bg-gray-900 rounded-xl p-6 text-white shadow-inner relative overflow-hidden transition-all duration-300`}>
                       <div className={`${isTimerFullScreen ? 'text-[15vw]' : 'text-7xl'} font-mono font-black tracking-widest relative z-10 transition-all`}>
                           {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                       </div>
                       <div className="absolute bottom-0 left-0 h-2 bg-indigo-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / timerDuration) * 100}%`}}></div>
                   </div>

                   <div className="flex justify-center gap-2 mb-4 flex-wrap">
                       {[1, 2, 3, 4, 5].map(m => (
                           <button 
                                key={m} 
                                onClick={() => { setTimerDuration(m * 60); setTimeLeft(m * 60); setIsTimerRunning(false); }}
                                className={`px-3 py-1 rounded border text-sm font-bold ${timerDuration === m * 60 ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'hover:bg-gray-50 border-gray-200'} ${isTimerFullScreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}`}
                           >
                               {m}m
                           </button>
                       ))}
                       <div className={`flex items-center gap-1 border border-gray-200 rounded px-2 ${isTimerFullScreen ? 'bg-white text-black' : ''}`}>
                           <input 
                                className="w-8 text-sm outline-none text-center font-bold bg-transparent" 
                                placeholder=".."
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if(val > 0) {
                                        setTimerDuration(val * 60);
                                        setTimeLeft(val * 60);
                                        setIsTimerRunning(false);
                                    }
                                }}
                           />
                           <span className="text-xs text-gray-400">m</span>
                       </div>
                   </div>

                   <div className="flex gap-2">
                       <button 
                            onClick={() => setIsTimerRunning(!isTimerRunning)} 
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-transform active:scale-95 ${isTimerRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
                       >
                           {isTimerRunning ? <><PauseCircle /> Tạm dừng</> : <><PlayCircle /> Bắt đầu</>}
                       </button>
                       <button 
                            onClick={() => { setTimeLeft(timerDuration); setIsTimerRunning(false); }}
                            className={`px-4 rounded-xl font-bold ${isTimerFullScreen ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                       >
                           <RotateCcw size={20}/>
                       </button>
                   </div>
              </div>
          </div>
      )}

      {showChangelog && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Tag size={20} className="text-indigo-600"/> Phiên bản cập nhật</h3>
                      <button onClick={() => setShowChangelog(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4">
                      {Storage.getChangelog().map((log, i) => (
                          <div key={i} className="border-l-4 border-indigo-200 pl-4 py-1">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-indigo-700 text-lg">v{log.version}</span>
                                  <span className="text-xs text-gray-400 font-medium">{log.date}</span>
                              </div>
                              <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                                  {log.changes.map((change, j) => <li key={j}>{change}</li>)}
                              </ul>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {showHelp && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl h-[70vh] shadow-2xl flex overflow-hidden">
                  <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen size={20} className="text-indigo-600"/> Hướng Dẫn</h3>
                      <div className="space-y-1">
                          {HELP_CONTENT.map((section, idx) => (
                              <button
                                  key={idx}
                                  onClick={() => setActiveHelpTab(idx)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeHelpTab === idx ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                  {section.title}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="w-2/3 p-6 overflow-y-auto relative">
                      <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">{HELP_CONTENT[activeHelpTab].title}</h2>
                      <div className="prose prose-sm max-w-none">
                          {HELP_CONTENT[activeHelpTab].content}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showEndConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-fade-in text-center">
                  <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <LogOut size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Kết thúc phiên làm việc?</h3>
                  <p className="text-gray-500 text-sm mb-6">Bạn có chắc muốn kết thúc và xem tổng kết điểm không?</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">
                          Hủy
                      </button>
                      <button onClick={confirmEndSession} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                          Kết thúc
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showManualPick && activeClass && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-0 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Hand size={20} className="text-indigo-600"/> Gọi Chỉ Định</h3>
                      <button onClick={() => setShowManualPick(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-4 border-b">
                      <input 
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="Tìm tên học sinh hoặc tên nhóm..." 
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                        autoFocus
                      />
                  </div>

                  <div className="overflow-y-auto p-4 space-y-2 flex-grow">
                      <div className="mb-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Nhóm</h4>
                          <div className="grid grid-cols-2 gap-2">
                             {[...new Set(activeClass.students.map(s => s.group).filter((g): g is string => !!g) as string[])]
                                .filter(g => g.toLowerCase().includes(manualSearch.toLowerCase()))
                                .map(g => (
                                 <button 
                                    key={g} 
                                    onClick={() => handleManualPick({name: g, isGroup: true})}
                                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 text-left"
                                 >
                                     🛡️ {g}
                                 </button>
                             ))}
                          </div>
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Học Sinh</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {activeClass.students.filter(s => s.name.toLowerCase().includes(manualSearch.toLowerCase())).map(s => (
                                 <button 
                                    key={s.id} 
                                    onClick={() => handleManualPick(s)}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors text-left"
                                 >
                                     <span className="text-xl">{s.avatar}</span>
                                     <div className="min-w-0">
                                         <div className="font-bold text-gray-700 truncate">{s.name}</div>
                                         <div className="text-xs text-gray-400">{s.group}</div>
                                     </div>
                                 </button>
                             ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><SettingsIcon size={20}/> Cài Đặt</h3>
                  
                  <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Thời gian</h4>
                          <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium">Quay thường</label>
                                <span className="text-sm font-bold text-indigo-600">{settings.spinDuration}s</span>
                            </div>
                            <input type="range" min="1" max="15" value={settings.spinDuration} onChange={(e) => updateSettings({spinDuration: parseInt(e.target.value)})} className="w-full accent-indigo-600"/>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium">Cuộc đua (Race)</label>
                                <span className="text-sm font-bold text-indigo-600">{settings.raceDuration}s</span>
                            </div>
                            <input type="range" min="5" max="30" value={settings.raceDuration} onChange={(e) => updateSettings({raceDuration: parseInt(e.target.value)})} className="w-full accent-indigo-600"/>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                           <h4 className="text-xs font-bold text-gray-500 uppercase">Điểm số</h4>
                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold block text-blue-600">Cá nhân (Cộng)</label>
                                    <input type="number" value={settings.maxPoints} onChange={(e) => updateSettings({maxPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold block text-red-600">Cá nhân (Trừ)</label>
                                    <input type="number" value={settings.minusPoints} onChange={(e) => updateSettings({minusPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold block text-blue-600">Nhóm (Cộng)</label>
                                    <input type="number" value={settings.groupPoints} onChange={(e) => updateSettings({groupPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold block text-red-600">Nhóm (Trừ)</label>
                                    <input type="number" value={settings.groupMinusPoints} onChange={(e) => updateSettings({groupMinusPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                           </div>
                           
                           <hr className="border-gray-200"/>
                           
                           <h5 className="text-xs font-bold text-indigo-500">Điểm May Mắn Cá Nhân</h5>
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium block mb-1">Min</label>
                                    <input type="number" value={settings.minLuckyPoints} onChange={(e) => updateSettings({minLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Max</label>
                                    <input type="number" value={settings.maxLuckyPoints} onChange={(e) => updateSettings({maxLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                           </div>

                           <h5 className="text-xs font-bold text-purple-500">Điểm May Mắn Nhóm (MỚI)</h5>
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium block mb-1">Min</label>
                                    <input type="number" value={settings.minGroupLuckyPoints} onChange={(e) => updateSettings({minGroupLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Max</label>
                                    <input type="number" value={settings.maxGroupLuckyPoints} onChange={(e) => updateSettings({maxGroupLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                           </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                          <span className="font-medium text-sm">Cho phép lặp lại?</span>
                          <input type="checkbox" checked={settings.allowRepeats} onChange={(e) => updateSettings({allowRepeats: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                      </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setShowSettings(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300">Đóng</button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Play size={20} fill="currentColor"/></div>
                      <span className="font-bold text-lg tracking-tight text-gray-800">ClassRandomizer</span>
                      <button onClick={() => setShowChangelog(true)} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200 hover:bg-indigo-200">v1.8</button>
                  </div>
                  
                  <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => setShowTimerModal(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors" title="Đồng hồ">
                          <Timer size={20} />
                      </button>
                      <button onClick={toggleFullScreen} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors hidden sm:block" title="Toàn màn hình">
                          {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </button>
                      <button onClick={() => setShowHelp(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors" title="Hướng dẫn">
                          <BookOpen size={20} />
                      </button>
                      <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-indigo-600 transition-colors" title="Cài đặt">
                          <SettingsIcon size={20} />
                      </button>
                      
                      {currentView === 'SESSION' && (
                          <div className="flex gap-1 ml-2">
                            <button onClick={resetData} className="flex items-center gap-1 bg-white text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-red-500 font-bold text-xs md:text-sm border border-gray-200 transition-colors" title="Reset điểm">
                                <RotateCcw size={16} />
                            </button>
                            <button onClick={triggerEndSession} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold text-xs md:text-sm border border-red-100 transition-colors">
                                <LogOut size={16} /> <span className="hidden sm:inline">Kết thúc</span>
                            </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-grow flex flex-col min-h-0">
          {currentView === 'SETUP' && (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-gray-200 pb-4 justify-between items-start md:items-center">
                      <div className="flex gap-2">
                          <button 
                              onClick={() => setSetupTab('CLASSES')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${setupTab === 'CLASSES' ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                          >
                              <Users size={18} /> Lớp Học
                          </button>
                          <button 
                              onClick={() => setSetupTab('QUESTIONS')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${setupTab === 'QUESTIONS' ? 'bg-pink-600 text-white shadow-lg ring-2 ring-pink-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                          >
                              <HelpCircle size={18} /> Câu Hỏi
                          </button>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                           <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                               <Cloud size={14} className="text-gray-400"/>
                               <input 
                                  type="password" 
                                  placeholder="Google Script URL..." 
                                  className="bg-transparent border-none text-xs w-24 sm:w-32 focus:ring-0 px-0"
                                  value={cloudUrl}
                                  onChange={e => setCloudUrl(e.target.value)}
                               />
                               <button onClick={handleSaveCloudUrl} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded" title="Lưu URL"><Save size={14}/></button>
                           </div>
                           <div className="w-px h-6 bg-gray-300 mx-1"></div>
                           <button onClick={handleCloudUpload} disabled={isSyncing} className="p-2 bg-white rounded-lg shadow-sm hover:text-green-600 disabled:opacity-50 text-gray-500 transition-colors" title="Upload lên Cloud">
                               {isSyncing ? <RefreshCw size={18} className="animate-spin"/> : <CloudUpload size={18}/>}
                           </button>
                           <button onClick={handleCloudDownload} disabled={isSyncing} className="p-2 bg-white rounded-lg shadow-sm hover:text-blue-600 disabled:opacity-50 text-gray-500 transition-colors" title="Download từ Cloud">
                               {isSyncing ? <RefreshCw size={18} className="animate-spin"/> : <CloudDownload size={18}/>}
                           </button>
                           <div className="w-px h-6 bg-gray-300 mx-1"></div>
                           <button onClick={handleExportData} className="p-2 bg-white rounded-lg shadow-sm hover:text-indigo-600 text-gray-500 transition-colors" title="Xuất dữ liệu backup"><Download size={18}/></button>
                           <label className="p-2 bg-white rounded-lg shadow-sm hover:text-indigo-600 text-gray-500 transition-colors cursor-pointer" title="Nhập dữ liệu backup">
                               <Upload size={18}/>
                               <input type="file" className="hidden" accept=".json" onChange={handleImportData} ref={fileInputRef}/>
                           </label>
                      </div>
                  </div>

                  <div className="flex-grow min-h-0">
                      {setupTab === 'CLASSES' ? (
                          <ClassManager 
                              classes={classes} 
                              activeClassId={activeClassId} 
                              onUpdateClasses={handleUpdateClasses}
                              onSetActive={handleSetActiveClass}
                          />
                      ) : (
                          <QuestionManager 
                              questions={questions}
                              onUpdateQuestions={handleUpdateQuestions}
                          />
                      )}
                  </div>
                  
                  {setupTab === 'CLASSES' && activeClass && (
                      <div className="mt-6 flex justify-center sticky bottom-0 z-10">
                          <button 
                              onClick={startSession}
                              className="group relative bg-indigo-600 text-white text-xl font-black px-12 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-4 overflow-hidden"
                          >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              <PlayCircle size={32} className="animate-pulse"/> BẮT ĐẦU PHIÊN
                          </button>
                      </div>
                  )}
              </div>
          )}

          {currentView === 'SESSION' && renderLeaderboard()}
      </main>
    </div>
  );
}

export default App;
