
import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Play, BarChart2, Settings as SettingsIcon, Home, UserCheck, ShieldAlert, Award, RefreshCw, X, Grid2X2, Timer, Volume2, Trophy, LogOut, ChevronDown, ChevronUp, Users, Hand } from 'lucide-react';
import * as Storage from './services/storage';
import { ClassGroup, Student, PresentationMode, SelectionLogic, Settings as GameSettings } from './types';
import ClassManager from './components/ClassManager';
import { VisualizationContainer } from './components/Visualizers';

// --- Helper Functions ---
const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleTimeString() : 'Chưa gọi';

function App() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  
  // Views: SETUP (Input), SESSION (Leaderboard/Hub), GAME (Spinning), SUMMARY (End)
  const [currentView, setCurrentView] = useState<'SETUP' | 'SESSION' | 'GAME' | 'SUMMARY'>('SETUP');
  const [showSettings, setShowSettings] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  // Manual Pick State
  const [showManualPick, setShowManualPick] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  
  // Settings
  const [settings, setSettings] = useState<GameSettings>(Storage.getSettings());

  // Game State
  const [winner, setWinner] = useState<Student | null>(null);
  const [gameMode, setGameMode] = useState<PresentationMode>(PresentationMode.SIMPLE);
  const [gameLogic, setGameLogic] = useState<SelectionLogic>(SelectionLogic.RANDOM_INDIVIDUAL);
  const [roundCandidates, setRoundCandidates] = useState<Student[]>([]);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [groupModeEnabled, setGroupModeEnabled] = useState(false);
  const [isGroupSpin, setIsGroupSpin] = useState(false); // New flag for Group Spin Mode

  // Leaderboard State
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Session Stats
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionPicks, setSessionPicks] = useState(0);

  // Initialization
  useEffect(() => {
    setClasses(Storage.getClasses());
    const savedActiveId = Storage.getActiveClassId();
    if (savedActiveId) setActiveClassId(savedActiveId);
  }, []);

  const handleUpdateClasses = (newClasses: ClassGroup[]) => {
    setClasses(newClasses);
    Storage.saveClasses(newClasses);
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

  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId), [classes, activeClassId]);

  // --- Actions ---
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
    setWinner(null);
    setIsGroupSpin(false); // Individual spin

    // 0. Group Logic Check
    const hasGroups = activeClass.students.some(s => s.group && s.group.trim() !== '');
    
    // 1. Logic Selection
    let chosenLogic = SelectionLogic.RANDOM_INDIVIDUAL;
    if (groupModeEnabled && hasGroups) {
        chosenLogic = SelectionLogic.GROUP_ROTATION;
    } else {
        const logics = [SelectionLogic.RANDOM_INDIVIDUAL, SelectionLogic.RANDOM_INDIVIDUAL, SelectionLogic.TAG_FILTER, SelectionLogic.ABSOLUTE_RANDOM];
        if (hasGroups) logics.push(SelectionLogic.GROUP_ROTATION);
        chosenLogic = logics[Math.floor(Math.random() * logics.length)];
    }
    setGameLogic(chosenLogic);

    // 2. Filter Eligible Pool
    let eligiblePool = [...activeClass.students];
    
    // Group Balancing
    if (chosenLogic === SelectionLogic.GROUP_ROTATION && hasGroups) {
        const groups: {[key: string]: Student[]} = {};
        eligiblePool.forEach(s => {
            const gName = s.group || 'Ungrouped';
            if (!groups[gName]) groups[gName] = [];
            groups[gName].push(s);
        });
        
        // Find groups with MIN usage
        const groupUsage: {[key: string]: number} = {};
        Object.keys(groups).forEach(gName => {
            groupUsage[gName] = groups[gName].filter(s => s.lastPickedDate !== null).length;
        });
        const minUsage = Math.min(...Object.values(groupUsage));
        const candidateGroups = Object.keys(groupUsage).filter(g => groupUsage[g] === minUsage);
        
        // Flatten
        let groupPool: Student[] = [];
        candidateGroups.forEach(g => groupPool = [...groupPool, ...groups[g]]);
        
        // Prefer unpicked in those groups
        const unpickedInGroups = groupPool.filter(s => s.lastPickedDate === null);
        eligiblePool = unpickedInGroups.length > 0 ? unpickedInGroups : groupPool;
    }

    // Repeat Logic
    if (!settings.allowRepeats && chosenLogic !== SelectionLogic.ABSOLUTE_RANDOM) {
        const unpicked = eligiblePool.filter(s => s.lastPickedDate === null);
        if (unpicked.length > 0) eligiblePool = unpicked;
        else if (chosenLogic !== SelectionLogic.GROUP_ROTATION) {
             // If all picked, recycle oldest
             eligiblePool.sort((a, b) => (a.lastPickedDate || 0) - (b.lastPickedDate || 0));
             eligiblePool = eligiblePool.slice(0, Math.ceil(eligiblePool.length / 2));
        }
    }

    if (eligiblePool.length === 0) eligiblePool = activeClass.students;

    // 3. Pick Winner
    const pickedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setWinner(pickedWinner);

    // 4. Visual Candidates (Mix of everyone for effect)
    const others = activeClass.students.filter(s => s.id !== pickedWinner.id).sort(() => 0.5 - Math.random());
    setRoundCandidates([pickedWinner, ...others]);

    // 5. Mode
    const modes = [
        PresentationMode.SIMPLE, 
        PresentationMode.RACE, 
        PresentationMode.WHEEL, 
        PresentationMode.SLOT, 
        PresentationMode.BOX, 
        PresentationMode.SPOTLIGHT,
        PresentationMode.GRID_ELIMINATION,
        PresentationMode.FLIP,
        PresentationMode.GALAXY
    ];
    setGameMode(modes[Math.floor(Math.random() * modes.length)]);
    
    setCurrentView('GAME');
  };

  const startGroupRandomizer = () => {
    if (!activeClass) return;

    // Get unique groups
    const uniqueGroupNames = [...new Set(activeClass.students.map(s => s.group).filter(g => g && g.trim() !== ''))];
    if (uniqueGroupNames.length === 0) {
        alert("Chưa có nhóm nào được tạo!");
        return;
    }

    setShowResultOverlay(false);
    setWinner(null);
    setIsGroupSpin(true); // Enable group spin flag

    // --- LOGIC: FAIR GROUP ROTATION ---
    // Calculate last picked timestamp for each group (max timestamp of any student in group)
    const groupLastPicked: {[key: string]: number} = {};
    uniqueGroupNames.forEach(gName => {
        const studentsInGroup = activeClass.students.filter(s => s.group === gName);
        const latestPick = Math.max(...studentsInGroup.map(s => s.lastPickedDate || 0));
        groupLastPicked[gName as string] = latestPick;
    });

    // Sort groups by last picked (oldest/zero first)
    const sortedGroups = uniqueGroupNames.sort((a, b) => groupLastPicked[a as string] - groupLastPicked[b as string]);
    
    let candidateGroupPool = sortedGroups;
    
    // If we have many groups, limit to least recent half, unless all are 0
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
    setRoundCandidates(groupCandidates.sort(() => 0.5 - Math.random()));

    // Randomize Mode (excluding ones that might look weird with few items if few groups)
    const modes = [PresentationMode.SIMPLE, PresentationMode.RACE, PresentationMode.WHEEL, PresentationMode.BOX, PresentationMode.SPOTLIGHT, PresentationMode.FLIP];
    setGameMode(modes[Math.floor(Math.random() * modes.length)]);
    
    setCurrentView('GAME');
  };

  // --- Manual Pick Handling ---
  const handleManualPick = (studentOrGroup: Student | {name: string, isGroup: boolean}) => {
      let winningCandidate: Student;
      let isGroup = false;

      if ('isGroup' in studentOrGroup && studentOrGroup.isGroup) {
          // It's a group
          isGroup = true;
          // Find index for avatar consistency
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
          // It's a student
          winningCandidate = studentOrGroup as Student;
      }

      setWinner(winningCandidate);
      setIsGroupSpin(isGroup);
      setShowManualPick(false);
      setCurrentView('GAME'); // Switch to game view context mainly for overlay structure
      setShowResultOverlay(true); // Immediately show result
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

  const handleAddScore = (points: number) => {
      if (winner && activeClass) {
        let updatedStudents: Student[] = [];
        
        let finalPoints = points;
        if (isGroupSpin && points === settings.maxPoints) {
            finalPoints = settings.groupPoints;
        }

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
        setCurrentView('SESSION');
    }
  };

  const resetData = () => {
    if (!activeClassId) {
        alert("Chưa chọn lớp để reset!");
        return;
    }

    if (window.confirm('CẢNH BÁO: Hành động này sẽ đặt toàn bộ ĐIỂM SỐ về 0 cho lớp đang chọn.\nDanh sách học sinh sẽ được GIỮ NGUYÊN.\n\nBạn có chắc chắn muốn tiếp tục?')) {
        
        try {
            // 1. Get latest from storage (Source of Truth)
            const currentStoredClasses = Storage.getClasses();
            let classFound = false;

            // 2. Modify specific class
            const updatedClasses = currentStoredClasses.map(c => {
                if (c.id === activeClassId) {
                    classFound = true;
                    // Reset scores and history for all students in this class
                    const resetStudents = c.students.map(s => ({
                        ...s,
                        score: 0,
                        lastPickedDate: null
                    }));
                    return { ...c, students: resetStudents };
                }
                return c;
            });

            if (!classFound) {
                // If not in storage (rare), try using state
                 const fallbackClasses = classes.map(c => {
                    if (c.id === activeClassId) {
                        const resetStudents = c.students.map(s => ({ ...s, score: 0, lastPickedDate: null }));
                        return { ...c, students: resetStudents };
                    }
                    return c;
                 });
                 Storage.saveClasses(fallbackClasses);
                 setClasses(fallbackClasses);
            } else {
                // 3. Save to Storage
                Storage.saveClasses(updatedClasses);
                
                // 4. Update State to match
                setClasses(updatedClasses);
            }

            // Reset Session Stats
            setSessionPoints(0);
            setSessionPicks(0);

            // Notify
            // alert("Đã reset điểm thành công!");
        } catch (e) {
            console.error("Reset error", e);
            alert("Có lỗi xảy ra khi lưu dữ liệu.");
        }
    }
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

  // --- Renders ---

  const renderLeaderboard = () => {
      if (!activeClass) return null;
      
      // Group Scores
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

      return (
          <div className="max-w-6xl mx-auto p-4 space-y-6 animate-fade-in pb-28">
              {/* Header Stats */}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Student Leaderboard */}
                  <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-fit">
                      <div className="bg-indigo-600 text-white p-3 font-bold flex justify-between items-center">
                          <span>🏆 Xếp Hạng Cá Nhân</span>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
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

                  {/* Group Leaderboard */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-fit">
                      <div className="bg-purple-600 text-white p-3 font-bold">
                          <span>🛡️ Xếp Hạng Nhóm</span>
                      </div>
                      <div className="p-2">
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
                                  
                                  {/* Expanded Group Members */}
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
          </div>
      );
  };

  const renderGameOverlay = () => {
     if (!winner) return null;
     
     // Determine duration based on mode
     const currentDuration = gameMode === PresentationMode.RACE ? settings.raceDuration : settings.spinDuration;

     return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <div className="absolute top-4 right-4 z-50">
                 {/* Safety close */}
                <button onClick={() => setCurrentView('SESSION')} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
                    <X />
                </button>
            </div>
            
            {/* Visualizer */}
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

            {/* Result / Scoring Overlay */}
            {showResultOverlay && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 transform transition-all scale-100 border-4 border-indigo-500">
                        <div className="text-8xl mb-4 animate-bounce filter drop-shadow-lg">{winner.avatar}</div>
                        <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-1">
                            {isGroupSpin ? 'Nhóm Chiến Thắng' : 'Chúc mừng'}
                        </h2>
                        <h1 className="text-4xl font-black text-indigo-800 mb-2">{winner.name}</h1>
                        {winner.group && !isGroupSpin && <div className="mb-8 inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-200">{winner.group}</div>}
                        {isGroupSpin && <div className="mb-8 text-sm text-green-600 font-bold">Cộng điểm cho toàn bộ thành viên!</div>}
                        
                        <div className="grid grid-cols-2 gap-3 mb-2">
                             {/* Correct Answer Button - Dynamic points based on mode */}
                            <button onClick={() => handleAddScore(settings.maxPoints)} className="py-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex flex-col items-center justify-center">
                                <span className="text-xl">+{isGroupSpin ? settings.groupPoints : settings.maxPoints}</span>
                                <span className="text-[10px] uppercase opacity-70">Trả lời đúng</span>
                            </button>
                            {/* Lucky Point */}
                            <button onClick={handleLuckyPointClick} className="py-4 bg-yellow-50 text-yellow-700 font-bold rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors flex flex-col items-center justify-center">
                                <span className="text-xl">🎲 +{getLuckyRangeText()}</span>
                                <span className="text-[10px] uppercase opacity-70">May mắn</span>
                            </button>
                        </div>
                         <button onClick={() => setCurrentView('SESSION')} className="w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-medium mt-2">
                                Bỏ qua (Không cộng điểm)
                        </button>
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

  // --- Main Render ---

  if (currentView === 'SUMMARY') return renderSummary();
  if (currentView === 'GAME') return renderGameOverlay();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* End Session Confirmation Modal */}
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

      {/* Manual Pick Modal */}
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
                      {/* Groups */}
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

                      {/* Students */}
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

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><SettingsIcon size={20}/> Cài Đặt</h3>
                  
                  <div className="space-y-4">
                      {/* Durations */}
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

                      {/* Points */}
                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                           <h4 className="text-xs font-bold text-gray-500 uppercase">Điểm số</h4>
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium block mb-1">Cá nhân</label>
                                    <input type="number" value={settings.maxPoints} onChange={(e) => updateSettings({maxPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Cả Nhóm</label>
                                    <input type="number" value={settings.groupPoints} onChange={(e) => updateSettings({groupPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
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
              <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Play size={20} fill="currentColor"/></div>
                  <span className="font-bold text-lg tracking-tight text-gray-800">ClassRandomizer</span>
              </div>
              <div className="flex gap-2">
                   {currentView === 'SESSION' && (
                       <>
                           <button onClick={resetData} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 font-bold text-sm" title="Reset điểm">
                               <RefreshCw size={18}/> <span className="hidden md:inline">Reset điểm</span>
                           </button>
                           <button onClick={triggerEndSession} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg flex items-center gap-1 font-bold text-sm">
                               <LogOut size={18}/> <span className="hidden md:inline">Kết thúc</span>
                           </button>
                       </>
                   )}
                   <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                       <SettingsIcon size={20}/>
                   </button>
              </div>
          </div>
      </header>

      {/* SETUP VIEW */}
      {currentView === 'SETUP' && (
          <main className="container mx-auto p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 space-y-4">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                          <h2 className="text-2xl font-bold mb-2">Bắt Đầu Phiên Mới</h2>
                          <p className="text-indigo-100 text-sm mb-6">Chọn lớp, kiểm tra danh sách và bắt đầu buổi học thú vị!</p>
                          <button 
                            onClick={startSession} 
                            disabled={!activeClass || activeClass.students.length === 0}
                            className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              Bắt Đầu Ngay
                          </button>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                           <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><SettingsIcon size={16}/> Cài đặt nhanh</h3>
                           <div className="flex items-center justify-between py-2 border-b border-gray-50">
                               <span className="text-sm">Chia đều nhóm</span>
                               <input type="checkbox" checked={groupModeEnabled} onChange={(e) => setGroupModeEnabled(e.target.checked)} className="w-4 h-4 accent-indigo-600"/>
                           </div>
                           <button onClick={resetData} className="w-full mt-2 text-xs text-red-400 hover:text-red-600 py-1">Reset điểm số lớp này</button>
                      </div>
                  </div>
                  <div className="w-full md:w-2/3">
                      <ClassManager 
                        classes={classes} 
                        activeClassId={activeClassId} 
                        onUpdateClasses={handleUpdateClasses} 
                        onSetActive={handleSetActiveClass}
                      />
                  </div>
              </div>
          </main>
      )}

      {/* SESSION VIEW (Leaderboard + Spin Button) */}
      {currentView === 'SESSION' && activeClass && (
          <main className="relative min-h-[calc(100vh-64px)]">
               {/* Leaderboard content */}
               {renderLeaderboard()}

               {/* Floating Action Bar */}
               <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-10">
                   <div className="container mx-auto flex flex-col md:flex-row items-center justify-between max-w-4xl gap-4">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block">
                                <div className="text-xs font-bold text-gray-500 uppercase">Lớp đang chọn</div>
                                <div className="font-bold text-indigo-700">{activeClass.name}</div>
                            </div>
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 hidden sm:block">
                                {groupModeEnabled ? 'Chế độ Nhóm' : 'Chế độ Hỗn hợp'}
                            </div>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                onClick={() => setShowManualPick(true)}
                                className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transform transition-transform hover:scale-105 active:scale-95"
                                title="Gọi chỉ định"
                            >
                                <Hand size={20} /> <span className="hidden sm:inline">GỌI CHỈ ĐỊNH</span>
                            </button>
                            <button 
                                onClick={startGroupRandomizer}
                                className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transform transition-transform hover:scale-105 active:scale-95"
                            >
                                <Grid2X2 fill="currentColor" size={20}/> QUAY NHÓM
                            </button>
                            <button 
                                onClick={startRandomizer}
                                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transform transition-transform hover:scale-105 active:scale-95"
                            >
                                <Play fill="currentColor" /> QUAY SỐ
                            </button>
                        </div>
                   </div>
               </div>
          </main>
      )}

    </div>
  );
}

export default App;
