import { ClassGroup, Settings, PresentationMode } from '../types';

const CLASSES_KEY = 'cr_classes';
const SETTINGS_KEY = 'cr_settings';
const ACTIVE_CLASS_KEY = 'cr_active_class_id';

export const getClasses = (): ClassGroup[] => {
  const data = localStorage.getItem(CLASSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClasses = (classes: ClassGroup[]) => {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
};

export const getSettings = (): Settings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  const defaultSettings: Settings = { 
    maxPoints: 10, 
    minusPoints: 5,
    groupPoints: 20, 
    groupMinusPoints: 10,
    minLuckyPoints: 1,
    maxLuckyPoints: 5,
    minGroupLuckyPoints: 5, // Default group min
    maxGroupLuckyPoints: 15, // Default group max
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
    congratulationTemplate: "Chúc mừng {name} đã đạt danh hiệu {badge}!",
    commonAvatars: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🦓', '🦍', '🦧', '🦣', '🐘', '👱', '🟠'],
    specialAvatars: ['🦄', '🐉', '🥋', '👾', '👽', '👻', '🤖', '💩', '🤡', '👹', '👺', '🧙', '🧙‍♀️', '🧚', '🧚‍♀️', '🧛', '🧛‍♀️', '🧜', '🧜‍♀️', '🧝', '🧝‍♀️', '🧞', '🧞‍♀️', '🧟', '🧟‍♀️', '🧠', '🦾', '🦿', '👁️', '🦸', '🦹', '👮', '👮‍♀️', '👷', '👷‍♀️', '💂', '💂‍♀️', '🕵️', '🕵️‍♀️', '👩‍⚕️', '👨‍⚕️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🥷', '🎅', '🤶', '👯', '💃', '🕺', '🕴️', '🧘', '🔥', '⚡', '🌈', '☁️'],
    avatarPrice: 10,
    warningSeconds: 10,
    priceTiers: {
        tier1: 10,
        tier2: 50,
        tier3: 100
    },
    avatarTiers: {}
  };

  // Merge saved settings with defaults to handle missing keys in updates
  return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getActiveClassId = (): string | null => {
  return localStorage.getItem(ACTIVE_CLASS_KEY);
};

export const setActiveClassId = (id: string) => {
  localStorage.setItem(ACTIVE_CLASS_KEY, id);
};

// Helper for IDs (Safe for all browsers)
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Helper for avatars
export const AVATAR_POOL = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🦄'];

export const GROUP_AVATAR_POOL = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🪐', '🌍', '🌕', '🌟', '🔥', '💧', '⚡', '🌈', '🍎', '🍇', '🍉'];

export const getRandomAvatar = () => AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];