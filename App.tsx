

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Play, BarChart2, Settings as SettingsIcon, Home, UserCheck, ShieldAlert, Award, RefreshCw, X, Grid2X2, Timer, Volume2, Trophy, LogOut, ChevronDown, ChevronUp, Users, Hand, Download, Upload, Database, Maximize, Minimize, Clock, PlayCircle, PauseCircle, RotateCcw, HelpCircle, BookOpen, CheckCircle, XCircle, FileClock, Tag, AlertTriangle, Cloud, CloudUpload, CloudDownload, Link, Save, Copy, Pin, Trash, CornerDownLeft, Dices, Youtube, Mic, Lock, Unlock, Code, GripVertical, Check, PartyPopper } from 'lucide-react';
import * as Storage from './services/storage.service';
import { ClassGroup, Student, PresentationMode, SelectionLogic, Settings as GameSettings, Question } from './types';
import ClassManager from './components/ClassManager';
import QuestionManager from './components/QuestionManager'; 
import VideoLibrary from './components/VideoLibrary';
import { NoiseMonitor } from './components/NoiseMonitor';
import { VisualizationContainer } from './components/Visualizers';
import { playTick, playWin } from './services/sound';
import { MathRenderer } from './components/MathRenderer';
import canvasConfetti from 'canvas-confetti';

// --- Helper Functions ---
const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleTimeString() : 'Chưa gọi';

// --- ACHIEVEMENT LOGIC ---
// Define ALL Badges here
const BADGE_INFO: {[key: string]: string} = {
    'FIRST_PICK': 'Tân binh: Lần đầu được gọi!',
    'HIGH_SCORE_20': 'Tập sự: Đạt mốc 20 điểm',
    'HIGH_SCORE_50': 'Cao thủ: Đạt mốc 50 điểm',
    'HIGH_SCORE_100': 'Huyền thoại: Đạt mốc 100 điểm',
    'HIGH_SCORE_200': 'Siêu việt: Đạt mốc 200 điểm',
    'HIGH_SCORE_500': 'Thần thánh: Đạt mốc 500 điểm',
    'LUCKY_STAR': 'Sao may mắn: Nhận điểm may mắn',
    'SURVIVOR': 'Vua lì đòn: Bị trừ điểm nhưng vẫn cười',
    'QUIZ_WIZARD': 'Phù thủy tri thức: Trả lời đúng',
    // New Badges
    'SPEED_DEMON': 'Thần tốc: Trả lời cực nhanh',
    'STREAK_3': 'Chuỗi thắng: 3 lần đúng liên tiếp',
    'GROUP_POWER': 'Team Đoàn Kết: Cả nhóm cùng chiến thắng'
};

const BADGE_ICONS: {[key: string]: React.ReactNode} = {
    'FIRST_PICK': '🌱', 
    'HIGH_SCORE_20': '🔥',
    'HIGH_SCORE_50': '👑', 
    'HIGH_SCORE_100': '💎',
    'HIGH_SCORE_200': '🚀',
    'HIGH_SCORE_500': '🌌',
    'LUCKY_STAR': '🍀',
    'SURVIVOR': '🛡️',
    'QUIZ_WIZARD': '🧙‍♂️',
    'SPEED_DEMON': '⚡',
    'STREAK_3': '🔥',
    'GROUP_POWER': '🤝'
};

// Badges that require a score threshold config
const SCORE_BASED_BADGES = ['HIGH_SCORE_20', 'HIGH_SCORE_50', 'HIGH_SCORE_100', 'HIGH_SCORE_200', 'HIGH_SCORE_500'];

const checkAchievements = (student: Student, actionType: 'PICK' | 'SCORE' | 'LUCKY' | 'CORRECT_ANSWER', scoreDelta: number = 0, thresholds: {[key: string]: number}): string[] => {
    const currentBadges = student.achievements || [];
    const newBadges: string[] = [];

    // Rule 1: First Pick
    if (actionType === 'PICK' && student.lastPickedDate === null && !currentBadges.includes('FIRST_PICK')) {
        newBadges.push('FIRST_PICK');
    }

    // Rule 2: High Scores (Check against cumulative score)
    const checkScore = student.cumulativeScore || student.score;

    if (checkScore >= (thresholds['HIGH_SCORE_20'] || 20) && !currentBadges.includes('HIGH_SCORE_20')) newBadges.push('HIGH_SCORE_20');
    if (checkScore >= (thresholds['HIGH_SCORE_50'] || 50) && !currentBadges.includes('HIGH_SCORE_50')) newBadges.push('HIGH_SCORE_50');
    if (checkScore >= (thresholds['HIGH_SCORE_100'] || 100) && !currentBadges.includes('HIGH_SCORE_100')) newBadges.push('HIGH_SCORE_100');
    if (checkScore >= (thresholds['HIGH_SCORE_200'] || 200) && !currentBadges.includes('HIGH_SCORE_200')) newBadges.push('HIGH_SCORE_200');
    if (checkScore >= (thresholds['HIGH_SCORE_500'] || 500) && !currentBadges.includes('HIGH_SCORE_500')) newBadges.push('HIGH_SCORE_500');

    // Rule 3: Lucky
    if (actionType === 'LUCKY' && !currentBadges.includes('LUCKY_STAR')) {
        newBadges.push('LUCKY_STAR');
    }

    // Rule 4: Survivor (Negative score given)
    if (scoreDelta < 0 && !currentBadges.includes('SURVIVOR')) {
        newBadges.push('SURVIVOR');
    }

    // Rule 5: Correct Answer
    if (actionType === 'CORRECT_ANSWER' && !currentBadges.includes('QUIZ_WIZARD')) {
        newBadges.push('QUIZ_WIZARD');
    }

    return newBadges;
};

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
        title: "2. Google Apps Script (Cloud Sync)",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p>Để đồng bộ dữ liệu giữa các máy, bạn cần tạo một Google Apps Script. Các bước thực hiện:</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Truy cập <a href="https://script.google.com/" target="_blank" className="text-blue-600 underline">script.google.com</a> và tạo dự án mới.</li>
                    <li>Xóa toàn bộ code cũ và dán đoạn code bên dưới vào.</li>
                    <li>Nhấn <b>Deploy</b> (Triển khai) → <b>New Deployment</b> (Tùy chọn mới).</li>
                    <li>Chọn loại: <b>Web App</b>.</li>
                    <li>Who has access (Ai có quyền truy cập): Chọn <b>Anyone</b> (Bất kỳ ai).</li>
                    <li>Copy URL (Web App URL) và dán vào ô "Google Script URL" trong ứng dụng này.</li>
                </ol>
                <div className="bg-gray-800 text-green-400 p-3 rounded-md text-xs font-mono overflow-x-auto select-all mt-2">
{`function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var key = postData.key || 'backup_default';
    var value = postData.value;
    saveDataChunked(key, value);
    return ContentService.createTextOutput(JSON.stringify({'result': 'success', 'message': 'Saved successfully'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({'result': 'error', 'message': error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet(e) {
  try {
    var key = 'class_randomizer_backup';
    var data = loadDataChunked(key);
    var result = {};
    if (data) result[key] = data;
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({'result': 'error', 'message': error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
function saveDataChunked(key, dataObj) {
  var sheet = getSheet();
  var jsonString = JSON.stringify(dataObj);
  var chunkSize = 45000;
  var chunks = [];
  for (var i = 0; i < jsonString.length; i += chunkSize) chunks.push(jsonString.substring(i, i + chunkSize));
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var rowIndex = -1;
  for (var i = 0; i < values.length; i++) { if (values[i][0] == key) { rowIndex = i + 1; break; } }
  if (rowIndex == -1) { rowIndex = sheet.getLastRow() + 1; sheet.getRange(rowIndex, 1).setValue(key); }
  var maxCols = sheet.getMaxColumns();
  if (maxCols > 1) sheet.getRange(rowIndex, 2, 1, maxCols - 1).clearContent();
  for (var j = 0; j < chunks.length; j++) sheet.getRange(rowIndex, j + 2).setValue(chunks[j]);
  sheet.getRange(rowIndex, 1).setNote("Updated: " + new Date());
}
function loadDataChunked(key) {
  var sheet = getSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] == key) {
      var row = values[i];
      var jsonString = "";
      for (var j = 1; j < row.length; j++) { if (row[j]) jsonString += row[j]; }
      return JSON.parse(jsonString);
    }
  }
  return null;
}
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Database");
  if (!sheet) sheet = ss.insertSheet("Database");
  return sheet;
}`}
                </div>
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
  const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'THRESHOLDS'>('GENERAL');
  
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 
  const [showHelp, setShowHelp] = useState(false); 
  const [activeHelpTab, setActiveHelpTab] = useState(0);
  const [showVideoLib, setShowVideoLib] = useState(false); 
  const [showNoiseMonitor, setShowNoiseMonitor] = useState(false); 

  const [isFullScreen, setIsFullScreen] = useState(false);

  const [showManualPick, setShowManualPick] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); 
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFullScreen, setIsTimerFullScreen] = useState(false);

  // Question Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  
  // Sequence Question State
  const [sequenceUserOrder, setSequenceUserOrder] = useState<string[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Matching Question State
  const [matchingSelectedLeft, setMatchingSelectedLeft] = useState<number | null>(null);
  const [matchingConnections, setMatchingConnections] = useState<Map<number, number>>(new Map()); // LeftIndex -> RightIndex
  const [shuffledRightSide, setShuffledRightSide] = useState<{text: string, originalIndex: number}[]>([]);

  // Congratulation Modal State
  const [congratulationData, setCongratulationData] = useState<{student: Student, badges: string[]} | null>(null);

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
  const [cloudUrl, setCloudUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClasses(Storage.getClasses());
    setQuestions(Storage.getQuestions());
    setCloudUrl(Storage.getCloudUrl()); 
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

  // Congratulation Effect
  useEffect(() => {
      if (congratulationData) {
          playWin();
          canvasConfetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 }
          });
      }
  }, [congratulationData]);

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
      if(!window.confirm("Bạn có chắc muốn lưu TOÀN BỘ dữ liệu (Lớp, Cài đặt, Video,...) lên Google Sheet? Dữ liệu cũ trên Sheet sẽ bị ghi đè.")) return;
      
      setIsSyncing(true);
      const fullData = {
          classes: Storage.getClasses(),
          settings: Storage.getSettings(),
          questions: Storage.getQuestions(),
          videos: Storage.getVideos()
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
          if(data.classes) { setClasses(data.classes); Storage.saveClasses(data.classes); }
          if(data.settings) { setSettings(data.settings); Storage.saveSettings(data.settings); }
          if(data.questions) { setQuestions(data.questions); Storage.saveQuestions(data.questions); }
          if(data.videos) { Storage.saveVideos(data.videos); }
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
  
  const classTotalCumulativeScore = useMemo(() => {
      if (!activeClass) return 0;
      return activeClass.students.reduce((sum, s) => sum + (s.cumulativeScore || 0), 0);
  }, [activeClass]);

  const startSession = () => {
      if (!activeClass || activeClass.students.length === 0) {
          showToast("Lớp học trống! Vui lòng chọn lớp có học sinh.", 'error');
          return;
      }
      setSessionPoints(0);
      setSessionPicks(0);
      setPendingStudents([]); 
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

    // IMPORTANT: If we are in Show Question First mode, we need to temporarily hide modal
    if (showQuestionModal) {
        setShowQuestionModal(false);
    }

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

    let eligiblePool = activeClass.students.filter(s => 
        !pendingStudents.find(p => p.id === s.id) && 
        !s.isAbsent
    );

    if (eligiblePool.length === 0) {
         if (activeClass.students.filter(s => !s.isAbsent).length === 0) {
             showToast("Lớp vắng hết! Không còn ai để gọi.", 'error');
             return;
         }
         if (pendingStudents.length > 0) {
             showToast("Tất cả học sinh có mặt đang trên bảng!", 'error');
             return;
         }
         showToast("Lỗi không xác định khi lọc danh sách.", 'error');
         return;
    }

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

    const pickedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setWinner(pickedWinner);

    let visualCandidates = activeClass.students.filter(s => !s.isAbsent);
    if (!visualCandidates.find(s => s.id === pickedWinner.id)) {
        visualCandidates.push(pickedWinner);
    }
    setRoundCandidates(visualCandidates);

    if (preferredMode !== 'RANDOM') {
        setGameMode(preferredMode);
    } else {
        const unlockedModes = Object.values(PresentationMode).filter(m => {
             const threshold = settings.gameUnlockThresholds?.[m] || 0;
             return classTotalCumulativeScore >= threshold;
        });
        setGameMode(unlockedModes[Math.floor(Math.random() * unlockedModes.length)]);
    }
    setCurrentView('GAME');
  };

  const startGroupRandomizer = () => {
    if (!activeClass) return;

    if (showQuestionModal) setShowQuestionModal(false);

    const uniqueGroupNames = [...new Set(activeClass.students.map(s => s.group).filter(g => g && g.trim() !== ''))];
    if (uniqueGroupNames.length === 0) {
        showToast("Chưa có nhóm nào được tạo!", 'error');
        return;
    }

    setShowResultOverlay(false);
    setScoreAnimation({value: 0, visible: false});
    setWinner(null);
    setIsGroupSpin(true);

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
        cumulativeScore: 0,
        tags: [],
        lastPickedDate: null,
        achievements: [],
        isAbsent: false
    }));

    const winningGroupCandidate = groupCandidates.find(g => g.name === winningGroupName)!;
    setWinner(winningGroupCandidate);
    setRoundCandidates(groupCandidates);

    const availableModes = [
        PresentationMode.SIMPLE, PresentationMode.RACE, PresentationMode.WHEEL, 
        PresentationMode.BOX, PresentationMode.SPOTLIGHT, PresentationMode.FLIP, 
        PresentationMode.LUCKY_CARDS, PresentationMode.DICE, PresentationMode.EGG_HATCH
    ].filter(m => classTotalCumulativeScore >= (settings.gameUnlockThresholds?.[m] || 0));

    setGameMode(availableModes[Math.floor(Math.random() * availableModes.length)] || PresentationMode.SIMPLE);
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
              cumulativeScore: 0,
              tags: [],
              lastPickedDate: null,
              achievements: [],
              isAbsent: false
          };
      } else {
          winningCandidate = studentOrGroup as Student;
      }

      setWinner(winningCandidate);
      setIsGroupSpin(isGroup);
      setScoreAnimation({value: 0, visible: false});
      setShowManualPick(false);
      
      // If a question was active (Show Question First mode), we go back to the question modal later, 
      // but first show the winner.
      setCurrentView('GAME'); 
      setShowResultOverlay(true); 
  };

  const handleGameComplete = () => {
    setShowResultOverlay(true);
    setSessionPicks(prev => prev + 1);
    
    if (winner && activeClass) {
        let updatedStudents = [...activeClass.students];
        const now = Date.now();
        let newBadgesUnlocked: string[] = [];

        if (isGroupSpin) {
            updatedStudents = updatedStudents.map(s => 
                s.group === winner.name ? { ...s, lastPickedDate: now } : s
            );
        } else {
            updatedStudents = updatedStudents.map(s => {
                if (s.id === winner.id) {
                     const badges = checkAchievements(s, 'PICK', 0, settings.achievementThresholds);
                     if (badges.length > 0) {
                         newBadgesUnlocked = badges;
                         return { ...s, lastPickedDate: now, achievements: [...(s.achievements || []), ...badges] };
                     }
                     return { ...s, lastPickedDate: now };
                }
                return s;
            });
        }
        const updatedClass = { ...activeClass, students: updatedStudents };
        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
        
        if (newBadgesUnlocked.length > 0) {
             setCongratulationData({ student: winner, badges: newBadgesUnlocked });
        }
    }
  };

  const handleAddScore = (points: number, closeOverlay = true, actionType: 'SCORE' | 'LUCKY' = 'SCORE') => {
      setScoreAnimation({ value: points, visible: true });

      if (winner && activeClass) {
        let updatedStudents: Student[] = [];
        let finalPoints = points;
        let newBadgesUnlocked: string[] = [];
        
        if (isGroupSpin) {
            const targetGroup = winner.name; 
            updatedStudents = activeClass.students.map(s => {
                if (s.group === targetGroup) {
                    return { 
                        ...s, 
                        score: s.score + finalPoints,
                        cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, finalPoints) 
                    };
                }
                return s;
            });
            const count = activeClass.students.filter(s => s.group === targetGroup).length;
            setSessionPoints(prev => prev + (finalPoints * count));
        } else {
            updatedStudents = activeClass.students.map(s => {
                if (s.id === winner.id) {
                    const newScore = s.score + finalPoints;
                    const newCumulative = (s.cumulativeScore || 0) + Math.max(0, finalPoints);
                    const tempStudent = { ...s, score: newScore, cumulativeScore: newCumulative };
                    const badges = checkAchievements(tempStudent, actionType, finalPoints, settings.achievementThresholds);
                    if (badges.length > 0) newBadgesUnlocked = badges;
                    return { ...tempStudent, achievements: [...(s.achievements || []), ...badges] };
                }
                return s;
            });
            setSessionPoints(prev => prev + finalPoints);
        }

        const updatedClass = { ...activeClass, students: updatedStudents };
        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
        
        if (newBadgesUnlocked.length > 0) {
            setCongratulationData({ student: winner, badges: newBadgesUnlocked });
        }

        if (closeOverlay) {
            setTimeout(() => {
                // If question was active, check if we should go back
                setCurrentView('SESSION');
                setScoreAnimation({ value: 0, visible: false });
                setShowQuestionModal(false);
                setActiveQuestion(null); // Close question flow
            }, 1800);
        } else {
            setTimeout(() => {
                 setScoreAnimation({ value: 0, visible: false });
            }, 2000);
        }
    }
  };

  const handleAddToStage = () => {
      if (winner) {
          if (!pendingStudents.find(s => s.id === winner.id)) {
              setPendingStudents(prev => [...prev, winner]);
              showToast(`Đã thêm ${winner.name} vào danh sách chờ!`, 'success');
          }
          setCurrentView('SESSION');
          setShowResultOverlay(false);
          setActiveQuestion(null); // Reset active question
          setShowQuestionModal(false);
      }
  };

  const handleRemoveFromStage = (studentId: string) => {
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleGradeFromStage = (student: Student, points: number, actionType: 'SCORE' | 'LUCKY' = 'SCORE') => {
      if (!activeClass) return;
      
      let updatedStudents: Student[] = [];
      const isGroupItem = student.id.startsWith('GROUP_');
      let newBadgesUnlocked: string[] = [];

      if (isGroupItem) {
           const targetGroup = student.name;
           updatedStudents = activeClass.students.map(s => {
               if (s.group === targetGroup) {
                   return {
                       ...s,
                       score: s.score + points,
                       cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, points)
                   };
               }
               return s;
           });
           const count = activeClass.students.filter(s => s.group === targetGroup).length;
           setSessionPoints(prev => prev + (points * count));
      } else {
           updatedStudents = activeClass.students.map(s => {
               if (s.id === student.id) {
                   const newScore = s.score + points;
                   const newCumulative = (s.cumulativeScore || 0) + Math.max(0, points);
                   const tempStudent = { ...s, score: newScore, cumulativeScore: newCumulative };
                   const badges = checkAchievements(tempStudent, actionType, points, settings.achievementThresholds);
                   if (badges.length > 0) newBadgesUnlocked = badges;
                   return { ...tempStudent, achievements: [...(s.achievements || []), ...badges] };
               }
               return s;
           });
           setSessionPoints(prev => prev + points);
      }

      const updatedClass = { ...activeClass, students: updatedStudents };
      handleUpdateClasses(classes.map(c => c.id === activeClass.id ? updatedClass : c));
      
      if (points > 0) playWin();
      else playTick();

      if (newBadgesUnlocked.length > 0) {
           setCongratulationData({ student: student, badges: newBadgesUnlocked });
      }

      handleRemoveFromStage(student.id);
  };

  const handleLuckyGradeFromStage = (student: Student) => {
      const isGroup = student.id.startsWith('GROUP_');
      const min = isGroup ? settings.minGroupLuckyPoints : settings.minLuckyPoints;
      const max = isGroup ? settings.maxGroupLuckyPoints : settings.maxLuckyPoints;
      const points = Math.floor(Math.random() * (max - min + 1)) + min;
      showToast(`${student.name}: +${points} điểm may mắn!`, 'success');
      handleGradeFromStage(student, points, 'LUCKY');
  };

  const handleOpenQuestion = () => {
      const availableQuestions = questions.filter(q => !q.isAnswered);
      
      if (availableQuestions.length === 0) {
          if (questions.length === 0) {
              showToast("Chưa có câu hỏi! Vào Cài đặt → Câu hỏi để thêm.", 'error');
          } else {
              showToast("Tất cả câu hỏi đã được trả lời! Vào Ngân hàng câu hỏi để Reset.", 'info');
          }
          return;
      }

      const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      setActiveQuestion(randomQ);
      setAnswerStatus('IDLE');
      setSelectedOption(null);
      
      // Setup Sequence mode
      if (randomQ.type === 'SEQUENCE' && randomQ.options) {
          const shuffled = [...randomQ.options].sort(() => 0.5 - Math.random());
          setSequenceUserOrder(shuffled);
      }
      
      // Setup Matching mode
      if (randomQ.type === 'MATCHING' && randomQ.pairs) {
          setMatchingSelectedLeft(null);
          setMatchingConnections(new Map());
          // Shuffle Right Side
          const rightSide = randomQ.pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
          setShuffledRightSide(rightSide.sort(() => 0.5 - Math.random()));
      }

      // If we are opening from Game Overlay, assume we have a winner.
      // If we open from dashboard (Show Question First), winner is null initially.
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
          
          if (winner && !isGroupSpin) {
              let newBadgesUnlocked: string[] = [];
              let updatedStudents = activeClass!.students.map(s => {
                  if (s.id === winner.id) {
                      const badges = checkAchievements(s, 'CORRECT_ANSWER', 0, settings.achievementThresholds);
                      if(badges.length > 0) newBadgesUnlocked = badges;
                      return { ...s, achievements: [...(s.achievements || []), ...badges]};
                  }
                  return s;
              });
              const updatedClass = { ...activeClass!, students: updatedStudents };
              handleUpdateClasses(classes.map(c => c.id === activeClass!.id ? updatedClass : c));
              if(newBadgesUnlocked.length > 0) setCongratulationData({ student: winner, badges: newBadgesUnlocked });
          }
          setTimeout(() => setShowQuestionModal(false), 1500);
      } else {
          setAnswerStatus('WRONG');
          playTick(); 
          setTimeout(() => setShowQuestionModal(false), 1500);
      }
  };

  const handleEssayGrade = (isCorrect: boolean) => {
      if (activeQuestion) markQuestionAsAnswered(activeQuestion.id);

      if (isCorrect) {
          setAnswerStatus('CORRECT');
          playWin();
          
          if (winner && !isGroupSpin) {
            let newBadgesUnlocked: string[] = [];
            let updatedStudents = activeClass!.students.map(s => {
                if (s.id === winner.id) {
                    const badges = checkAchievements(s, 'CORRECT_ANSWER', 0, settings.achievementThresholds);
                    if(badges.length > 0) newBadgesUnlocked = badges;
                    return { ...s, achievements: [...(s.achievements || []), ...badges]};
                }
                return s;
            });
            const updatedClass = { ...activeClass!, students: updatedStudents };
            handleUpdateClasses(classes.map(c => c.id === activeClass!.id ? updatedClass : c));
            if(newBadgesUnlocked.length > 0) setCongratulationData({ student: winner, badges: newBadgesUnlocked });
          }
          setTimeout(() => setShowQuestionModal(false), 1500);
      } else {
          setAnswerStatus('WRONG');
          playTick();
          setTimeout(() => setShowQuestionModal(false), 1500);
      }
  };

  // --- SEQUENCE DRAG & DROP LOGIC ---
  const handleDragStart = (index: number) => {
      setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
      if (draggedItemIndex === null) return;
      const newOrder = [...sequenceUserOrder];
      const movedItem = newOrder.splice(draggedItemIndex, 1)[0];
      newOrder.splice(targetIndex, 0, movedItem);
      setSequenceUserOrder(newOrder);
      setDraggedItemIndex(null);
  };

  const handleCheckSequence = () => {
      if (!activeQuestion || !activeQuestion.options) return;
      
      const correctOrder = activeQuestion.options;
      const isCorrect = sequenceUserOrder.every((val, index) => val === correctOrder[index]);

      if (isCorrect) {
          setAnswerStatus('CORRECT');
          playWin();
          markQuestionAsAnswered(activeQuestion.id);
           if (winner && !isGroupSpin) {
            let newBadgesUnlocked: string[] = [];
            let updatedStudents = activeClass!.students.map(s => {
                if (s.id === winner.id) {
                    const badges = checkAchievements(s, 'CORRECT_ANSWER', 0, settings.achievementThresholds);
                    if(badges.length > 0) newBadgesUnlocked = badges;
                    return { ...s, achievements: [...(s.achievements || []), ...badges]};
                }
                return s;
            });
            const updatedClass = { ...activeClass!, students: updatedStudents };
            handleUpdateClasses(classes.map(c => c.id === activeClass!.id ? updatedClass : c));
            if(newBadgesUnlocked.length > 0) setCongratulationData({ student: winner, badges: newBadgesUnlocked });
          }
          setTimeout(() => setShowQuestionModal(false), 2000);
      } else {
          setAnswerStatus('WRONG');
          playTick();
          showToast("Chưa chính xác! Hãy thử sắp xếp lại.", 'error');
          setTimeout(() => setAnswerStatus('IDLE'), 1000);
      }
  };

  // --- MATCHING LOGIC ---
  const handleLeftClick = (index: number) => {
      if (matchingConnections.has(index)) {
          // Remove connection if clicked again
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
          // Remove any existing connection to this right node
          for (let [key, val] of newMap.entries()) {
              if (val === rightIndex) newMap.delete(key);
          }
          newMap.set(matchingSelectedLeft, rightIndex);
          setMatchingConnections(newMap);
          setMatchingSelectedLeft(null);
      }
  };

  const handleCheckMatching = () => {
      if (!activeQuestion || !activeQuestion.pairs) return;
      
      // Correct logic: For each Left(i), Right should be shuffledRightSide item that has originalIndex == i
      let isCorrect = true;
      if (matchingConnections.size !== activeQuestion.pairs.length) isCorrect = false;
      else {
          matchingConnections.forEach((rightIdxInShuffled, leftIdx) => {
               if (shuffledRightSide[rightIdxInShuffled].originalIndex !== leftIdx) {
                   isCorrect = false;
               }
          });
      }

      if (isCorrect) {
          setAnswerStatus('CORRECT');
          playWin();
          markQuestionAsAnswered(activeQuestion.id);
           if (winner && !isGroupSpin) {
            let newBadgesUnlocked: string[] = [];
            let updatedStudents = activeClass!.students.map(s => {
                if (s.id === winner.id) {
                    const badges = checkAchievements(s, 'CORRECT_ANSWER', 0, settings.achievementThresholds);
                    if(badges.length > 0) newBadgesUnlocked = badges;
                    return { ...s, achievements: [...(s.achievements || []), ...badges]};
                }
                return s;
            });
            const updatedClass = { ...activeClass!, students: updatedStudents };
            handleUpdateClasses(classes.map(c => c.id === activeClass!.id ? updatedClass : c));
            if(newBadgesUnlocked.length > 0) setCongratulationData({ student: winner, badges: newBadgesUnlocked });
          }
          setTimeout(() => setShowQuestionModal(false), 2000);
      } else {
          setAnswerStatus('WRONG');
          playTick();
          showToast("Chưa chính xác! Hãy kiểm tra lại các cặp.", 'error');
          setTimeout(() => setAnswerStatus('IDLE'), 1000);
      }
  };


  const resetData = () => {
    if (!activeClassId) { showToast("Chưa chọn lớp để reset!", 'error'); return; }
    if (window.confirm('CẢNH BÁO: Bạn muốn đặt lại điểm số (Điểm phiên) về 0?')) {
        const storedClasses = Storage.getClasses();
        const updatedClasses = storedClasses.map(c => {
            if (c.id === activeClassId) {
                return {
                    ...c,
                    students: c.students.map(s => ({ ...s, score: 0, lastPickedDate: null }))
                };
            }
            return c;
        });
        Storage.saveClasses(updatedClasses);
        setClasses(updatedClasses);
        setSessionPoints(0);
        setSessionPicks(0);
        setPendingStudents([]);
        showToast("Đã reset điểm phiên!", 'success');
    }
  };

  const handleExportData = () => {
      const dataToExport = {
          version: 2.1,
          date: new Date().toISOString(),
          classes: Storage.getClasses(),
          settings: Storage.getSettings(),
          activeClassId: Storage.getActiveClassId(),
          questions: Storage.getQuestions(),
          videos: Storage.getVideos()
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
      if (!window.confirm("CẢNH BÁO: Dữ liệu nhập sẽ GHI ĐÈ dữ liệu hiện tại. Tiếp tục?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);
              if (!Array.isArray(data.classes)) throw new Error("File không hợp lệ.");
              Storage.saveClasses(data.classes);
              if (data.settings) Storage.saveSettings(data.settings);
              if (data.activeClassId) Storage.setActiveClassId(data.activeClassId);
              if (data.questions) Storage.saveQuestions(data.questions);
              if (data.videos) Storage.saveVideos(data.videos);
              setClasses(data.classes);
              setSettings(data.settings || Storage.getSettings());
              setActiveClassId(data.activeClassId || null);
              setQuestions(data.questions || []);
              showToast("Nhập dữ liệu thành công!", 'success');
          } catch (error) {
              console.error(error);
              showToast("Lỗi khi nhập file.", 'error');
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const getLuckyRangeText = () => isGroupSpin ? `${settings.minGroupLuckyPoints}~${settings.maxGroupLuckyPoints}` : `${settings.minLuckyPoints}~${settings.maxLuckyPoints}`;

  const handleLuckyPointClick = () => {
      const min = isGroupSpin ? settings.minGroupLuckyPoints : settings.minLuckyPoints;
      const max = isGroupSpin ? settings.maxGroupLuckyPoints : settings.maxLuckyPoints;
      const points = Math.floor(Math.random() * (max - min + 1)) + min;
      handleAddScore(points, true, 'LUCKY');
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
      const plusPoints = isGroupSpin ? settings.groupPoints : settings.maxPoints;
      const minusPoints = isGroupSpin ? settings.groupMinusPoints : settings.minusPoints;

      return (
          <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in pb-40">
              {/* --- CONTROL PANEL --- */}
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
                        <button onClick={handleOpenQuestion} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm">
                            <HelpCircle size={18} /> <span className="hidden sm:inline">Hiện câu hỏi</span>
                        </button>
                        <button onClick={() => setShowManualPick(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm">
                            <Hand size={18} /> <span className="hidden sm:inline">Thủ công</span>
                        </button>
                        <button onClick={startGroupRandomizer} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm">
                            <Grid2X2 size={18}/> Quay Nhóm
                        </button>
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
                            <button onClick={startRandomizer} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg font-bold text-sm flex items-center justify-center gap-2">
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

  const renderGameOverlay = () => {
     // If we are showing question first, winner might be null
     if (showQuestionModal && activeQuestion) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col">
                {/* FULL SCREEN HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-4">
                       <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest text-white shadow-md
                           ${activeQuestion.type === 'MCQ' ? 'bg-blue-500' : activeQuestion.type === 'SEQUENCE' ? 'bg-purple-600' : activeQuestion.type === 'MATCHING' ? 'bg-indigo-600' : 'bg-orange-500'}
                       `}>
                           {activeQuestion.type === 'MCQ' ? 'TRẮC NGHIỆM' : activeQuestion.type === 'SEQUENCE' ? 'SẮP XẾP' : activeQuestion.type === 'MATCHING' ? 'GHÉP NỐI' : 'TỰ LUẬN'}
                       </span>
                    </div>
                    <button onClick={() => { setShowQuestionModal(false); if(!winner) setActiveQuestion(null); }} className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600"><X size={28}/></button>
                </div>

                {/* FULL SCREEN CONTENT */}
                <div className="flex-grow flex flex-col items-center justify-center p-8 overflow-y-auto bg-white">
                    <div className="max-w-5xl w-full text-center mb-8 animate-fade-in-up">
                        <h2 className="text-3xl md:text-5xl font-black text-gray-800 leading-tight mb-6">
                            <MathRenderer text={activeQuestion.content} />
                        </h2>
                        {activeQuestion.image && (
                           <div className="mt-6 flex justify-center">
                               <img src={activeQuestion.image} alt="Question" className="max-h-[35vh] rounded-2xl border-4 border-gray-100 shadow-xl"/>
                           </div>
                        )}
                    </div>

                    {/* Show Pick Button if no winner yet */}
                    {!winner && (
                         <div className="mb-8">
                             <button 
                                onClick={startRandomizer}
                                className="bg-indigo-600 text-white text-xl font-bold px-8 py-4 rounded-full shadow-xl hover:bg-indigo-700 animate-bounce flex items-center gap-3"
                             >
                                 <Play size={24} fill="currentColor"/> Quay số tìm người trả lời
                             </button>
                         </div>
                    )}
                    
                    {/* Only show interaction if we have a winner OR for demonstration */}
                    <div className={`transition-opacity duration-500 ${!winner ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {/* MCQ SECTION */}
                        {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                                {activeQuestion.options.map((opt, idx) => {
                                    let btnClass = "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:shadow-lg";
                                    if (selectedOption === idx) {
                                        if (answerStatus === 'CORRECT') btnClass = "bg-green-500 text-white border-green-600 shadow-xl scale-105";
                                        else if (answerStatus === 'WRONG') btnClass = "bg-red-500 text-white border-red-600 shadow-xl";
                                        else btnClass = "bg-blue-50 border-blue-500 text-blue-700 shadow-md"; 
                                    } else if (answerStatus === 'WRONG' && idx === activeQuestion.correctAnswer) {
                                        btnClass = "bg-green-100 text-green-800 border-green-300 animate-pulse";
                                    }

                                    return (
                                        <button 
                                           key={idx}
                                           onClick={() => handleCheckAnswer(idx)}
                                           disabled={answerStatus !== 'IDLE'}
                                           className={`p-6 rounded-2xl text-left font-bold text-xl transition-all flex items-center gap-4 ${btnClass}`}
                                        >
                                            <span className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-lg border border-black/5 flex-shrink-0">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span><MathRenderer text={opt} /></span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* SEQUENCE SECTION */}
                        {activeQuestion.type === 'SEQUENCE' && (
                            <div className="w-full max-w-3xl mx-auto">
                                <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 mb-8">
                                    <p className="text-center text-purple-800 font-bold mb-4 flex items-center justify-center gap-2">
                                        <GripVertical size={20}/> Kéo thả để sắp xếp theo đúng thứ tự
                                    </p>
                                    <div className="space-y-3">
                                        {sequenceUserOrder.map((step, idx) => (
                                            <div 
                                               key={idx}
                                               draggable={answerStatus === 'IDLE'}
                                               onDragStart={() => handleDragStart(idx)}
                                               onDragOver={(e) => handleDragOver(e, idx)}
                                               onDrop={() => handleDrop(idx)}
                                               className={`p-4 bg-white rounded-xl shadow-sm border-2 cursor-grab active:cursor-grabbing flex items-center gap-4 transition-all
                                                   ${answerStatus === 'CORRECT' ? 'border-green-400 bg-green-50' : answerStatus === 'WRONG' ? 'border-red-300' : 'border-gray-200 hover:border-purple-300'}
                                               `}
                                            >
                                                <div className="text-gray-300"><GripVertical /></div>
                                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">{idx + 1}</div>
                                                <div className="font-bold text-gray-700 text-lg"><MathRenderer text={step} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {answerStatus === 'IDLE' && (
                                    <button 
                                       onClick={handleCheckSequence}
                                       className="w-full py-4 bg-purple-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-purple-700 transition-transform active:scale-95"
                                    >
                                        KIỂM TRA ĐÁP ÁN
                                    </button>
                                )}
                            </div>
                        )}

                        {/* MATCHING SECTION */}
                        {activeQuestion.type === 'MATCHING' && activeQuestion.pairs && (
                             <div className="w-full max-w-5xl mx-auto">
                                 <div className="grid grid-cols-2 gap-8 md:gap-16 relative">
                                     {/* Left Column */}
                                     <div className="space-y-4">
                                         {activeQuestion.pairs.map((pair, idx) => {
                                             const isSelected = matchingSelectedLeft === idx;
                                             const isConnected = matchingConnections.has(idx);
                                             return (
                                                 <div 
                                                     key={idx}
                                                     onClick={() => answerStatus === 'IDLE' && handleLeftClick(idx)}
                                                     className={`p-4 rounded-xl border-2 font-bold text-lg cursor-pointer transition-all relative
                                                         ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : isConnected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-indigo-300'}
                                                     `}
                                                 >
                                                     <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm z-10"></div>
                                                     <MathRenderer text={pair.left} />
                                                 </div>
                                             )
                                         })}
                                     </div>

                                     {/* Right Column */}
                                     <div className="space-y-4">
                                         {shuffledRightSide.map((item, idx) => {
                                             // Check if any left item connects to this right index (idx in shuffled array)
                                             let connectedLeftIndex = -1;
                                             matchingConnections.forEach((rightIdx, leftIdx) => {
                                                 if (rightIdx === idx) connectedLeftIndex = leftIdx;
                                             });
                                             const isConnected = connectedLeftIndex !== -1;

                                             return (
                                                 <div 
                                                     key={idx}
                                                     onClick={() => answerStatus === 'IDLE' && handleRightClick(idx)}
                                                     className={`p-4 rounded-xl border-2 font-bold text-lg cursor-pointer transition-all relative
                                                         ${isConnected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-indigo-300'}
                                                     `}
                                                 >
                                                     <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm z-10"></div>
                                                     <MathRenderer text={item.text} />
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 </div>
                                 
                                 {answerStatus === 'IDLE' && (
                                     <div className="mt-8 text-center">
                                          <button 
                                            onClick={handleCheckMatching}
                                            className="px-12 py-4 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 transition-transform active:scale-95"
                                         >
                                             KIỂM TRA CẶP
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )}

                        {/* ESSAY SECTION */}
                        {activeQuestion.type === 'ESSAY' && (
                            <div className="text-center w-full max-w-3xl mx-auto">
                                {answerStatus === 'IDLE' && (
                                    <div className="flex gap-6 justify-center mt-12">
                                        <button onClick={() => handleEssayGrade(true)} className="flex items-center gap-3 px-10 py-5 bg-green-500 text-white rounded-2xl font-black text-xl hover:bg-green-600 shadow-xl hover:scale-105 transition-all">
                                            <Check size={28}/> TRẢ LỜI ĐÚNG
                                        </button>
                                        <button onClick={() => handleEssayGrade(false)} className="flex items-center gap-3 px-10 py-5 bg-red-500 text-white rounded-2xl font-black text-xl hover:bg-red-600 shadow-xl hover:scale-105 transition-all">
                                            <X size={28}/> TRẢ LỜI SAI
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FEEDBACK OVERLAY */}
                        {answerStatus !== 'IDLE' && (
                            <div className={`mt-8 animate-bounce-in p-6 rounded-2xl shadow-xl border-4 backdrop-blur-sm mx-auto max-w-lg ${answerStatus === 'CORRECT' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {answerStatus === 'CORRECT' ? (
                                    <div className="font-black text-4xl flex items-center justify-center gap-3">
                                        <Award size={48}/> CHÍNH XÁC!
                                    </div>
                                ) : (
                                    <div className="font-black text-4xl flex items-center justify-center gap-3">
                                        <ShieldAlert size={48}/> SAI RỒI!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {winner && (
                        <div className="mt-8 p-4 bg-gray-100 rounded-xl flex items-center gap-4">
                             <div className="text-3xl">{winner.avatar}</div>
                             <div className="font-bold text-gray-700">{winner.name} đang trả lời...</div>
                        </div>
                    )}
                </div>
            </div>
        );
     }

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
                            <button onClick={() => setCurrentView('SESSION')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                            <div className="text-8xl mb-4 animate-bounce filter drop-shadow-lg">{winner.avatar}</div>
                            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-1">{isGroupSpin ? 'Nhóm Chiến Thắng' : 'Chúc mừng'}</h2>
                            <h1 className="text-4xl font-black text-indigo-800 mb-2">{winner.name}</h1>
                            {winner.group && !isGroupSpin && <div className="mb-8 inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-200">{winner.group}</div>}
                            {isGroupSpin && <div className="mb-8 text-sm text-green-600 font-bold">Cộng điểm cho toàn bộ thành viên!</div>}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <button onClick={handleOpenQuestion} className="col-span-2 py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg hover:bg-pink-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105">
                                    <HelpCircle size={24}/>
                                    <span className="text-xl">Trả lời câu hỏi</span>
                                </button>
                                <button onClick={() => handleAddScore(plusPoints, true, 'SCORE')} className="py-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex flex-col items-center justify-center"><span className="text-xl">+{plusPoints}</span><span className="text-[10px] uppercase opacity-70">Thưởng trực tiếp</span></button>
                                <button onClick={() => handleAddScore(-minusPoints, true, 'SCORE')} className="py-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex flex-col items-center justify-center"><span className="text-xl">-{minusPoints}</span><span className="text-[10px] uppercase opacity-70">Phạt trực tiếp</span></button>
                                <button onClick={handleLuckyPointClick} className="py-4 bg-yellow-50 text-yellow-700 font-bold rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors flex flex-col items-center justify-center"><span className="text-xl">🎲 +{getLuckyRangeText()}</span><span className="text-[10px] uppercase opacity-70">May mắn</span></button>
                                <button onClick={handleAddToStage} className="py-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center"><Pin size={24} /><span className="text-[10px] uppercase opacity-70 mt-1">Mời lên bảng</span></button>
                            </div>
                             <button onClick={() => setCurrentView('SESSION')} className="w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-medium mt-2">Quay về bảng xếp hạng</button>
                        </div>
                    )}
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

      {/* CONGRATULATION MODAL */}
      {congratulationData && (
          <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4" onClick={() => setCongratulationData(null)}>
              <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center relative animate-bounce-in border-8 border-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.5)]" onClick={e => e.stopPropagation()}>
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full p-4 border-4 border-white shadow-xl">
                       <PartyPopper size={48} className="text-white"/>
                   </div>
                   <div className="mt-8">
                       <div className="text-8xl mb-4 animate-spin-slow">{congratulationData.student.avatar}</div>
                       <h2 className="text-3xl font-black text-indigo-800 mb-2">{congratulationData.student.name}</h2>
                       <div className="text-gray-500 font-bold mb-6">Đã đạt danh hiệu mới!</div>
                       
                       <div className="grid gap-4">
                           {congratulationData.badges.map(badge => (
                               <div key={badge} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center gap-4 transform hover:scale-105 transition-transform">
                                   <div className="text-4xl">{BADGE_ICONS[badge]}</div>
                                   <div className="text-left">
                                       <div className="font-bold text-yellow-800">{BADGE_INFO[badge]?.split(':')[0]}</div>
                                       <div className="text-xs text-yellow-600">{BADGE_INFO[badge]?.split(':')[1]}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                       
                       <div className="mt-8 italic text-indigo-400 font-medium">
                           "{settings.congratulationTemplate.replace('{name}', congratulationData.student.name).replace('{badge}', BADGE_INFO[congratulationData.badges[0]]?.split(':')[0])}"
                       </div>

                       <button onClick={() => setCongratulationData(null)} className="mt-8 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Tuyệt vời!</button>
                   </div>
              </div>
          </div>
      )}
      
      {/* MODALS */}
      {showVideoLib && <VideoLibrary onClose={() => setShowVideoLib(false)} />}
      {showNoiseMonitor && <NoiseMonitor onClose={() => setShowNoiseMonitor(false)} />}

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

                  <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                      <button 
                        className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'GENERAL' ? 'bg-white shadow' : 'text-gray-500'}`}
                        onClick={() => setSettingsTab('GENERAL')}
                      >
                          Chung
                      </button>
                      <button 
                        className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'THRESHOLDS' ? 'bg-white shadow' : 'text-gray-500'}`}
                        onClick={() => setSettingsTab('THRESHOLDS')}
                      >
                          Cấu hình Mốc Điểm
                      </button>
                  </div>
                  
                  {settingsTab === 'GENERAL' && (
                    <div className="space-y-4">
                         <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Mẫu Chúc Mừng</h4>
                            <p className="text-[10px] text-gray-400">Sử dụng: {'{name}'} = Tên HS, {'{badge}'} = Tên danh hiệu</p>
                            <input 
                                className="w-full border rounded p-2 text-sm" 
                                value={settings.congratulationTemplate}
                                onChange={e => updateSettings({congratulationTemplate: e.target.value})}
                                placeholder="VD: Chúc mừng {name} đạt {badge}!"
                            />
                        </div>

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

                            <h5 className="text-xs font-bold text-purple-500">Điểm May Mắn Nhóm</h5>
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
                  )}

                  {settingsTab === 'THRESHOLDS' && (
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                  <Lock size={12}/> Điểm Mở Khóa Game (Tổng XP Lớp)
                              </h4>
                              <div className="space-y-2 bg-gray-50 p-2 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                                  {Object.values(PresentationMode).filter(m => m !== PresentationMode.SIMPLE).map((mode) => (
                                      <div key={mode} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                                          <span className="font-medium text-gray-700">{mode}</span>
                                          <input 
                                              type="number" 
                                              className="w-20 text-right border rounded px-1 py-0.5 text-xs font-bold text-gray-600"
                                              value={settings.gameUnlockThresholds?.[mode] || 0}
                                              onChange={(e) => {
                                                  const val = parseInt(e.target.value);
                                                  updateSettings({
                                                      gameUnlockThresholds: {
                                                          ...settings.gameUnlockThresholds,
                                                          [mode]: val
                                                      }
                                                  });
                                              }}
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Mốc Danh Hiệu & Điều Kiện</h4>
                              <div className="space-y-2 bg-gray-50 p-2 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                                  {Object.keys(BADGE_INFO).map((key) => {
                                      const isScoreBased = SCORE_BASED_BADGES.includes(key);
                                      return (
                                          <div key={key} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                                              <div className="flex flex-col gap-0.5">
                                                  <div className="flex items-center gap-2">
                                                      <span>{BADGE_ICONS[key]}</span>
                                                      <span className="font-medium text-gray-700 text-xs">{BADGE_INFO[key]?.split(':')[0] || key}</span>
                                                  </div>
                                                  <span className="text-[10px] text-gray-400 italic pl-6">{BADGE_INFO[key]?.split(':')[1]}</span>
                                              </div>
                                              
                                              {isScoreBased ? (
                                                  <input 
                                                      type="number" 
                                                      className="w-16 text-right border rounded px-1 py-0.5 text-xs font-bold text-gray-600"
                                                      value={settings.achievementThresholds[key] || 0}
                                                      onChange={(e) => {
                                                          const val = parseInt(e.target.value);
                                                          updateSettings({
                                                              achievementThresholds: {
                                                                  ...settings.achievementThresholds,
                                                                  [key]: val
                                                              }
                                                          });
                                                      }}
                                                  />
                                              ) : (
                                                  <div className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">Sự kiện</div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  )}

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
                      <button onClick={() => setShowChangelog(true)} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200 hover:bg-indigo-200">v2.4</button>
                  </div>
                  
                  <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => setShowNoiseMonitor(true)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Đo tiếng ồn">
                          <Mic size={20} />
                      </button>
                      <button onClick={() => setShowVideoLib(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Thư viện Video">
                          <Youtube size={20} />
                      </button>
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