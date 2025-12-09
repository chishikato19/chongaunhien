

import { ClassGroup, Settings, Student, Question, Video, PresentationMode } from '../types';

const CLASSES_KEY = 'cr_classes';
const SETTINGS_KEY = 'cr_settings';
const ACTIVE_CLASS_KEY = 'cr_active_class_id';
const QUESTIONS_KEY = 'cr_questions';
const CLOUD_URL_KEY = 'cr_cloud_url';
const VIDEOS_KEY = 'cr_videos';

// --- CHANGELOG ---
export const CHANGELOG = [
    {
        version: "2.1",
        date: "2024-07-02",
        changes: [
            "Danh hiệu 'Vị Vua Tri Thức' (Knowledge King): Chỉ dành cho người cao điểm nhất lớp.",
            "Hệ thống Học Vị: Học việc, Cử nhân, Thạc sĩ, Tiến sĩ, Giáo sư theo mốc điểm.",
            "Nâng cấp Đồng hồ: Tùy chỉnh thời gian (Phút/Giây), Chế độ toàn màn hình.",
            "Hiển thị bảng cập nhật phiên bản khi khởi động."
        ]
    },
    {
        version: "2.0",
        date: "2024-07-01",
        changes: [
            "Hệ thống Shop: Học sinh dùng điểm tích lũy để mua Avatar đặc biệt.",
            "Nâng cấp Vòng quay (Wheel): Thêm mũi tên chỉ định và quay chính xác.",
            "Đồng hồ đếm ngược: Hiệu ứng cảnh báo sắp hết giờ.",
            "Câu hỏi ghép nối: Thêm đường nối trực quan.",
            "Chọn nhóm thông minh: Ưu tiên nhóm điểm thấp hơn."
        ]
    }
];

export const getChangelog = () => CHANGELOG;

// --- CLOUD SYNC SERVICE (Google Sheets) ---
export const getCloudUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(CLOUD_URL_KEY) || '';
};

export const saveCloudUrl = (url: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLOUD_URL_KEY, url);
};

export const syncToCloud = async (scriptUrl: string, fullData: any): Promise<{success: boolean, message: string}> => {
    try {
        if (!scriptUrl.startsWith('https://script.google.com/')) {
             return { success: false, message: 'URL không hợp lệ (Phải là Google Script URL).' };
        }

        const payload = {
            key: 'class_randomizer_backup',
            value: fullData
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        });
        
        const result = await response.json();
        
        if (result.result === 'success') {
            return { success: true, message: 'Đã lưu lên Google Sheet thành công!' };
        } else {
             return { success: false, message: 'Lỗi từ Google Script: ' + (result.message || JSON.stringify(result)) };
        }
    } catch (error: any) {
        console.error("Cloud Sync Error:", error);
        return { success: false, message: 'Lỗi kết nối: ' + error.message + '. Hãy kiểm tra lại URL hoặc quyền truy cập (Anyone).' };
    }
};

export const syncFromCloud = async (scriptUrl: string): Promise<{success: boolean, data?: any, message: string}> => {
    try {
         if (!scriptUrl.startsWith('https://script.google.com/')) {
             return { success: false, message: 'URL không hợp lệ.' };
        }

        const response = await fetch(scriptUrl);
        const result = await response.json();
        
        if (result['class_randomizer_backup']) {
            return { success: true, data: result['class_randomizer_backup'], message: 'Tải dữ liệu thành công!' };
        } else {
            return { success: false, message: 'Không tìm thấy dữ liệu trên Sheet này.' };
        }

    } catch (error: any) {
        return { success: false, message: 'Lỗi tải dữ liệu: ' + error.message };
    }
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- AVATAR SYSTEM (Animals Only for Common) ---
export const COMMON_AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', 
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐝', '🐛', '🦋', '🐌', 
  '🐞', '🐜', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🐡', '🐠', '🐟', '🐬', '🐳', 
  '🐋', '🦈', '🐊', '🦓', '🦍', '🦧', '🦣', '🐘'
];

// Special avatars for Shop/Unlocks
export const SPECIAL_AVATARS = [
    '🦄', '🐉', '👾', '👽', '👻', '🤖', '💩', '🤡', '👹', '👺', 
    '🧙', '🧙‍♀️', '🧚', '🧚‍♀️', '🧛', '🧛‍♀️', '🧜', '🧜‍♀️', '🧝', '🧝‍♀️',
    '🧞', '🧞‍♀️', '🧟', '🧟‍♀️', '🧠', '🦾', '🦿', '👁️', '🦸', '🦹',
    '👮', '👮‍♀️', '👷', '👷‍♀️', '💂', '💂‍♀️', '🕵️', '🕵️‍♀️', '👩‍⚕️', '👨‍⚕️',
    '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🥷', '🎅', 
    '🤶', '👯', '💃', '🕺', '🕴️', '🧘', '🔥', '⚡', '🌈', '☁️',
    '🥋', '👑', '💎', '⚔️', '🛡️', '🏹', '🧪', '🧬', '🚀', '🚁'
];

export const AVATAR_POOL = [...COMMON_AVATARS, ...SPECIAL_AVATARS];

export const GROUP_AVATAR_POOL = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🪐', '🌍', '🌕', '🌟', '🔥', '💧', '⚡', '🌈', '🍎', '🍇', '🍉'];

export const getRandomAvatar = () => COMMON_AVATARS[Math.floor(Math.random() * COMMON_AVATARS.length)];

export const getUniqueRandomAvatar = (pool: string[] = COMMON_AVATARS) => {
    if (pool.length === 0) return '🐶';
    return pool[Math.floor(Math.random() * pool.length)];
};

export const getClasses = (): ClassGroup[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CLASSES_KEY);
  
  if (data) {
      const parsed = JSON.parse(data) as ClassGroup[];
      return parsed.map(c => ({
          ...c,
          students: c.students.map(s => ({
              ...s,
              cumulativeScore: s.cumulativeScore ?? s.score,
              isAbsent: s.isAbsent ?? false,
              balance: s.balance ?? 0,
              unlockedAvatars: s.unlockedAvatars ?? []
          }))
      }));
  } else {
      return []; 
  }
};

export const saveClasses = (classes: ClassGroup[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
};

export const getQuestions = (): Question[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveQuestions = (questions: Question[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
};

export const getVideos = (): Video[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(VIDEOS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveVideos = (videos: Video[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
};

export const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getSettings = (): Settings => {
  if (typeof window === 'undefined') {
      return { 
        maxPoints: 10, minusPoints: 5, groupPoints: 20, groupMinusPoints: 10,
        minLuckyPoints: 1, maxLuckyPoints: 5, minGroupLuckyPoints: 5, maxGroupLuckyPoints: 15,
        spinDuration: 5, raceDuration: 10, themeColor: 'indigo', allowRepeats: false, soundEnabled: true,
        gameUnlockThresholds: {}, achievementThresholds: {}, congratulationTemplate: "Chúc mừng {name} đã đạt danh hiệu {badge}!",
        commonAvatars: COMMON_AVATARS, specialAvatars: SPECIAL_AVATARS,
        avatarPrice: 10, warningSeconds: 10
      };
  }
  
  const data = localStorage.getItem(SETTINGS_KEY);
  const defaultSettings: Settings = { 
    maxPoints: 10, 
    minusPoints: 5,
    groupPoints: 20, 
    groupMinusPoints: 10,
    minLuckyPoints: 1,
    maxLuckyPoints: 5,
    minGroupLuckyPoints: 5,
    maxGroupLuckyPoints: 15,
    spinDuration: 5,
    raceDuration: 10, 
    themeColor: 'indigo', 
    allowRepeats: false,
    soundEnabled: true,
    gameUnlockThresholds: {
        [PresentationMode.WHEEL]: 100,
        [PresentationMode.SLOT]: 200,
        [PresentationMode.RACE]: 300,
        [PresentationMode.BOX]: 400,
        [PresentationMode.FLIP]: 500,
        [PresentationMode.SPOTLIGHT]: 600,
        [PresentationMode.GRID_ELIMINATION]: 700,
        [PresentationMode.DICE]: 800,
        [PresentationMode.LUCKY_CARDS]: 900,
        [PresentationMode.CLAW_MACHINE]: 1000,
        [PresentationMode.GALAXY]: 1500,
        [PresentationMode.EGG_HATCH]: 2000,
    },
    achievementThresholds: {
        'RANK_APPRENTICE': 10,
        'RANK_BACHELOR': 50,
        'RANK_MASTER': 100,
        'RANK_PHD': 200,
        'RANK_PROFESSOR': 500,
    },
    congratulationTemplate: "Chúc mừng {name} đã đạt danh hiệu {badge}!",
    commonAvatars: COMMON_AVATARS,
    specialAvatars: SPECIAL_AVATARS,
    avatarPrice: 10,
    warningSeconds: 10
  };

  const saved = data ? JSON.parse(data) : {};
  
  return { 
      ...defaultSettings, 
      ...saved,
      gameUnlockThresholds: { ...defaultSettings.gameUnlockThresholds, ...saved.gameUnlockThresholds },
      achievementThresholds: { ...defaultSettings.achievementThresholds, ...saved.achievementThresholds },
      commonAvatars: saved.commonAvatars || defaultSettings.commonAvatars,
      specialAvatars: saved.specialAvatars || defaultSettings.specialAvatars,
      avatarPrice: saved.avatarPrice ?? defaultSettings.avatarPrice,
      warningSeconds: saved.warningSeconds ?? defaultSettings.warningSeconds
  };
};

export const saveSettings = (settings: Settings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getActiveClassId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CLASS_KEY);
};

export const setActiveClassId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_CLASS_KEY, id);
};
