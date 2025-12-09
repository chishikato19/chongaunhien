import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Settings as SettingsIcon, Mic, Maximize, Minimize, Clock, RotateCcw, LogOut, HelpCircle, BookOpen, Hand, Youtube, X, PartyPopper, ShoppingBag, Info, AlertCircle, Trophy } from 'lucide-react';
import * as Storage from './services/storage.service';
import { ClassGroup, Student, PresentationMode, SelectionLogic, Settings as GameSettings, Question } from './types';
import VideoLibrary from './components/VideoLibrary';
import { NoiseMonitor } from './components/NoiseMonitor';
import { playTick, playWin } from './services/sound';
import { BADGE_INFO, BADGE_ICONS, checkAchievements, HELP_CONTENT } from './utils/gameLogic';
import SettingsModal from './components/modals/SettingsModal';
import { QuestionGameModal } from './components/modals/QuestionGameModal';
import ShopModal from './components/modals/ShopModal';
import SessionBoard from './components/SessionBoard';
import SetupView from './components/views/SetupView';
import SummaryView from './components/views/SummaryView';
import GameOverlay from './components/GameOverlay';
import { fireConfetti } from './utils/animationUtils';

function App() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]); 
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'SETUP' | 'SESSION' | 'GAME' | 'SUMMARY'>('SETUP');
  const [setupTab, setSetupTab] = useState<'CLASSES' | 'QUESTIONS'>('CLASSES');

  const [showSettings, setShowSettings] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false); 
  const [activeHelpTab, setActiveHelpTab] = useState(0);
  const [showVideoLib, setShowVideoLib] = useState(false); 
  const [showNoiseMonitor, setShowNoiseMonitor] = useState(false); 
  const [showShop, setShowShop] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showManualPick, setShowManualPick] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); 
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFullScreen, setIsTimerFullScreen] = useState(false);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  
  const [congratulationData, setCongratulationData] = useState<{student: Student, badges: string[]} | null>(null);
  const [settings, setSettings] = useState<GameSettings>(Storage.getSettings());

  const [winner, setWinner] = useState<Student | null>(null);
  const [gameMode, setGameMode] = useState<PresentationMode>(PresentationMode.SIMPLE);
  const [preferredMode, setPreferredMode] = useState<PresentationMode | 'RANDOM'>('RANDOM');
  const [roundCandidates, setRoundCandidates] = useState<Student[]>([]);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  
  const [isGroupSpin, setIsGroupSpin] = useState(false); 
  
  const [scoreAnimation, setScoreAnimation] = useState<{value: number, visible: boolean}>({value: 0, visible: false});
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionPicks, setSessionPicks] = useState(0);
  const [toast, setToast] = useState<{message: string, type: 'info'|'error'|'success'} | null>(null);
  const [cloudUrl, setCloudUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);

  useEffect(() => {
    setClasses(Storage.getClasses());
    setQuestions(Storage.getQuestions());
    setCloudUrl(Storage.getCloudUrl()); 
    const savedActiveId = Storage.getActiveClassId();
    if (savedActiveId) setActiveClassId(savedActiveId);
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
      let interval: any;
      if (isTimerRunning && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => {
                  const newVal = prev - 1;
                  // Tick sound when warning starts (e.g. last 10s)
                  if (newVal <= (settings.warningSeconds || 10) && newVal > 0) playTick();
                  if (newVal <= 0) { playWin(); setIsTimerRunning(false); return 0; }
                  return newVal;
              });
          }, 1000);
      } else if (timeLeft === 0) setIsTimerRunning(false);
      return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, settings.warningSeconds]);

  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const showToast = (message: string, type: 'info'|'error'|'success' = 'info') => setToast({message, type});

  const handleUpdateClasses = (newClasses: ClassGroup[]) => { setClasses(newClasses); Storage.saveClasses(newClasses); };
  const handleUpdateQuestions = (newQuestions: Question[]) => { setQuestions(newQuestions); Storage.saveQuestions(newQuestions); };
  const handleSetActiveClass = (id: string) => { setActiveClassId(id); Storage.setActiveClassId(id); };
  const updateSettings = (newSettings: Partial<GameSettings>) => { const updated = { ...settings, ...newSettings }; setSettings(updated); Storage.saveSettings(updated); };
  
  const handleSaveCloudUrl = () => { Storage.saveCloudUrl(cloudUrl); showToast("Đã lưu URL Script!", 'success'); };

  const handleCloudUpload = async () => {
      if(!cloudUrl) { showToast("Vui lòng nhập Google Script URL trước!", 'error'); return; }
      if(!window.confirm("Bạn có chắc muốn lưu TOÀN BỘ dữ liệu lên Google Sheet?")) return;
      setIsSyncing(true);
      const fullData = { classes: Storage.getClasses(), settings: Storage.getSettings(), questions: Storage.getQuestions(), videos: Storage.getVideos() };
      const res = await Storage.syncToCloud(cloudUrl, fullData);
      setIsSyncing(false);
      if(res.success) showToast(res.message, 'success'); else showToast(res.message, 'error');
  };

  const handleCloudDownload = async () => {
      if(!cloudUrl) { showToast("Vui lòng nhập Google Script URL trước!", 'error'); return; }
      if(!window.confirm("CẢNH BÁO: Dữ liệu tải về sẽ GHI ĐÈ dữ liệu hiện tại.")) return;
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
      } else { showToast(res.message, 'error'); }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.error(err));
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId), [classes, activeClassId]);
  const classTotalCumulativeScore = useMemo(() => activeClass ? activeClass.students.reduce((sum, s) => sum + (s.cumulativeScore || 0), 0) : 0, [activeClass]);

  // --- ACTIONS ---
  const startSession = () => {
      if (!activeClass || activeClass.students.length === 0) { showToast("Lớp học trống!", 'error'); return; }
      setSessionPoints(0); setSessionPicks(0); setPendingStudents([]); setCurrentView('SESSION');
  };

  const confirmEndSession = () => {
      setShowEndConfirm(false);
      setCurrentView('SUMMARY');
  };

  const startRandomizer = () => {
    if (!activeClass) return;
    setShowQuestionModal(false); 
    setShowResultOverlay(false); setScoreAnimation({value: 0, visible: false}); setWinner(null); setIsGroupSpin(false);

    let eligiblePool = activeClass.students.filter(s => !pendingStudents.find(p => p.id === s.id) && !s.isAbsent);
    if (eligiblePool.length === 0) { showToast("Không còn ai để gọi!", 'error'); return; }

    const pickedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setWinner(pickedWinner);
    let visualCandidates = activeClass.students.filter(s => !s.isAbsent);
    if (!visualCandidates.find(s => s.id === pickedWinner.id)) visualCandidates.push(pickedWinner);
    setRoundCandidates(visualCandidates);

    if (preferredMode !== 'RANDOM') setGameMode(preferredMode);
    else {
        const unlockedModes = Object.values(PresentationMode).filter(m => classTotalCumulativeScore >= (settings.gameUnlockThresholds?.[m] || 0));
        setGameMode(unlockedModes[Math.floor(Math.random() * unlockedModes.length)]);
    }
    setCurrentView('GAME');
  };

  const startGroupRandomizer = () => {
    if (!activeClass) return;
    setShowQuestionModal(false); 
    const groups = [...new Set(activeClass.students.map(s => s.group).filter(g => g))];
    if (groups.length === 0) { showToast("Chưa có nhóm!", 'error'); return; }

    setShowResultOverlay(false); setScoreAnimation({value: 0, visible: false}); setWinner(null); setIsGroupSpin(true);
    
    // --- WEIGHTED RANDOM LOGIC ---
    const groupScores: {[key: string]: number} = {};
    activeClass.students.forEach(s => {
        if (s.group) groupScores[s.group] = (groupScores[s.group] || 0) + s.score;
    });

    let totalWeight = 0;
    const weightedGroups = groups.map(gName => {
        const score = groupScores[gName as string] || 0;
        const weight = 1 / (score + 10); 
        totalWeight += weight;
        return { name: gName, weight };
    });

    let randomVal = Math.random() * totalWeight;
    let winningGroupName = groups[0];
    
    for (const g of weightedGroups) {
        randomVal -= g.weight;
        if (randomVal <= 0) {
            winningGroupName = g.name;
            break;
        }
    }

    const fakeStudent: Student = { 
        id: `GROUP_${winningGroupName}`, 
        name: winningGroupName as string, 
        group: winningGroupName as string, 
        avatar: Storage.GROUP_AVATAR_POOL[0], 
        gender: 'M', score: 0, cumulativeScore: 0, balance: 0, tags: [], lastPickedDate: null, isAbsent: false 
    };
    
    setWinner(fakeStudent);
    setRoundCandidates(groups.map((g, i) => ({ ...fakeStudent, id: `g${i}`, name: g as string, avatar: Storage.GROUP_AVATAR_POOL[i % 20] })));
    setGameMode(PresentationMode.SIMPLE);
    setCurrentView('GAME');
  };

  const handleManualPick = (studentOrGroup: Student | {name: string, isGroup: boolean}) => {
      let winningCandidate: Student;
      let isGroup = false;
      if ('isGroup' in studentOrGroup && studentOrGroup.isGroup) {
          isGroup = true;
          winningCandidate = { id: `GROUP_${studentOrGroup.name}`, name: studentOrGroup.name, group: studentOrGroup.name, avatar: '🛡️', gender: 'M', score: 0, cumulativeScore: 0, balance: 0, tags: [], lastPickedDate: null, isAbsent: false, achievements: [] };
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
    setShowResultOverlay(true); setSessionPicks(prev => prev + 1);
    if (winner && activeClass && !isGroupSpin) {
        const now = Date.now();
        const updatedStudents = activeClass.students.map(s => {
             if (s.id === winner.id) {
                 const badges = checkAchievements(s, 'PICK', 0, settings.achievementThresholds);
                 if (badges.length > 0) setCongratulationData({ student: winner, badges });
                 return { ...s, lastPickedDate: now, achievements: [...(s.achievements || []), ...badges] };
             }
             return s;
        });
        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? { ...activeClass, students: updatedStudents } : c));
    }
    
    if (activeQuestion) {
        setTimeout(() => {
             setShowResultOverlay(false);
             setShowQuestionModal(true);
        }, 1000);
    }
  };

  const applyKnowledgeKingLogic = (students: Student[]): Student[] => {
      // Find highest score > 0
      const maxScore = Math.max(...students.map(s => s.cumulativeScore || 0));
      
      return students.map(s => {
          const score = s.cumulativeScore || 0;
          let badges = s.achievements || [];
          const hasKing = badges.includes('KNOWLEDGE_KING');

          if (score === maxScore && maxScore > 0) {
              if (!hasKing) badges = [...badges, 'KNOWLEDGE_KING'];
          } else {
              if (hasKing) badges = badges.filter(b => b !== 'KNOWLEDGE_KING');
          }
          return { ...s, achievements: badges };
      });
  };

  const handleAddScore = (points: number, closeOverlay = true, actionType: 'SCORE' | 'LUCKY' = 'SCORE') => {
      setScoreAnimation({ value: points, visible: true });
      if (winner && activeClass) {
        let updatedStudents = activeClass.students;
        if (isGroupSpin) {
            updatedStudents = updatedStudents.map(s => s.group === winner.name ? { 
                ...s, 
                score: s.score + points, 
                cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, points),
                balance: (s.balance || 0) + Math.max(0, points) 
            } : s);
            setSessionPoints(prev => prev + (points * updatedStudents.filter(s => s.group === winner.name).length));
        } else {
            updatedStudents = updatedStudents.map(s => {
                if (s.id === winner.id) {
                    const temp = { 
                        ...s, 
                        score: s.score + points, 
                        cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, points),
                        balance: (s.balance || 0) + Math.max(0, points) 
                    };
                    const badges = checkAchievements(temp, actionType, points, settings.achievementThresholds);
                    if (badges.length > 0) {
                         setCongratulationData({ student: winner, badges });
                    }
                    return { ...temp, achievements: [...(s.achievements || []), ...badges] };
                }
                return s;
            });
            setSessionPoints(prev => prev + points);
        }

        // Apply Knowledge King Logic
        updatedStudents = applyKnowledgeKingLogic(updatedStudents);

        handleUpdateClasses(classes.map(c => c.id === activeClass.id ? { ...activeClass, students: updatedStudents } : c));
        
        if (closeOverlay) {
             setTimeout(() => { 
                 setCurrentView('SESSION'); 
                 setScoreAnimation({ value: 0, visible: false }); 
                 setShowQuestionModal(false); 
                 setActiveQuestion(null); 
             }, 1800);
        }
    }
  };

  const handleShopPurchase = (studentId: string, avatar: string, cost: number) => {
      if (!activeClass) return;
      const updatedStudents = activeClass.students.map(s => {
          if (s.id === studentId) {
              return {
                  ...s,
                  balance: (s.balance || 0) - cost,
                  unlockedAvatars: [...(s.unlockedAvatars || []), avatar],
                  avatar: avatar // Auto equip
              };
          }
          return s;
      });
      handleUpdateClasses(classes.map(c => c.id === activeClass.id ? { ...activeClass, students: updatedStudents } : c));
  };

  // --- OTHERS ---
  const handleGradeFromStage = (student: Student, points: number, actionType: 'SCORE' | 'LUCKY' = 'SCORE') => {
      if (!activeClass) return;
      const isGroup = student.id.startsWith('GROUP_');
      let updatedStudents = activeClass.students;
      
      if (isGroup) {
           updatedStudents = updatedStudents.map(s => s.group === student.name ? { ...s, score: s.score + points, cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, points), balance: (s.balance || 0) + Math.max(0, points) } : s);
      } else {
           updatedStudents = updatedStudents.map(s => {
               if (s.id === student.id) {
                   const temp = { ...s, score: s.score + points, cumulativeScore: (s.cumulativeScore || 0) + Math.max(0, points), balance: (s.balance || 0) + Math.max(0, points) };
                   const badges = checkAchievements(temp, actionType, points, settings.achievementThresholds);
                   if (badges.length > 0) setCongratulationData({ student, badges });
                   return { ...temp, achievements: [...(s.achievements || []), ...badges] };
               }
               return s;
           });
      }

      // Apply Knowledge King Logic
      updatedStudents = applyKnowledgeKingLogic(updatedStudents);

      handleUpdateClasses(classes.map(c => c.id === activeClass.id ? { ...activeClass, students: updatedStudents } : c));
      if (points > 0) playWin(); else playTick();
      setPendingStudents(prev => prev.filter(s => s.id !== student.id));
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
      const avail = questions.filter(q => !q.isAnswered);
      if (avail.length === 0) { showToast("Hết câu hỏi!", 'error'); return; }
      const q = avail[Math.floor(Math.random() * avail.length)];
      setActiveQuestion(q);
      setShowQuestionModal(true);
  };

  const onQuestionCorrect = () => {
      if(!activeQuestion) return;
      const updatedQs = questions.map(q => q.id === activeQuestion.id ? { ...q, isAnswered: true } : q);
      handleUpdateQuestions(updatedQs);
      
      if (winner && !isGroupSpin && activeClass) {
           let updatedStudents = activeClass.students.map(s => {
               if (s.id === winner.id) {
                    const badges = checkAchievements(s, 'CORRECT_ANSWER', 0, settings.achievementThresholds);
                    if(badges.length > 0) setCongratulationData({ student: winner, badges });
                    return { ...s, achievements: [...(s.achievements || []), ...badges]};
               }
               return s;
           });
           handleUpdateClasses(classes.map(c => c.id === activeClass.id ? { ...activeClass, students: updatedStudents } : c));
      }
      
      setShowQuestionModal(false);
      setShowResultOverlay(true);
      setCurrentView('GAME');
  };

  const resetData = () => {
    if (!activeClassId) return;
    if (window.confirm('CẢNH BÁO: Bạn muốn đặt lại điểm số phiên?')) {
        const updatedClasses = classes.map(c => c.id === activeClassId ? { ...c, students: c.students.map(s => ({ ...s, score: 0, lastPickedDate: null })) } : c);
        handleUpdateClasses(updatedClasses); setSessionPoints(0); setSessionPicks(0); setPendingStudents([]); showToast("Đã reset điểm phiên!", 'success');
    }
  };

  const handleExportData = () => {
      const data = { version: 2.5, date: new Date().toISOString(), classes: Storage.getClasses(), settings: Storage.getSettings(), activeClassId: Storage.getActiveClassId(), questions: Storage.getQuestions(), videos: Storage.getVideos() };
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file || !window.confirm("GHI ĐÈ dữ liệu?")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              if (data.classes) { setClasses(data.classes); Storage.saveClasses(data.classes); }
              if (data.settings) { setSettings(data.settings); Storage.saveSettings(data.settings); }
              if (data.questions) { setQuestions(data.questions); Storage.saveQuestions(data.questions); }
              showToast("Nhập dữ liệu thành công!", 'success');
          } catch(err) { showToast("Lỗi file!", 'error'); }
      };
      reader.readAsText(file);
  };

  const setCustomTimer = () => {
      const total = (customMinutes * 60) + customSeconds;
      if (total > 0) {
          setTimerDuration(total);
          setTimeLeft(total);
          setIsTimerRunning(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold text-white flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{toast.message}</div>}
      
      {showQuestionModal && activeQuestion && (
        <QuestionGameModal 
            question={activeQuestion} 
            winner={winner} 
            onClose={() => setShowQuestionModal(false)} 
            onStartRandomizer={startRandomizer} 
            onCorrectAnswer={onQuestionCorrect} 
        />
      )}

      {currentView === 'GAME' && winner && (
          <GameOverlay 
            winner={winner}
            roundCandidates={roundCandidates}
            gameMode={gameMode}
            duration={gameMode === PresentationMode.RACE ? settings.raceDuration : settings.spinDuration}
            showResultOverlay={showResultOverlay}
            scoreAnimation={scoreAnimation}
            isGroupSpin={isGroupSpin}
            groupPoints={settings.groupPoints}
            groupMinusPoints={settings.groupMinusPoints}
            maxPoints={settings.maxPoints}
            minusPoints={settings.minusPoints}
            minLuckyPoints={settings.minLuckyPoints}
            maxLuckyPoints={settings.maxLuckyPoints}
            minGroupLuckyPoints={settings.minGroupLuckyPoints}
            maxGroupLuckyPoints={settings.maxGroupLuckyPoints}
            onClose={() => setCurrentView('SESSION')}
            onComplete={handleGameComplete}
            onOpenQuestion={() => { setShowResultOverlay(false); setShowQuestionModal(true); }}
            onAddScore={handleAddScore}
            onPendingAdd={() => {
                if(!pendingStudents.find(s=>s.id===winner.id)) { setPendingStudents(prev=>[...prev, winner]); showToast(`Đã thêm ${winner.name} vào danh sách chờ!`, 'success'); } setCurrentView('SESSION');
            }}
          />
      )}

      {/* Congratulation Modal */}
      {congratulationData && (
          <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4" onClick={() => setCongratulationData(null)}>
              <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center relative animate-bounce-in border-8 border-yellow-400" onClick={e => e.stopPropagation()}>
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full p-4 border-4 border-white shadow-xl"><PartyPopper size={48} className="text-white"/></div>
                   <div className="mt-8">
                       <div className="text-8xl mb-4 animate-spin-slow">{congratulationData.student.avatar}</div>
                       <h2 className="text-3xl font-black text-indigo-800 mb-2">{congratulationData.student.name}</h2>
                       <div className="grid gap-4 mt-6">
                           {congratulationData.badges.map(badge => (
                               <div key={badge} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center gap-4">
                                   <div className="text-4xl">{BADGE_ICONS[badge]}</div>
                                   <div className="text-left"><div className="font-bold text-yellow-800">{BADGE_INFO[badge]?.split(':')[0]}</div><div className="text-xs text-yellow-600">{BADGE_INFO[badge]?.split(':')[1]}</div></div>
                               </div>
                           ))}
                       </div>
                       <button onClick={() => setCongratulationData(null)} className="mt-8 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Tuyệt vời!</button>
                   </div>
              </div>
          </div>
      )}

      {/* Changelog Modal */}
      {showChangelog && (
          <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-800"><Info size={24}/> Cập Nhật Phiên Bản Mới</h2>
                      <button onClick={() => setShowChangelog(false)}><X/></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {Storage.getChangelog().map((log, i) => (
                          <div key={i} className="mb-6 last:mb-0">
                              <div className="flex items-center gap-3 mb-2">
                                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-bold text-sm">V{log.version}</span>
                                  <span className="text-gray-500 text-sm">{log.date}</span>
                              </div>
                              <ul className="space-y-2">
                                  {log.changes.map((change, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                                          {change}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ))}
                  </div>
                  <div className="p-4 border-t flex justify-end">
                      <button onClick={() => setShowChangelog(false)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">Đã hiểu</button>
                  </div>
              </div>
          </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndConfirm && (
          <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
                  <AlertCircle size={48} className="mx-auto text-red-500 mb-4"/>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Kết Thúc Phiên?</h3>
                  <p className="text-gray-600 mb-6">Bạn có chắc muốn kết thúc phiên làm việc hiện tại và xem tổng kết không?</p>
                  <div className="flex gap-3 justify-center">
                      <button onClick={() => setShowEndConfirm(false)} className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">Hủy</button>
                      <button onClick={confirmEndSession} className="px-6 py-2 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700">Kết thúc</button>
                  </div>
              </div>
          </div>
      )}
      
      {showVideoLib && <VideoLibrary onClose={() => setShowVideoLib(false)} />}
      {showNoiseMonitor && <NoiseMonitor onClose={() => setShowNoiseMonitor(false)} />}
      {showSettings && <SettingsModal settings={settings} updateSettings={updateSettings} onClose={() => setShowSettings(false)} />}
      {showShop && activeClass && <ShopModal students={activeClass.students} settings={settings} onClose={() => setShowShop(false)} onPurchase={handleShopPurchase} />}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2"><div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Play size={20} fill="currentColor"/></div>
                      <span className="font-bold text-lg tracking-tight text-gray-800 flex items-center gap-2">
                          ClassRandomizer 
                          <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">V2.2</span>
                      </span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => setShowNoiseMonitor(true)} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-500"><Mic size={20} /></button>
                      <button onClick={() => setShowVideoLib(true)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Youtube size={20} /></button>
                      <button onClick={() => setShowTimerModal(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Clock size={20} /></button>
                      <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block">{isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
                      
                      <button onClick={() => setShowShop(true)} className="p-2 hover:bg-purple-50 rounded-lg text-purple-600" title="Cửa hàng"><ShoppingBag size={20} /></button>
                      
                      <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-gray-100 rounded-lg"><BookOpen size={20} /></button>
                      <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-lg"><SettingsIcon size={20} /></button>
                      {currentView === 'SESSION' && <><button onClick={resetData} className="p-2 bg-gray-100 rounded-lg" title="Reset điểm phiên"><RotateCcw size={16}/></button><button onClick={() => setShowEndConfirm(true)} className="p-2 bg-red-50 text-red-600 rounded-lg" title="Kết thúc phiên"><LogOut size={16}/></button></>}
                  </div>
              </div>
          </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-grow flex flex-col min-h-0">
          {currentView === 'SETUP' && (
              <SetupView 
                classes={classes} questions={questions} activeClassId={activeClassId} activeClass={activeClass} setupTab={setupTab} settings={settings} cloudUrl={cloudUrl} isSyncing={isSyncing}
                setSetupTab={setSetupTab} handleUpdateClasses={handleUpdateClasses} handleUpdateQuestions={handleUpdateQuestions} handleSetActiveClass={handleSetActiveClass}
                setCloudUrl={setCloudUrl} handleSaveCloudUrl={handleSaveCloudUrl} handleCloudUpload={handleCloudUpload} handleCloudDownload={handleCloudDownload} handleExportData={handleExportData} handleImportData={handleImportData} startSession={startSession}
              />
          )}

          {currentView === 'SESSION' && activeClass && (
              <SessionBoard 
                  activeClass={activeClass} 
                  sessionPicks={sessionPicks} 
                  sessionPoints={sessionPoints} 
                  settings={settings} 
                  classTotalCumulativeScore={classTotalCumulativeScore}
                  preferredMode={preferredMode}
                  setPreferredMode={setPreferredMode}
                  onOpenQuestion={handleOpenQuestion}
                  onManualPick={() => setShowManualPick(true)}
                  onGroupSpin={startGroupRandomizer}
                  onRandomizer={startRandomizer}
                  pendingStudents={pendingStudents}
                  handleGradeFromStage={handleGradeFromStage}
                  handleRemoveFromStage={(id) => setPendingStudents(prev => prev.filter(s => s.id !== id))}
                  handleLuckyGradeFromStage={handleLuckyGradeFromStage}
                  isGroupSpin={isGroupSpin}
              />
          )}

          {currentView === 'SUMMARY' && (
              <SummaryView sessionPicks={sessionPicks} sessionPoints={sessionPoints} onBack={() => setCurrentView('SETUP')} />
          )}
      </main>

      {showManualPick && activeClass && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-0 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Hand size={20} className="text-indigo-600"/> Gọi Chỉ Định</h3><button onClick={() => setShowManualPick(false)}><X size={20}/></button></div>
                  <div className="p-4 border-b"><input className="w-full border rounded-lg px-4 py-2 outline-none" placeholder="Tìm tên..." value={manualSearch} onChange={(e) => setManualSearch(e.target.value)} autoFocus /></div>
                  <div className="overflow-y-auto p-4 space-y-2 flex-grow">
                      <div className="grid grid-cols-2 gap-2">{[...new Set(activeClass.students.map(s => s.group).filter((g): g is string => !!g))].filter((g: string) => g.toLowerCase().includes(manualSearch.toLowerCase())).map((g: string) => <button key={g} onClick={() => handleManualPick({name: g, isGroup: true})} className="p-3 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200 text-left">🛡️ {g}</button>)}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">{activeClass.students.filter(s => s.name.toLowerCase().includes(manualSearch.toLowerCase())).map(s => <button key={s.id} onClick={() => handleManualPick(s)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"><span className="text-xl">{s.avatar}</span><div><div className="font-bold text-gray-700 truncate">{s.name}</div><div className="text-xs text-gray-400">{s.group}</div></div></button>)}</div>
                  </div>
              </div>
          </div>
      )}

      {showTimerModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className={`${isTimerFullScreen ? 'fixed inset-0 w-full h-full max-w-none rounded-none bg-indigo-900 text-white flex flex-col justify-center' : 'bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative'}`}>
                   {/* Fullscreen & Close Buttons requested by user */}
                   <button onClick={() => setShowTimerModal(false)} className="absolute top-4 right-4 p-2 bg-gray-200 text-gray-800 hover:bg-red-500 hover:text-white rounded-full z-20" title="Đóng"><X size={24}/></button>
                   <button onClick={() => setIsTimerFullScreen(!isTimerFullScreen)} className="absolute top-4 left-4 p-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-full z-20" title="Toàn màn hình">{isTimerFullScreen ? <Minimize size={24}/> : <Maximize size={24}/>}</button>
                   
                   <div className={`${isTimerFullScreen ? 'scale-150' : ''} text-center mb-6 bg-gray-900 rounded-xl p-6 text-white shadow-inner relative overflow-hidden transition-all duration-300`}>
                       <div className={`${isTimerFullScreen ? 'text-[15vw]' : 'text-7xl'} font-mono font-black tracking-widest relative z-10 ${timeLeft <= (settings.warningSeconds || 10) && isTimerRunning ? 'text-red-500 animate-pulse' : ''}`}>
                           {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                       </div>
                       <div className={`absolute bottom-0 left-0 h-2 transition-all duration-1000 ease-linear ${timeLeft <= (settings.warningSeconds || 10) ? 'bg-red-600' : 'bg-indigo-500'}`} style={{ width: `${(timeLeft / timerDuration) * 100}%`}}></div>
                   </div>

                   {!isTimerRunning && (
                       <div className="flex gap-2 justify-center mb-4">
                           <div className="flex flex-col items-center">
                               <input type="number" min="0" value={customMinutes} onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)} className="w-16 p-2 text-center border rounded font-bold text-gray-800" />
                               <span className="text-xs text-gray-500">Phút</span>
                           </div>
                           <span className="font-bold text-xl py-2">:</span>
                           <div className="flex flex-col items-center">
                               <input type="number" min="0" max="59" value={customSeconds} onChange={(e) => setCustomSeconds(parseInt(e.target.value) || 0)} className="w-16 p-2 text-center border rounded font-bold text-gray-800" />
                               <span className="text-xs text-gray-500">Giây</span>
                           </div>
                           <button onClick={setCustomTimer} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-bold text-sm h-10 mt-1">Đặt</button>
                       </div>
                   )}

                   <div className="flex gap-2"><button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg ${isTimerRunning ? 'bg-yellow-500' : 'bg-green-600'}`}>{isTimerRunning ? 'Tạm dừng' : 'Bắt đầu'}</button><button onClick={() => { setTimeLeft(timerDuration); setIsTimerRunning(false); }} className={`px-4 rounded-xl font-bold ${isTimerFullScreen ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}><RotateCcw size={20}/></button></div>
              </div>
          </div>
      )}

      {showHelp && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl h-[70vh] shadow-2xl flex overflow-hidden">
                  <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen size={20} className="text-indigo-600"/> Hướng Dẫn</h3><div className="space-y-1">{HELP_CONTENT.map((section, idx) => <button key={idx} onClick={() => setActiveHelpTab(idx)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeHelpTab === idx ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>{section.title}</button>)}</div></div>
                  <div className="w-2/3 p-6 overflow-y-auto relative"><button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button><h2 className="text-2xl font-bold text-gray-800 mb-4">{HELP_CONTENT[activeHelpTab].title}</h2><div className="prose prose-sm max-w-none">{HELP_CONTENT[activeHelpTab].content}</div></div>
              </div>
          </div>
      )}

      {/* Footer Version Info Removed, Moved to Header */}
    </div>
  );
}

export default App;