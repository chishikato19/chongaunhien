import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Play, BarChart2, Settings as SettingsIcon, Home, UserCheck, ShieldAlert, Award, RefreshCw, X, Grid2X2, Timer, Volume2, Trophy, LogOut, ChevronDown, ChevronUp, Users, Hand, Download, Upload, Database, Maximize, Minimize, Clock, PlayCircle, PauseCircle, RotateCcw, HelpCircle, BookOpen, CheckCircle, XCircle, FileClock, Tag, Info, GitBranch, Gamepad2 } from 'lucide-react';
import * as Storage from './services/storage.service';
import { ClassGroup, Student, PresentationMode, SelectionLogic, Settings as GameSettings, Question } from './types';
import ClassManager from './components/ClassManager';
import QuestionManager from './components/QuestionManager'; 
import { VisualizationContainer } from './components/Visualizers';
import { playTick, playWin } from './services/sound';

// --- Helper Functions ---
const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleTimeString() : 'Chưa gọi';

// --- HELP CONTENT DATA ---
const HELP_CONTENT = [
    {
        id: 'GENERAL',
        title: '🌟 Tổng Quan',
        icon: <Info size={18}/>,
        content: (
            <div className="space-y-4">
                <p>Chào mừng bạn đến với <b>ClassRandomizer</b> - Ứng dụng hỗ trợ giảng dạy tích hợp gamification (trò chơi hóa).</p>
                <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                    <h4 className="font-bold text-indigo-700 mb-2">Tính năng nổi bật:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        <li><b>Chọn ngẫu nhiên công bằng:</b> Hệ thống ghi nhớ ai đã được gọi để ưu tiên người chưa được gọi.</li>
                        <li><b>Đa dạng chế độ hiển thị:</b> Đua xe, Vòng quay, Lật thẻ, Gắp thú, Trứng nở...</li>
                        <li><b>Quản lý Lớp & Điểm số:</b> Lưu trữ danh sách lớp, tính điểm cá nhân và điểm nhóm.</li>
                        <li><b>Ngân hàng Câu hỏi:</b> Tích hợp câu hỏi trắc nghiệm/tự luận ngay sau khi chọn học sinh.</li>
                    </ul>
                </div>
                <p>Dữ liệu được lưu trực tiếp trên trình duyệt của bạn (Local Storage), không cần đăng nhập, không sợ mất mạng.</p>
            </div>
        )
    },
    {
        id: 'CLASS',
        title: '📚 Quản Lý Lớp Học',
        icon: <Users size={18}/>,
        content: (
            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">1. Tạo lớp & Nhập học sinh</h3>
                <p className="text-sm">Bạn có thể nhập thủ công từng người hoặc nhập hàng loạt từ Excel/Word.</p>
                
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono border border-gray-300">
                    <p className="font-bold text-gray-500 mb-1">// Cú pháp nhập nhanh (Copy/Paste):</p>
                    <p>Nguyễn Văn A</p>
                    <p>Trần Thị B (Nữ)</p>
                    <p>Lê Văn C (F)</p>
                </div>
                <p className="text-xs text-gray-500">* Thêm chữ <b>(Nữ)</b> hoặc <b>(F)</b> để hệ thống tự nhận diện giới tính và gán Avatar phù hợp.</p>

                <h3 className="font-bold text-lg border-b pb-2 mt-4">2. Chia Nhóm</h3>
                <p className="text-sm">Sử dụng tính năng <b>"Chia Ngẫu Nhiên"</b> để tự động chia lớp thành các nhóm (Nhóm 1, Nhóm 2...).</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Nhập số lượng nhóm muốn chia.</li>
                    <li>Nhấn nút chia, hệ thống sẽ xáo trộn và gán nhóm cho từng học sinh.</li>
                    <li>Điểm số của nhóm sẽ được tính tổng từ các thành viên.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'QUESTION',
        title: '❓ Ngân Hàng Câu Hỏi',
        icon: <HelpCircle size={18}/>,
        content: (
            <div className="space-y-4">
                <p className="text-sm">Chuyển sang tab <b>"Câu Hỏi"</b> ở màn hình chính để quản lý.</p>

                <h3 className="font-bold text-lg border-b pb-2">Cách nhập từ Word</h3>
                <p className="text-sm">Copy toàn bộ câu hỏi từ file Word và dán vào ô nhập liệu. Hệ thống hỗ trợ định dạng sau:</p>
                
                <div className="bg-yellow-50 p-3 rounded-md text-sm border border-yellow-200">
                    <p><b>Câu 1:</b> Thủ đô của Việt Nam là gì?</p>
                    <p>A. Đà Nẵng</p>
                    <p>B. Hà Nội</p>
                    <p>C. TP.HCM</p>
                    <p>D. Cần Thơ</p>
                    <p className="font-bold text-green-700">Đáp án: B</p>
                    <br/>
                    <p><b>Câu 2:</b> Kể tên 3 loại quả?</p>
                    <p className="italic text-gray-500">(Không có đáp án A/B/C/D sẽ tự hiểu là Tự luận)</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mt-2">
                    <p><b>Lưu ý:</b></p>
                    <ul className="list-disc pl-4">
                        <li>Từ khóa nhận diện: <b>"Câu X:", "Bài X:", "Question X:"</b></li>
                        <li>Từ khóa đáp án: <b>"Đáp án:", "Answer:", "Result:"</b></li>
                        <li>Câu hỏi đã trả lời đúng sẽ không xuất hiện lại (trừ khi bạn nhấn Reset).</li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'GAMES',
        title: '🎮 Các Chế Độ Chơi',
        icon: <PlayCircle size={18}/>,
        content: (
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-3 rounded-lg">
                        <div className="font-bold text-indigo-600">🏎️ Đua Xe (Race)</div>
                        <p>Các học sinh biến thành tay đua. Tốc độ ngẫu nhiên nhưng người được chọn sẽ luôn bứt tốc về đích.</p>
                    </div>
                    <div className="border p-3 rounded-lg">
                        <div className="font-bold text-pink-600">🥚 Trứng Nở</div>
                        <p>Chú cò bay qua thả một quả trứng, quả trứng lắc lư và nở ra học sinh may mắn.</p>
                    </div>
                    <div className="border p-3 rounded-lg">
                        <div className="font-bold text-green-600">🏗️ Gắp Thú</div>
                        <p>Mô phỏng máy gắp thú. Cần trục sẽ di chuyển và gắp lên quả cầu chứa học sinh.</p>
                    </div>
                    <div className="border p-3 rounded-lg">
                        <div className="font-bold text-blue-600">🎩 5 Lá Bài</div>
                        <p>Giáo viên tráo bài và mời học sinh chọn 1 lá bất kỳ để lật mở kết quả.</p>
                    </div>
                     <div className="border p-3 rounded-lg">
                        <div className="font-bold text-purple-600">🧱 Loại Trừ</div>
                        <p>Hiển thị lưới học sinh, các ô tối dần cực nhanh cho đến khi còn lại 1 người.</p>
                    </div>
                    <div className="border p-3 rounded-lg">
                        <div className="font-bold text-orange-600">🔢 Quay Số</div>
                        <p>Hiển thị 2 guồng quay số (Hàng chục - Hàng đơn vị) tương ứng với số thứ tự học sinh.</p>
                    </div>
                </div>
                <p className="italic text-gray-500 mt-2">* Bạn có thể chọn chế độ cụ thể hoặc để "Ngẫu nhiên" để tạo bất ngờ.</p>
            </div>
        )
    },
    {
        id: 'SCORING',
        title: '🏆 Điểm & Cài Đặt',
        icon: <Award size={18}/>,
        content: (
            <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg border-b pb-2">Hệ thống điểm</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><b>Điểm cộng/trừ:</b> Cài đặt trong mục Bánh răng <SettingsIcon size={12} className="inline"/>.</li>
                    <li><b>Điểm may mắn:</b> Một con số ngẫu nhiên trong khoảng (Min - Max) do bạn cài đặt.</li>
                    <li><b>Điểm nhóm:</b> Khi quay trúng "Nhóm", điểm sẽ được cộng cho TOÀN BỘ thành viên trong nhóm đó.</li>
                </ul>

                <h3 className="font-bold text-lg border-b pb-2 mt-4">Sao lưu dữ liệu</h3>
                <p>Để tránh mất dữ liệu khi đổi máy tính hoặc xóa cache trình duyệt:</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Vào màn hình chính.</li>
                    <li>Nhấn nút <b>"Sao lưu (JSON)"</b> để tải file về máy.</li>
                    <li>Khi sang máy khác, nhấn <b>"Khôi phục"</b> và chọn file đó.</li>
                </ol>
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClasses(Storage.getClasses());
    setQuestions(Storage.getQuestions()); 
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
          alert("Lớp học trống! Vui lòng chọn lớp có học sinh.");
          return;
      }
      setSessionPoints(0);
      setSessionPicks(0);
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

    if (eligiblePool.length === 0) eligiblePool = activeClass.students;

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
        alert("Chưa có nhóm nào được tạo!");
        return;
    }

    setShowResultOverlay(false);
    setScoreAnimation({value: 0, visible: false});
    setWinner(null);
    setIsGroupSpin(true); 

    const groupLastPicked: {[key: string]: number} = {};
    uniqueGroupNames.forEach(gName => {
        const studentsInGroup = activeClass.students.filter(s => s.group === gName);
        const latestPick = Math.max(...studentsInGroup.map(s => s.lastPickedDate || 0));
        groupLastPicked[gName as string] = latestPick;
    });

    const sortedGroups = uniqueGroupNames.sort((a, b) => groupLastPicked[a as string] - groupLastPicked[b as string]);
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

  // --- QUESTION LOGIC ---
  const handleOpenQuestion = () => {
      // Filter out already answered questions
      const availableQuestions = questions.filter(q => !q.isAnswered);
      
      if (availableQuestions.length === 0) {
          if (questions.length === 0) {
              alert("Chưa có câu hỏi nào! Hãy vào phần Cài đặt -> Ngân hàng câu hỏi để thêm.");
          } else {
              alert("Tất cả câu hỏi đã được trả lời! Hãy vào Ngân hàng câu hỏi để Reset.");
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
          // Wait 1.5s then close Question Modal, REVEALING the Game Overlay to add points
          setTimeout(() => {
               setShowQuestionModal(false); 
          }, 1500);
      } else {
          setAnswerStatus('WRONG');
          playTick();
          // Wait 1.5s then close Question Modal, REVEALING the Game Overlay to deduct points
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
        alert("Chưa chọn lớp để reset!");
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

              alert("Nhập dữ liệu thành công!");
          } catch (error) {
              console.error(error);
              alert("Lỗi khi nhập file: File không đúng định dạng hoặc bị hỏng.");
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
      handleAddScore(points, false); // Keep overlay open
  };

  // --- Render ---

  if (currentView === 'SETUP') {
    return (
      <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3">
               <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                   <Gamepad2 size={32} />
               </div>
               <div>
                   <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">
                       ClassRandomizer <span className="text-indigo-600">Pro</span>
                   </h1>
                   <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-medium">Hệ thống chọn ngẫu nhiên & Gamification</p>
                        <span 
                            onClick={() => setShowChangelog(true)}
                            className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-indigo-200 transition-colors flex items-center gap-1"
                        >
                            v1.3 <GitBranch size={10}/>
                        </span>
                   </div>
               </div>
           </div>
           
           <div className="flex gap-2">
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
               <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm" title="Nhập dữ liệu">
                   <Upload size={18}/> <span className="hidden sm:inline">Khôi phục</span>
               </button>
               <button onClick={handleExportData} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm" title="Xuất dữ liệu">
                   <Download size={18}/> <span className="hidden sm:inline">Sao lưu (JSON)</span>
               </button>
               <button onClick={() => setShowHelp(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2" title="Hướng dẫn sử dụng">
                   <BookOpen size={20}/>
               </button>
               <button 
                  onClick={startSession}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
               >
                  <Play size={20} fill="currentColor" /> Bắt Đầu Buổi Học
               </button>
           </div>
        </header>

        {/* Setup Navigation Tabs */}
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setSetupTab('CLASSES')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${setupTab === 'CLASSES' ? 'bg-white shadow-md text-indigo-600 border-b-4 border-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
                <Users size={20}/> Quản Lý Lớp Học
            </button>
            <button 
                onClick={() => setSetupTab('QUESTIONS')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${setupTab === 'QUESTIONS' ? 'bg-white shadow-md text-pink-600 border-b-4 border-pink-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
                <HelpCircle size={20}/> Ngân Hàng Câu Hỏi
            </button>
        </div>

        {/* Content Area */}
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

        {/* Help Modal */}
        {showHelp && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl">
                    {/* Sidebar */}
                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                            <BookOpen className="text-indigo-600"/> Hướng Dẫn
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-1">
                            {HELP_CONTENT.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveHelpTab(idx)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeHelpTab === idx ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {item.icon} {item.title}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Content */}
                    <div className="w-2/3 flex flex-col">
                         <div className="flex justify-between items-center p-4 border-b border-gray-200">
                             <h3 className="font-bold text-xl text-gray-800">{HELP_CONTENT[activeHelpTab].title}</h3>
                             <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-red-500">
                                 <X size={24}/>
                             </button>
                         </div>
                         <div className="flex-grow overflow-y-auto p-6 text-gray-700 leading-relaxed">
                             {HELP_CONTENT[activeHelpTab].content}
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Changelog Modal */}
        {showChangelog && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <GitBranch className="text-indigo-600"/> Lịch sử Cập nhật
                        </h3>
                        <button onClick={() => setShowChangelog(false)} className="bg-gray-100 p-1 rounded-full hover:bg-gray-200">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                        {Storage.getChangelog().map((log, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-gray-200">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-gray-800">Phiên bản {log.version}</span>
                                    <span className="text-xs text-gray-400">{log.date}</span>
                                </div>
                                <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                                    {log.changes.map((change, cIdx) => (
                                        <li key={cIdx}>{change}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- Header for Session/Game ---
  const Header = () => (
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
          <div className="pointer-events-auto flex gap-2">
              <button onClick={() => setCurrentView('SETUP')} className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm hover:bg-gray-100 text-gray-700 flex items-center gap-2 font-bold text-sm">
                  <Home size={18}/> <span className="hidden sm:inline">Trang Chủ</span>
              </button>
              <button 
                onClick={toggleFullScreen} 
                className={`bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm hover:bg-gray-100 text-gray-700 ${isFullScreen ? 'text-indigo-600' : ''}`}
                title="Toàn màn hình"
              >
                  {isFullScreen ? <Minimize size={18}/> : <Maximize size={18}/>}
              </button>
              <button 
                  onClick={() => setShowTimerModal(!showTimerModal)}
                  className={`bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm hover:bg-gray-100 flex items-center gap-2 ${isTimerRunning ? 'text-red-600 animate-pulse font-bold' : 'text-gray-700'}`}
              >
                  <Clock size={18}/> {isTimerRunning ? <span>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span> : <span className="hidden sm:inline">Hẹn giờ</span>}
              </button>
          </div>

          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg font-bold text-indigo-900 text-sm md:text-lg border-2 border-indigo-100">
              {activeClass?.name || 'Lớp học'}
          </div>

          <div className="pointer-events-auto flex gap-2">
              <button onClick={resetData} className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm hover:bg-red-50 text-red-600" title="Reset điểm">
                  <RefreshCw size={18}/>
              </button>
              <button onClick={() => setShowSettings(true)} className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm hover:bg-gray-100 text-gray-700">
                  <SettingsIcon size={18}/>
              </button>
              <button onClick={triggerEndSession} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-red-600 text-sm">
                  Kết Thúc
              </button>
          </div>
      </div>
  );

  // --- GAME VIEW ---
  if (currentView === 'GAME') {
      return (
          <div className="relative w-screen h-screen overflow-hidden bg-gray-50 flex flex-col">
              <Header />

              {/* Visualization */}
              <div className="flex-grow w-full h-full">
                  {winner && (
                      <VisualizationContainer 
                        candidates={roundCandidates} 
                        winner={winner} 
                        mode={gameMode} 
                        duration={gameMode === PresentationMode.RACE ? settings.raceDuration : settings.spinDuration}
                        onComplete={handleGameComplete}
                      />
                  )}
              </div>

              {/* Result Overlay (Score & Actions) */}
              {showResultOverlay && winner && (
                  <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-lg w-full text-center relative animate-in zoom-in duration-300">
                           <button 
                                onClick={() => setCurrentView('SESSION')} 
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                               <X size={24}/>
                           </button>

                           <div className="text-8xl mb-4 animate-bounce">{winner.avatar}</div>
                           <h2 className="text-4xl md:text-5xl font-black text-indigo-700 mb-2">{winner.name}</h2>
                           {isGroupSpin && <div className="text-gray-500 font-bold uppercase tracking-widest mb-6">{winner.group}</div>}
                           
                           {/* Score Feedback Animation */}
                           {scoreAnimation.visible && (
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                                   <div className={`text-9xl font-black drop-shadow-2xl animate-out fade-out slide-out-to-top duration-1000 ${scoreAnimation.value > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                       {scoreAnimation.value > 0 ? '+' : ''}{scoreAnimation.value}
                                   </div>
                               </div>
                           )}

                           <div className="grid grid-cols-2 gap-4 mb-4">
                               <button 
                                    onClick={() => handleAddScore(isGroupSpin ? settings.groupPoints : settings.maxPoints, false)}
                                    className="bg-green-100 text-green-700 py-4 rounded-xl font-black text-xl hover:bg-green-200 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <span className="text-sm font-normal">Chính xác</span>
                                    +{isGroupSpin ? settings.groupPoints : settings.maxPoints}
                               </button>
                               <button 
                                    onClick={() => handleAddScore(-(isGroupSpin ? settings.groupMinusPoints : settings.minusPoints), false)} 
                                    className="bg-red-100 text-red-700 py-4 rounded-xl font-black text-xl hover:bg-red-200 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <span className="text-sm font-normal">Sai rồi</span>
                                    -{isGroupSpin ? settings.groupMinusPoints : settings.minusPoints}
                               </button>
                           </div>

                           <div className="flex gap-2">
                               <button 
                                    onClick={handleLuckyPointClick}
                                    className="flex-1 bg-yellow-400 text-yellow-900 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-200"
                                >
                                   🍀 May Mắn ({getLuckyRangeText()})
                               </button>
                                <button 
                                    onClick={handleOpenQuestion}
                                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                   <HelpCircle size={20}/> Trả Lời Câu Hỏi
                               </button>
                           </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- SESSION DASHBOARD ---
  if (currentView === 'SESSION') {
      const sortedStudents = [...(activeClass?.students || [])].sort((a, b) => b.score - a.score);
      const groups = activeClass ? [...new Set(activeClass.students.map(s => s.group).filter(g => g))] : [];
      
      const groupScores = groups.map(g => {
          const members = activeClass!.students.filter(s => s.group === g);
          const total = members.reduce((sum, s) => sum + s.score, 0);
          return { name: g, total, members };
      }).sort((a, b) => b.total - a.total);

      return (
          <div className="min-h-screen bg-gray-100 flex flex-col p-4 md:p-6 relative">
              <Header />
              
              <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full flex-grow min-h-0">
                  {/* Left: Leaderboards */}
                  <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                       {/* Groups Leaderboard */}
                       {groups.length > 0 && (
                           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex-shrink-0 max-h-[40vh] overflow-hidden flex flex-col">
                               <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                   <Trophy className="text-yellow-500" /> Bảng Xếp Hạng Nhóm
                               </h3>
                               <div className="overflow-y-auto pr-2 flex-grow custom-scrollbar">
                                   {groupScores.map((g, idx) => (
                                       <div key={g.name} className="mb-3">
                                            <div 
                                                onClick={() => setExpandedGroup(expandedGroup === g.name ? null : g.name)}
                                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${idx === 0 ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100 hover:border-indigo-200'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-bold text-gray-800">{g.name}</span>
                                                    <span className="text-xs text-gray-500">({g.members.length} tv)</span>
                                                </div>
                                                <div className="font-black text-2xl text-indigo-600">{g.total}</div>
                                            </div>
                                            
                                            {/* Expanded Group Details */}
                                            {expandedGroup === g.name && (
                                                <div className="mt-2 ml-12 bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                                    {g.members.map(m => (
                                                        <div key={m.id} className="flex justify-between text-gray-600">
                                                            <span>{m.name}</span>
                                                            <span className="font-bold">{m.score}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* Individual Leaderboard */}
                       <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex-grow flex flex-col min-h-0">
                           <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                               <UserCheck className="text-blue-500" /> Bảng Xếp Hạng Cá Nhân
                           </h3>
                           <div className="overflow-y-auto pr-2 flex-grow custom-scrollbar">
                               <table className="w-full text-left border-collapse">
                                   <thead className="sticky top-0 bg-white z-10 text-xs font-bold text-gray-400 uppercase tracking-wider border-b">
                                       <tr>
                                           <th className="py-2">Hạng</th>
                                           <th className="py-2">Học Sinh</th>
                                           <th className="py-2 text-right">Điểm</th>
                                       </tr>
                                   </thead>
                                   <tbody className="text-sm">
                                       {sortedStudents.map((s, idx) => (
                                           <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/50 transition-colors">
                                               <td className="py-3 font-bold text-gray-400 pl-2">{idx + 1}</td>
                                               <td className="py-3 font-bold text-gray-800 flex items-center gap-2">
                                                   <span className="text-xl">{s.avatar}</span> {s.name}
                                               </td>
                                               <td className="py-3 text-right font-black text-indigo-600 text-lg">{s.score}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex flex-col gap-4">
                      {/* Main Actions */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex-grow flex flex-col justify-center gap-4">
                           {/* Logic Toggles */}
                           <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                               <span className="text-xs font-bold text-gray-600 pl-2">Chế độ Nhóm:</span>
                               <button 
                                  onClick={() => setGroupModeEnabled(!groupModeEnabled)}
                                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${groupModeEnabled ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-500'}`}
                               >
                                   {groupModeEnabled ? 'BẬT' : 'TẮT'}
                               </button>
                           </div>

                           <div className="flex gap-2">
                               <div className="flex-grow">
                                   <label className="text-xs font-bold text-gray-400 block mb-1">Chế độ hiển thị</label>
                                   <div className="relative">
                                       <select 
                                            value={preferredMode} 
                                            onChange={(e) => setPreferredMode(e.target.value as any)}
                                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                       >
                                           <option value="RANDOM">🎲 Ngẫu Nhiên</option>
                                           <option value={PresentationMode.RACE}>🏎️ Đua Xe</option>
                                           <option value={PresentationMode.WHEEL}>🎡 Vòng Quay</option>
                                           <option value={PresentationMode.EGG_HATCH}>🥚 Trứng Nở</option>
                                           <option value={PresentationMode.CLAW_MACHINE}>🏗️ Gắp Thú</option>
                                           <option value={PresentationMode.LUCKY_CARDS}>🃏 5 Lá Bài</option>
                                           <option value={PresentationMode.GRID_ELIMINATION}>🧱 Loại Trừ</option>
                                           <option value={PresentationMode.DICE}>🔢 Quay Số</option>
                                           <option value={PresentationMode.SPOTLIGHT}>🔦 Tiêu Điểm</option>
                                           <option value={PresentationMode.FLIP}>🎴 Lật Thẻ</option>
                                           <option value={PresentationMode.GALAXY}>🌌 Vũ Trụ</option>
                                           <option value={PresentationMode.SLOT}>🎰 Slot Machine</option>
                                           <option value={PresentationMode.BOX}>🎁 Hộp Quà</option>
                                           <option value={PresentationMode.SIMPLE}>⚡ Đơn Giản</option>
                                       </select>
                                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                   </div>
                               </div>
                           </div>
                           
                           <button 
                                onClick={startRandomizer}
                                className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                           >
                               <PlayCircle size={32} />
                               CHỌN NGẪU NHIÊN
                           </button>

                           <div className="grid grid-cols-2 gap-3">
                               <button 
                                   onClick={startGroupRandomizer}
                                   className="py-3 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                               >
                                   <Grid2X2 size={18}/> Quay Nhóm
                               </button>
                               <button 
                                   onClick={() => setShowManualPick(true)}
                                   className="py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                               >
                                   <Hand size={18}/> Gọi Chỉ Định
                               </button>
                           </div>
                      </div>
                      
                      {/* Session Stats */}
                      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                          <h3 className="opacity-80 font-bold text-sm uppercase mb-1">Tổng quan buổi học</h3>
                          <div className="flex justify-between items-end">
                              <div>
                                  <div className="text-4xl font-black">{sessionPoints}</div>
                                  <div className="text-xs opacity-70">Điểm đã cộng</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-4xl font-black">{sessionPicks}</div>
                                  <div className="text-xs opacity-70">Lượt gọi</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- SUMMARY VIEW ---
  if (currentView === 'SUMMARY') {
      const sortedStudents = [...(activeClass?.students || [])].sort((a, b) => b.score - a.score);
      const top3 = sortedStudents.slice(0, 3);
      
      return (
          <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
               {/* Background Effects */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               
               <div className="relative z-10 max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-2 uppercase tracking-wide">Tổng Kết Buổi Học</h2>
                    <p className="text-gray-500 font-medium mb-10 text-lg">Lớp: {activeClass?.name}</p>
                    
                    {/* Podium */}
                    <div className="flex justify-center items-end gap-4 mb-12 h-64">
                        {/* 2nd Place */}
                        {top3[1] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-100">
                                <div className="text-6xl mb-2 drop-shadow-lg">{top3[1].avatar}</div>
                                <div className="font-bold text-gray-600 mb-1">{top3[1].name}</div>
                                <div className="w-24 h-32 bg-gray-300 rounded-t-xl flex items-center justify-center text-3xl font-black text-white shadow-lg relative">
                                    2
                                    <div className="absolute top-2 right-2 text-xs bg-black/20 px-2 py-0.5 rounded text-white">{top3[1].score}đ</div>
                                </div>
                            </div>
                        )}
                        {/* 1st Place */}
                        {top3[0] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700">
                                <div className="text-8xl mb-2 drop-shadow-xl animate-bounce">{top3[0].avatar}</div>
                                <div className="font-bold text-indigo-700 text-xl mb-1">{top3[0].name}</div>
                                <div className="w-32 h-48 bg-yellow-400 rounded-t-xl flex items-center justify-center text-5xl font-black text-yellow-800 shadow-xl relative z-10">
                                    1 👑
                                    <div className="absolute top-2 right-2 text-sm bg-black/20 px-2 py-0.5 rounded text-white font-bold">{top3[0].score}đ</div>
                                </div>
                            </div>
                        )}
                        {/* 3rd Place */}
                        {top3[2] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-200">
                                <div className="text-6xl mb-2 drop-shadow-lg">{top3[2].avatar}</div>
                                <div className="font-bold text-gray-600 mb-1">{top3[2].name}</div>
                                <div className="w-24 h-24 bg-orange-300 rounded-t-xl flex items-center justify-center text-3xl font-black text-white shadow-lg relative">
                                    3
                                    <div className="absolute top-2 right-2 text-xs bg-black/20 px-2 py-0.5 rounded text-white">{top3[2].score}đ</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setCurrentView('SETUP')}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                            <Home size={20} /> Về Trang Chủ
                        </button>
                        <button 
                            onClick={() => {
                                setSessionPoints(0);
                                setSessionPicks(0);
                                setCurrentView('SESSION');
                            }}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={20} /> Buổi Học Mới
                        </button>
                    </div>
               </div>
          </div>
      )
  }

  // --- MODALS ---

  // 1. Settings Modal
  const SettingsModal = () => (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="text-gray-500"/> Cài Đặt</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Standard Scoring */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase">Cá Nhân</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-green-600">Điểm Cộng (+)</label>
                              <input type="number" className="w-full border p-2 rounded mt-1" value={settings.maxPoints} onChange={e => updateSettings({maxPoints: parseInt(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-red-600">Điểm Trừ (-)</label>
                              <input type="number" className="w-full border p-2 rounded mt-1" value={settings.minusPoints} onChange={e => updateSettings({minusPoints: parseInt(e.target.value)})} />
                          </div>
                      </div>
                  </div>

                  {/* Group Scoring */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase">Nhóm</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-green-600">Điểm Cộng (+)</label>
                              <input type="number" className="w-full border p-2 rounded mt-1" value={settings.groupPoints} onChange={e => updateSettings({groupPoints: parseInt(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-red-600">Điểm Trừ (-)</label>
                              <input type="number" className="w-full border p-2 rounded mt-1" value={settings.groupMinusPoints} onChange={e => updateSettings({groupMinusPoints: parseInt(e.target.value)})} />
                          </div>
                      </div>
                  </div>

                  {/* Lucky Range Individual */}
                  <div>
                      <label className="block text-sm font-medium mb-1">Khoảng điểm may mắn (Cá nhân)</label>
                      <div className="flex gap-2 items-center">
                          <input type="number" className="w-full border p-2 rounded" value={settings.minLuckyPoints} onChange={e => updateSettings({minLuckyPoints: parseInt(e.target.value)})} />
                          <span>-</span>
                          <input type="number" className="w-full border p-2 rounded" value={settings.maxLuckyPoints} onChange={e => updateSettings({maxLuckyPoints: parseInt(e.target.value)})} />
                      </div>
                  </div>

                  {/* Lucky Range Group */}
                  <div>
                      <label className="block text-sm font-medium mb-1">Khoảng điểm may mắn (Nhóm)</label>
                      <div className="flex gap-2 items-center">
                          <input type="number" className="w-full border p-2 rounded" value={settings.minGroupLuckyPoints} onChange={e => updateSettings({minGroupLuckyPoints: parseInt(e.target.value)})} />
                          <span>-</span>
                          <input type="number" className="w-full border p-2 rounded" value={settings.maxGroupLuckyPoints} onChange={e => updateSettings({maxGroupLuckyPoints: parseInt(e.target.value)})} />
                      </div>
                  </div>

                  {/* Durations */}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Thời gian Quay (s)</label>
                          <input type="number" className="w-full border p-2 rounded" value={settings.spinDuration} onChange={e => updateSettings({spinDuration: parseInt(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Thời gian Đua (s)</label>
                          <input type="number" className="w-full border p-2 rounded" value={settings.raceDuration} onChange={e => updateSettings({raceDuration: parseInt(e.target.value)})} />
                      </div>
                  </div>

                  <div className="flex items-center gap-2">
                      <input type="checkbox" id="allowRepeats" checked={settings.allowRepeats} onChange={e => updateSettings({allowRepeats: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                      <label htmlFor="allowRepeats" className="text-sm">Cho phép gọi lại người vừa được chọn (Trừ chế độ 'Không lặp lại')</label>
                  </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                  <button onClick={() => setShowSettings(false)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">Đã xong</button>
              </div>
          </div>
      </div>
  );

  // 2. Manual Pick Modal
  const ManualPickModal = () => {
      const filteredStudents = activeClass?.students.filter(s => s.name.toLowerCase().includes(manualSearch.toLowerCase())) || [];
      const groups = [...new Set(activeClass?.students.map(s => s.group).filter(g => g))] as string[]; // Explicitly cast to string[]
      const filteredGroups = groups.filter(g => g.toLowerCase().includes(manualSearch.toLowerCase()));

      return (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Hand className="text-indigo-600"/> Gọi Chỉ Định</h3>
                      <button onClick={() => setShowManualPick(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>

                  <input 
                    autoFocus
                    placeholder="Tìm tên học sinh hoặc nhóm..." 
                    className="w-full border p-3 rounded-xl mb-4 text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={manualSearch}
                    onChange={e => setManualSearch(e.target.value)}
                  />

                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                      {filteredGroups.length > 0 && (
                          <div className="mb-4">
                              <h4 className="font-bold text-gray-500 text-sm mb-2 uppercase">Nhóm</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {filteredGroups.map(g => (
                                      <button 
                                        key={g} 
                                        onClick={() => handleManualPick({name: g, isGroup: true})}
                                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 p-3 rounded-xl font-bold text-left transition-colors flex items-center gap-2"
                                      >
                                          <Users size={16}/> {g}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <h4 className="font-bold text-gray-500 text-sm mb-2 uppercase">Học sinh</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {filteredStudents.map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => handleManualPick(s)}
                                className="bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 p-2 rounded-xl text-left transition-all flex items-center gap-3"
                              >
                                  <span className="text-2xl">{s.avatar}</span>
                                  <span className="font-medium text-gray-700 truncate">{s.name}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  // 3. Confirm End Session Modal
  const ConfirmEndModal = () => (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut size={32}/>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Kết thúc buổi học?</h3>
              <p className="text-gray-500 mb-6">Dữ liệu điểm số sẽ được tổng kết. Bạn có thể bắt đầu lại buổi mới sau đó.</p>
              <div className="flex gap-3">
                  <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Hủy</button>
                  <button onClick={confirmEndSession} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200">Kết thúc</button>
              </div>
          </div>
      </div>
  );

  // 4. Timer Modal
  const GameTimer = () => (
      <div className={`fixed z-[60] bg-white shadow-2xl transition-all duration-300 flex flex-col items-center justify-center
          ${isTimerFullScreen ? 'inset-0' : 'top-20 right-4 w-64 rounded-2xl p-4 border-2 border-indigo-100'}
          ${!showTimerModal && !isTimerFullScreen ? 'translate-x-[200%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}
      `}>
          {!isTimerFullScreen && (
            <div className="w-full flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><Clock size={16}/> Hẹn giờ</h4>
                <div className="flex gap-1">
                    <button onClick={() => setIsTimerFullScreen(true)} className="text-gray-400 hover:text-indigo-600"><Maximize size={16}/></button>
                    <button onClick={() => setShowTimerModal(false)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                </div>
            </div>
          )}

          <div className={`font-mono font-black text-gray-800 mb-4 tabular-nums ${isTimerFullScreen ? 'text-[15vw]' : 'text-5xl'}`}>
              {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
          </div>

          {!isTimerRunning ? (
              <div className={`w-full ${isTimerFullScreen ? 'max-w-md' : ''}`}>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                      {[1,2,3,5].map(m => (
                          <button key={m} onClick={() => { setTimeLeft(m*60); setTimerDuration(m*60); }} className="bg-gray-100 hover:bg-indigo-100 text-gray-600 font-bold py-1 rounded text-sm transition-colors">{m}p</button>
                      ))}
                  </div>
                  <input 
                    type="range" min="10" max="600" step="10" 
                    value={timeLeft} 
                    onChange={e => { setTimeLeft(Number(e.target.value)); setTimerDuration(Number(e.target.value)); }}
                    className="w-full accent-indigo-600 mb-4 cursor-pointer"
                  />
                  <button onClick={() => setIsTimerRunning(true)} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 shadow-lg">Bắt đầu</button>
              </div>
          ) : (
              <div className="flex gap-4 w-full justify-center">
                  <button onClick={() => setIsTimerRunning(false)} className={`bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 ${isTimerFullScreen ? 'px-8 py-4 text-2xl' : 'flex-1 py-2'}`}>
                      <PauseCircle size={isTimerFullScreen?32:20}/> Tạm dừng
                  </button>
                  <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerDuration); }} className={`bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 ${isTimerFullScreen ? 'px-8 py-4 text-2xl' : 'flex-1 py-2'}`}>
                      <RotateCcw size={isTimerFullScreen?32:20}/> Đặt lại
                  </button>
              </div>
          )}

          {isTimerFullScreen && (
              <button onClick={() => setIsTimerFullScreen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-white bg-black/10 hover:bg-black/30 p-2 rounded-full backdrop-blur">
                  <Minimize size={32}/>
              </button>
          )}
      </div>
  );

  // 5. Question Interaction Modal
  const QuestionModal = () => {
      if (!activeQuestion) return null;

      return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 border-indigo-100 flex flex-col max-h-[90vh]">
                   <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                       <h3 className="font-bold text-lg flex items-center gap-2">
                           <HelpCircle className="text-yellow-300"/> 
                           Câu hỏi {activeQuestion.type === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận'}
                       </h3>
                       <button onClick={() => setShowQuestionModal(false)} className="hover:bg-indigo-700 p-1 rounded-full"><X/></button>
                   </div>

                   <div className="p-8 text-center bg-gray-50 border-b border-gray-100 overflow-y-auto">
                       <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed font-serif">
                           {activeQuestion.content}
                       </p>
                   </div>

                   <div className="p-6 bg-white flex-grow flex flex-col justify-center">
                       {/* Result Feedback */}
                       {answerStatus !== 'IDLE' && (
                           <div className={`text-center mb-6 animate-in zoom-in slide-in-from-bottom duration-300`}>
                               {answerStatus === 'CORRECT' ? (
                                   <div className="text-green-500 flex flex-col items-center">
                                       <CheckCircle size={64} className="mb-2"/>
                                       <span className="text-2xl font-black uppercase">Chính xác!</span>
                                   </div>
                               ) : (
                                   <div className="text-red-500 flex flex-col items-center">
                                       <XCircle size={64} className="mb-2"/>
                                       <span className="text-2xl font-black uppercase">Sai rồi!</span>
                                   </div>
                               )}
                           </div>
                       )}

                       {/* MCQ Options */}
                       {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {activeQuestion.options.map((opt, idx) => {
                                   let btnClass = "bg-white border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700";
                                   if (selectedOption !== null) {
                                       if (idx === activeQuestion.correctAnswer) btnClass = "bg-green-500 border-green-600 text-white shadow-lg scale-105";
                                       else if (idx === selectedOption && idx !== activeQuestion.correctAnswer) btnClass = "bg-red-100 border-red-300 text-red-400 opacity-50";
                                       else btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                                   }

                                   return (
                                       <button 
                                            key={idx}
                                            disabled={selectedOption !== null}
                                            onClick={() => handleCheckAnswer(idx)}
                                            className={`p-4 rounded-xl text-left transition-all duration-300 font-bold text-lg relative ${btnClass}`}
                                       >
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm opacity-60">
                                                {String.fromCharCode(65+idx)}
                                            </span>
                                            <span className="pl-10 block">{opt}</span>
                                       </button>
                                   )
                               })}
                           </div>
                       )}

                       {/* Essay Controls */}
                       {activeQuestion.type === 'ESSAY' && answerStatus === 'IDLE' && (
                           <div className="flex gap-4 justify-center mt-4">
                               <button 
                                    onClick={() => handleEssayGrade(true)}
                                    className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-green-600 shadow-lg shadow-green-200 flex items-center gap-2"
                                >
                                    <CheckCircle/> Đúng
                               </button>
                               <button 
                                    onClick={() => handleEssayGrade(false)}
                                    className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-600 shadow-lg shadow-red-200 flex items-center gap-2"
                                >
                                    <XCircle/> Sai
                               </button>
                           </div>
                       )}
                   </div>
               </div>
          </div>
      )
  };

  const Component = () => {
    return (
      <React.Fragment>
          {/* Main App Rendering is handled by currentView returns above, but need to mount Modals */}
          {showSettings && <SettingsModal />}
          {showManualPick && <ManualPickModal />}
          {showEndConfirm && <ConfirmEndModal />}
          {showQuestionModal && <QuestionModal />}
          {showHelp && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl">
                    {/* Sidebar */}
                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                            <BookOpen className="text-indigo-600"/> Hướng Dẫn
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-1">
                            {HELP_CONTENT.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveHelpTab(idx)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeHelpTab === idx ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {item.icon} {item.title}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Content */}
                    <div className="w-2/3 flex flex-col">
                         <div className="flex justify-between items-center p-4 border-b border-gray-200">
                             <h3 className="font-bold text-xl text-gray-800">{HELP_CONTENT[activeHelpTab].title}</h3>
                             <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-red-500">
                                 <X size={24}/>
                             </button>
                         </div>
                         <div className="flex-grow overflow-y-auto p-6 text-gray-700 leading-relaxed">
                             {HELP_CONTENT[activeHelpTab].content}
                         </div>
                    </div>
                </div>
            </div>
          )}
          {showChangelog && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <GitBranch className="text-indigo-600"/> Lịch sử Cập nhật
                        </h3>
                        <button onClick={() => setShowChangelog(false)} className="bg-gray-100 p-1 rounded-full hover:bg-gray-200">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                        {Storage.getChangelog().map((log, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-gray-200">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-gray-800">Phiên bản {log.version}</span>
                                    <span className="text-xs text-gray-400">{log.date}</span>
                                </div>
                                <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                                    {log.changes.map((change, cIdx) => (
                                        <li key={cIdx}>{change}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
          <GameTimer /> {/* Always mounted, visibility controlled by CSS */}
      </React.Fragment>
    )
  }

  return <Component />
}

export default App;