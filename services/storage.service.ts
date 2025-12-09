

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
        version: "2.4",
        date: "2024-06-15",
        changes: [
            "Cập nhật hệ thống Avatar: Tách riêng Avatar thường và Avatar đặc biệt (dành cho danh hiệu).",
            "Cải tiến phần Cài đặt: Hiển thị đầy đủ điều kiện nhận tất cả các danh hiệu.",
            "Nâng cấp tính năng Nhập câu hỏi: Hướng dẫn chi tiết và hỗ trợ dạng câu hỏi Sắp xếp từ Word."
        ]
    },
    {
        version: "2.3",
        date: "2024-06-10",
        changes: [
            "Bổ sung dạng câu hỏi Ghép nối (Matching) với giao diện tương tác.",
            "Tính năng 'Hiện câu hỏi trước': Cho phép cả lớp xem câu hỏi rồi mới quay số.",
            "Bảng chúc mừng Danh hiệu (Achievements) hoành tráng, có thể tùy chỉnh lời chúc.",
            "Khôi phục danh sách lớp đầy đủ từ 6A1 đến 9A3.",
            "Hỗ trợ nhập câu hỏi ghép nối từ Word (dùng dấu | để ngăn cách)."
        ]
    },
    {
        version: "2.2",
        date: "2024-06-05",
        changes: [
            "Giao diện trả lời câu hỏi mới: Toàn màn hình (Full Screen).",
            "Thêm dạng câu hỏi 'Sắp xếp thứ tự' (Sequence) với tính năng Kéo & Thả.",
            "Bổ sung danh hiệu cá nhân (Thần tốc, Chuỗi thắng) và danh hiệu nhóm."
        ]
    },
    {
        version: "2.1",
        date: "2024-06-01",
        changes: [
            "Bổ sung mã Google Apps Script mẫu trong phần Hướng dẫn.",
            "Cho phép tùy chỉnh mốc điểm mở khóa Game và Danh hiệu trong Cài đặt.",
            "Thêm tính năng Điểm danh (Đánh dấu vắng mặt)."
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

        // Prepare data package
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


// --- DATA INJECTION START ---
const DEFAULT_RAW_DATA = `
6A1:
Nguyễn Văn An (Nam)
Trần Thị Bích (Nữ)
Lê Hoàng Cường (Nam)
Phạm Thu Dung (Nữ)
Hoàng Văn Em (Nam)
Vũ Thị Gấm (Nữ)
Đặng Minh Hiếu (Nam)
Bùi Thanh Hương (Nữ)
Đỗ Văn Hùng (Nam)
Ngô Thị Lan (Nữ)

6A2:
Dương Văn Khánh (Nam)
Lý Thị Mơ (Nữ)
Trương Văn Nam (Nam)
Hồ Thị Nga (Nữ)
Cao Văn Phúc (Nam)
Đinh Thị Quỳnh (Nữ)
Phan Văn Sơn (Nam)
Võ Thị Tuyết (Nữ)
Bạch Văn Tùng (Nam)
Lương Thị Uyên (Nữ)

6A3:
Mai Văn Vinh (Nam)
Trịnh Thị Xuân (Nữ)
Đoàn Văn Yên (Nam)
Lâm Thị Yến (Nữ)
Tô Văn Vũ (Nam)
Hà Thị Thảo (Nữ)
Vương Văn Tài (Nam)
Diệp Thị Hồng (Nữ)
Khương Văn Duy (Nam)
Lục Thị Mai (Nữ)

7A1:
Nguyễn Đức Anh
Trần Bảo Châu (Nữ)
Phạm Duy Đạt
Lê Thị Hạnh (Nữ)
Hoàng Minh Khôi
Vũ Ngọc Linh (Nữ)
Đặng Quốc Minh
Bùi Phương Nhi (Nữ)
Đỗ Quang Nhật
Ngô Thảo Quyên (Nữ)

7A2:
Dương Tấn Sang
Lý Thanh Tâm (Nữ)
Trương Hữu Thắng
Hồ Cẩm Tú (Nữ)
Cao Kiến Văn
Đinh Hải Yến (Nữ)
Phan Trọng Hiếu
Võ Kim Ngân (Nữ)
Bạch Tuấn Kiệt
Lương Mỹ Duyên (Nữ)

7A3:
Mai Quốc Bảo
Trịnh Thu Hà (Nữ)
Đoàn Minh Tuấn
Lâm Ngọc Ánh (Nữ)
Tô Thanh Phong
Hà Bảo Ngọc (Nữ)
Vương Quốc Huy
Diệp Minh Thư (Nữ)
Khương Duy Tân
Lục Tuyết Nhi (Nữ)

8A1:
Nguyễn Hải Đăng
Trần Ngọc Diệp (Nữ)
Phạm Thanh Tùng
Lê Khánh Vy (Nữ)
Hoàng Văn Minh
Vũ Thị Thu (Nữ)
Đặng Hữu Phước
Bùi Thị Hoa (Nữ)
Đỗ Thành Long
Ngô Thị Mai (Nữ)

8A2:
Dương Văn Lâm
Lý Thị Hằng (Nữ)
Trương Văn Quyết
Hồ Thị Thủy (Nữ)
Cao Văn Lộc
Đinh Thị Nhung (Nữ)
Phan Văn Hậu
Võ Thị Trang (Nữ)
Bạch Văn Cường
Lương Thị Vân (Nữ)

8A3:
Mai Văn Kiên
Trịnh Thị Đào (Nữ)
Đoàn Văn Bách
Lâm Thị Liễu (Nữ)
Tô Văn Hưng
Hà Thị Mận (Nữ)
Vương Văn Đô
Diệp Thị Chanh (Nữ)
Khương Văn Sáng
Lục Thị Tươi (Nữ)

9A1:
Nguyễn Thành Đạt
Trần Thị Kim (Nữ)
Phạm Văn Đông
Lê Thị Sen (Nữ)
Hoàng Văn Nam
Vũ Thị Huệ (Nữ)
Đặng Văn Bắc
Bùi Thị Cúc (Nữ)
Đỗ Văn Tây
Ngô Thị Lan (Nữ)

9A2:
Dương Văn Hùng
Lý Thị Mận (Nữ)
Trương Văn Dũng
Hồ Thị Đào (Nữ)
Cao Văn Mạnh
Đinh Thị Hồng (Nữ)
Phan Văn Cường
Võ Thị Thắm (Nữ)
Bạch Văn Bình
Lương Thị Duyên (Nữ)

9A3:
Mai Văn Tính
Trịnh Thị Tình (Nữ)
Đoàn Văn Nghĩa
Lâm Thị Lý (Nữ)
Tô Văn Trí
Hà Thị Tín (Nữ)
Vương Văn Dũng
Diệp Thị Hạnh (Nữ)
Khương Văn Phúc
Lục Thị Lộc (Nữ)
`;

const parseDefaultData = (): ClassGroup[] => {
    const lines = DEFAULT_RAW_DATA.split('\n');
    const classes: ClassGroup[] = [];
    let currentClass: ClassGroup | null = null;
    
    const usedAvatarsInClass = new Set<string>();
    
    const getUniqueForParse = () => {
        // Only use COMMON avatars for default parsing
        const available = COMMON_AVATARS.filter(a => !usedAvatarsInClass.has(a));
        if (available.length === 0) return getRandomAvatar();
        const picked = available[Math.floor(Math.random() * available.length)];
        usedAvatarsInClass.add(picked);
        return picked;
    };

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.endsWith(':')) {
            const className = trimmed.replace(':', '');
            currentClass = {
                id: generateId(),
                name: className,
                students: []
            };
            usedAvatarsInClass.clear();
            classes.push(currentClass);
        } else if (currentClass) {
            let gender: 'M' | 'F' = 'M';
            let name = trimmed;
            if (name.toLowerCase().includes('(nữ)') || name.toLowerCase().includes('(f)')) {
                gender = 'F';
            }
            name = name.replace(/\(.*\)/g, '').trim();

            currentClass.students.push({
                id: generateId(),
                name: name,
                gender: gender,
                avatar: getUniqueForParse(),
                score: 0,
                cumulativeScore: 0,
                tags: [],
                lastPickedDate: null,
                group: '',
                isAbsent: false,
                achievements: []
            });
        }
    });
    return classes;
};
// --- DATA INJECTION END ---


export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- AVATAR SYSTEM ---

// Common avatars for normal student assignment
export const COMMON_AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', 
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐝', '🐛', '🦋', '🐌', 
  '🐞', '🐜', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🐡', '🐠', '🐟', '🐬', '🐳', 
  '🐋', '🦈', '🐊', '🦓', '🦍', '🦧', '🦣', '🐘', '👱', '🟠'
];

// Special avatars reserved for badges/unlocks (not assigned by default)
export const SPECIAL_AVATARS = [
    '🦄', '🐉', '🥋', '👾', '👽', '👻', '🤖', '💩', '🤡', '👹', '👺', 
    '🧙', '🧙‍♀️', '🧚', '🧚‍♀️', '🧛', '🧛‍♀️', '🧜', '🧜‍♀️', '🧝', '🧝‍♀️',
    '🧞', '🧞‍♀️', '🧟', '🧟‍♀️', '🧠', '🦾', '🦿', '👁️', '🦸', '🦹',
    '👮', '👮‍♀️', '👷', '👷‍♀️', '💂', '💂‍♀️', '🕵️', '🕵️‍♀️', '👩‍⚕️', '👨‍⚕️',
    '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🥷', '🎅', 
    '🤶', '👯', '💃', '🕺', '🕴️', '🧘', '🔥', '⚡', '🌈', '☁️'
];

export const AVATAR_POOL = [...COMMON_AVATARS, ...SPECIAL_AVATARS];

export const GROUP_AVATAR_POOL = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🪐', '🌍', '🌕', '🌟', '🔥', '💧', '⚡', '🌈', '🍎', '🍇', '🍉'];

export const getRandomAvatar = () => COMMON_AVATARS[Math.floor(Math.random() * COMMON_AVATARS.length)];

export const getUniqueRandomAvatar = (excludeAvatars: string[] = []) => {
    // Prefer COMMON avatars
    const available = COMMON_AVATARS.filter(a => !excludeAvatars.includes(a));
    if (available.length === 0) return getRandomAvatar();
    return available[Math.floor(Math.random() * available.length)];
};

export const getClasses = (): ClassGroup[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CLASSES_KEY);
  
  if (data) {
      const parsed = JSON.parse(data) as ClassGroup[];
      // Migration: Ensure cumulativeScore and isAbsent exists
      return parsed.map(c => ({
          ...c,
          students: c.students.map(s => ({
              ...s,
              cumulativeScore: s.cumulativeScore ?? s.score,
              isAbsent: s.isAbsent ?? false
          }))
      }));
  } else {
      const defaultData = parseDefaultData();
      saveClasses(defaultData);
      return defaultData;
  }
};

export const saveClasses = (classes: ClassGroup[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
};

// --- QUESTION STORAGE ---
export const getQuestions = (): Question[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveQuestions = (questions: Question[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
};

// --- VIDEO STORAGE (NEW) ---
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
            'HIGH_SCORE_20': 20,
            'HIGH_SCORE_50': 50,
            'HIGH_SCORE_100': 100,
            'HIGH_SCORE_200': 200,
            'HIGH_SCORE_500': 500,
        },
        congratulationTemplate: "Chúc mừng {name} đã đạt danh hiệu {badge}!"
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
        'HIGH_SCORE_20': 20,
        'HIGH_SCORE_50': 50,
        'HIGH_SCORE_100': 100,
        'HIGH_SCORE_200': 200,
        'HIGH_SCORE_500': 500,
    },
    congratulationTemplate: "Chúc mừng {name} đã đạt danh hiệu {badge}!"
  };

  const saved = data ? JSON.parse(data) : {};
  // Merge deep for thresholds
  return { 
      ...defaultSettings, 
      ...saved,
      gameUnlockThresholds: { ...defaultSettings.gameUnlockThresholds, ...saved.gameUnlockThresholds },
      achievementThresholds: { ...defaultSettings.achievementThresholds, ...saved.achievementThresholds }
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