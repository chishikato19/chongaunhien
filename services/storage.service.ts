
import { ClassGroup, Settings, Student, Question } from '../types';

const CLASSES_KEY = 'cr_classes';
const SETTINGS_KEY = 'cr_settings';
const ACTIVE_CLASS_KEY = 'cr_active_class_id';
const QUESTIONS_KEY = 'cr_questions';
const CLOUD_URL_KEY = 'cr_cloud_url'; // NEW KEY

// --- CHANGELOG ---
export const CHANGELOG = [
    {
        version: "1.5",
        date: "2024-05-23",
        changes: [
            "Bổ sung tính năng 'Cloud Sync': Đồng bộ dữ liệu với Google Sheets.",
            "Cho phép lưu trữ và tải dữ liệu từ đám mây để sử dụng trên nhiều thiết bị.",
            "Hỗ trợ nhập hình ảnh vào câu hỏi thông qua đường dẫn (URL) hoặc tải lên (Base64).",
            "Sửa lỗi và tối ưu hóa hiệu năng."
        ]
    },
    {
        version: "1.4",
        date: "2024-05-22",
        changes: [
            "Bổ sung Hệ thống Hướng dẫn sử dụng chi tiết (Tổng quan, Nhập liệu, Luật chơi).",
            "Cải thiện trải nghiệm trả lời câu hỏi: Dừng 1.5s để xem kết quả Đúng/Sai.",
            "Thêm hệ thống thông báo (Toast) thân thiện thay cho hộp thoại cảnh báo cũ.",
            "Nâng cấp giao diện người dùng và tối ưu hóa hiệu năng."
        ]
    },
    {
        version: "1.3",
        date: "2024-05-21",
        changes: [
            "Thêm tính năng nhập thủ công chi tiết cho câu hỏi trắc nghiệm (Tùy chọn A, B, C, D).",
            "Logic câu hỏi: Không lặp lại câu hỏi đã trả lời đúng.",
            "Luồng trả lời: Sau khi trả lời xong sẽ quay lại màn hình cộng điểm thay vì thoát ra.",
            "Thêm nút Reset trạng thái câu hỏi.",
            "Hiển thị số phiên bản và lịch sử cập nhật."
        ]
    },
    {
        version: "1.2",
        date: "2024-05-20",
        changes: [
            "Thêm chế độ 'Trứng nở' (Egg Hatch) với hiệu ứng chim Bồ nông.",
            "Cập nhật chế độ 'Quay số' (Slot Machine 2 ô) có delay.",
            "Cải thiện giao diện 5 lá bài và Gắp thú.",
            "Thêm danh sách dữ liệu mẫu lớn (6a1 - 9a3)."
        ]
    },
    {
        version: "1.1",
        date: "2024-05-19",
        changes: [
            "Thêm chế độ Gắp thú (Claw Machine) và 5 Lá bài.",
            "Bổ sung 50+ biểu tượng (Anime, Fantasy, Nghề nghiệp).",
            "Sửa lỗi hiển thị trên Tablet.",
            "Thêm cài đặt điểm trừ riêng biệt."
        ]
    },
    {
        version: "1.0",
        date: "2024-05-18",
        changes: [
            "Ra mắt ứng dụng chọn học sinh ngẫu nhiên.",
            "Hỗ trợ các chế độ: Đua xe, Vòng quay, Hộp quà...",
            "Quản lý lớp học và điểm số."
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
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.result === 'success') {
            return { success: true, message: 'Đã lưu lên Google Sheet thành công!' };
        } else {
             return { success: false, message: 'Lỗi từ Google Script: ' + JSON.stringify(result) };
        }
    } catch (error: any) {
        return { success: false, message: 'Lỗi mạng: ' + error.message };
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
6a1:
An
Anh
Ánh
Bạch
Bảo
Bích
Bin
Bình
Chi
Công
Dân
Doanh
Dương
Đan
Đậu
Hạ
Hân
Hiếu
Hoài
K'dung
Long
Luân
Ly
Nam
Ngân
Ngọc
Nhi
Như
Ny
Phúc
Quỳnh
Sim
Thịnh
Trâm
Tú
Tuân
Vượng
6a2:
Sô Phi A
An
Anh
Châu
Chuyên
Công
Cường
Danh
Dua
Giáp
Hàn
Hân
K'Hoan
Ngọc Hoan
Hơn
Khuynh
Lam
Lên
Linh
My
Q.Nghĩa
T.Nghĩa
Ngọc
Nhung
Nhuy
Nim
Phong
Quốc
Sun
Thảo
Thư
Trâm
Trí
Tuấn
Ý
Yến
6a3:
Đan
Đăng
Huân
Khoa
Kiên
Ni Kô
Rô La
Lay
Linh
K' Lộc
H.Lộc
My
Ngân
Nghiệp
B.Ngọc
Y.Ngọc
Nhơn
Như
Nô
Ny
Oanh
Phát
Quỳnh
Tâm
Thành
Thiêm
Trâm
Trọng
Tuân
Vũ
Vy
Ý
My Ya
6a4:
Di
Duy
Đức
Huyền
Khang
Khin
Ni La
Lân
Linh
Lợi
Ly
Nghi
Nghoanh
Nhiên
Như
Ha Sa Ny
Phan
Phương
Quân
Sơn
T.Thanh
N.Thanh
N.Thiện
T.Thiện
Thịnh
Thượng
Tiên
Tiến
Toàn
Trâm
Trân
Tú
T.Vi
S.Vi
Yến
6a5:
Ân
Bren Da
Đức
Giang
B.Hân
Phạm Hân
Phan Hân
Hiền
Hồng
Khánh
Ly
Ja Mi
Rê Mi
My
Ngọc
H.Phong
Đ.Phong
Phô
M.Quân
A.Quân
Quyên
Si
Thắng
Thọ
Thy
Tiên
Tin
Tịnh
Trâm
Trân
Trung
Vinh
Vy
Win
Ý
Yến
7a1:
Ái
Bảo
Bi
Công
Diệp
Diêu
L.Đan
K.Đan
Giang
Giễm
Hiếu
Hoàng
Hương
K'Kent
K'Kha
K'Lễ
K'Nguyên
K'Phai
K'Phấn
Khang
Khôi
Ly
Lý
Minh
Nam
Nét
Nghiêm
Nhân
Nhật
Nhi
Pa
Phia
Phương
Quỳ
Quý
Sang
Thắng
Thư
Thức
Trân
Trường
Tuyền
Vin
Wa
7a2:
Đỗ Anh
Huy Anh
Hà Anh
Ân
Băng
Dung
Giang
Hiếu
Hòa
Hue
Hùng
K'Đào
K'Hiển
K'Hồng
K'July
K'Kha
K'Nhuil
K'Thuỷ
Khải
Khang
Kô
La
Long
Luân
Ly
Mai
Đ.Nam
V.Nam
Ngọc
Nụ
Phong
Quyên
Ran
Ri
Suy
Tài
Tâm
Thảo
Tiên
Toàn
Trung
Trường
Tuấn
Tuyết
7a3:
Diệu
Đan
Hạnh
Hiếu
Hoàng
Huy
Huyền
K'Bình
K'Gian
K'Hải
K'Thoen
K'Thư
K'Tuấn
Khải
Khánh
Khoa
Kiệt
Long
Luân
Luận
B.My
D.My
Mỹ
Nam
Ne
Nhân
Nhi
N.Như
T.Như
Phia
Phong
Quỳnh
Sim
Thành
Thia
Thiện
Trang
Thị Trâm
Trần Trâm
Trúc
Việt
Vĩnh
Ý
7a4:
An
Anh
Bình
Dũ
Duyên
Đạt
Đức
Hiếu
Hoàng
In
K'Danh
K'Mỵ
K'Ngọc
K'Ngọc
K'Nhiên
K'Xuyến
Kiên
Linh
Lôs
P.Nam
T.Nam
B.Ngân
K.Ngân
Ngọc
Nguyên
Nhung
Như
Ny
Oanh
Quí
Rôn
Thảo
B.Thy
Đ.Thy
Trang
Trung
Tùng
K.Tuyết
A.Tuyết
Uyên
Va
Vy
N.Ý
T.Ý
8a1:
Bảo
Belly
Chô
Cường
Duy
Hóa
Huế
Hưng
Hương
K'Bin
K'Khởi
K'Thượng
Khôi
Kônk
La
N.Linh
D.Linh
Luân
My
Nam
Khánh Ngân
Kim Ngân
Ngọc
Nguyên
Nguynh
Phong
Quân
Quốc
Thành
Thảo
Thuỳ
A.Thư
U.Thư
Thy
Tín
Tới
Trà
Trâm
Trân
Uyên
Vi
Vĩ
Vũ
Vy
8a2:
Ánh
Bình
Diệu
Duy
Dương
Hà
Hân
Hiền
Hiếu
Huy
Hưng
K'Thuỳ
K'Vy
Khanh
Khoa
Linh
T.Lộc
M.Lộc
K.Ngân
B.Ngân
Nghiền
Ngọc
Y.Nguyên
B.Nguyên
B.Nhi
T.Nhi
Phi
N.Phú
Q.Phú
Phúc
Quân
Tâm
Thơ
Thu
Thư
Thy
Tiên
Trân
Trúc
Truyền
Úk
Vinh
Vĩnh
Vương
8a3:
An
Cương
Cường
Dũng
Giang
Hà
Hy
K'Hậu
K'Hiệp
K'Khôi
K'Phương
K'Thành
K'Thi
Ka
Kiên
T.Linh
M.Linh
Luân
My
Ngọc
Nguyên
Nhất
Nhật
T.Pháp
A.Pháp
Phép
Phú
Phúc
Q.Phước
D.Phước
Quế
Quyên
Thảo
Thùy
B.Trân
K.Trân
L.Trúc
T.Trúc
Văn
Vi
Vĩ
Vinh
Vỹ
8a4:
Anh
Bảo
Duyên
Đăng
Hân
Hô
Hồng
Hun
Huyền
K'Hạ
K'Trúc
Khải
Khang
Đ.Long
P.Long
Minh
H.My
A.My
Na
T.Nam
B.Nam
Ngân
Nguyên
Nhi
Nin
Ny
Oanh
T.Phong
N.Phong
Quân
N.Quyên
H.Quyên
Si
Thành
Thảo
Thông
Thy
Tiến
Tú
Tuyết
Tường
Vân
N.Vy
T.Vy
9a1:
Châu Anh
Tuấn Anh
Trâm Anh
Ân
T.Bảo
G.Bảo
Bi
Bình
L.Châu
T.Châu
Chi
Diệp
Đan
Đạt
Gia
Hân
Hoàng
Huấn
Hùng
K'Đăng
K'Nghị
K'Nghĩa
T.Khang
S.Khang
Khí
Kiệt
Ký
Mi
My
Ngân
Ngọc
Nguyễn
Y.Nhi
L.Nhi
Nhủ
Nhựt
Ô
Phát
Phúc
Phước
Sang
Sy
Tâm
Thành
Thảo
Trang
Vũ
9a2:
T.Anh
Q.Anh
H.Bảo
Q.Bảo
Châu
Đa
Đông
Gô
Hoa
Hùng
Jơn
K'Hưng
K'Nga
K'Quyên
Khôi
K' Linh
P.Linh
Mạnh
T.Minh
Q.Minh
D.My
Đơ My
K.My
Na
Nam
B.Ngân
T.Ngân
Nhi
Nis
Ny
Oanh
Phi
Mai Phương
Minh Phương
Quân
Quốc
Quyên
Ra
Soan
Sương
Tâm
Trâm
Va
Viên
9a3:
Anh
Ánh
Âu
Châu
Cường
Đan
Hồng
Jon
K'Khôi
K'Thiện
K'Thoan
K'Thoen
K'Toán
Khanh
Khánh
Kiệt
Long
Luân
Nam
Nga
Kim Ngân
K' Ngân
Nguyên
Nhi
Phát
Phong
Quý
Tây
Thảo
Thắng
Thĩ
Thủy
Trâm
Trí
Trúc
Tú
Tuấn
Tường
N.Uyên
K.Uyên
Vân
Vi
T.Vy
Y.Vy
H.Vy
`;

const parseDefaultData = (): ClassGroup[] => {
    const lines = DEFAULT_RAW_DATA.split('\n');
    const classes: ClassGroup[] = [];
    let currentClass: ClassGroup | null = null;
    
    const usedAvatarsInClass = new Set<string>();
    
    const getUniqueForParse = () => {
        const available = AVATAR_POOL.filter(a => !usedAvatarsInClass.has(a));
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
            currentClass.students.push({
                id: generateId(),
                name: trimmed,
                gender: 'M',
                avatar: getUniqueForParse(),
                score: 0,
                tags: [],
                lastPickedDate: null,
                group: ''
            });
        }
    });
    return classes;
};
// --- DATA INJECTION END ---


export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const AVATAR_POOL = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', 
  '🦅', '🦉', '🦇', '🐺', '🐗', '🦄', '🐝', '🐛', '🦋', '🐌', 
  '🐞', '🐜', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', 
  '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', 
  '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘',
  '🥋', '🐉', '☁️', '🔥', '👱', '🟠',
  '👾', '👽', '👻', '🤖', '💩', '🤡', '👹', '👺', 
  '🧙', '🧙‍♀️', '🧚', '🧚‍♀️', '🧛', '🧛‍♀️', '🧜', '🧜‍♀️', '🧝', '🧝‍♀️',
  '🧞', '🧞‍♀️', '🧟', '🧟‍♀️', '🧠', '🦾', '🦿', '👁️', '🦸', '🦹',
  '👮', '👮‍♀️', '👷', '👷‍♀️', '💂', '💂‍♀️', '🕵️', '🕵️‍♀️', '👩‍⚕️', '👨‍⚕️',
  '👨‍🌾', '👩‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭',
  '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨',
  '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵',
  '👸', '🤴', '🥷', '🎅', '🤶', '👯', '💃', '🕺', '🕴️', '🧘'
];

export const GROUP_AVATAR_POOL = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🪐', '🌍', '🌕', '🌟', '🔥', '💧', '⚡', '🌈', '🍎', '🍇', '🍉'];

export const getRandomAvatar = () => AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];

export const getUniqueRandomAvatar = (excludeAvatars: string[] = []) => {
    const available = AVATAR_POOL.filter(a => !excludeAvatars.includes(a));
    if (available.length === 0) return getRandomAvatar();
    return available[Math.floor(Math.random() * available.length)];
};

export const getClasses = (): ClassGroup[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CLASSES_KEY);
  
  if (data) {
      return JSON.parse(data);
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
        soundEnabled: true
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
    soundEnabled: true
  };

  return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
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
