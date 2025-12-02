
import { ClassGroup, Settings } from '../types';

const CLASSES_KEY = 'cr_classes';
const SETTINGS_KEY = 'cr_settings';
const ACTIVE_CLASS_KEY = 'cr_active_class_id';

export const getClasses = (): ClassGroup[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CLASSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClasses = (classes: ClassGroup[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
};

export const getSettings = (): Settings => {
  if (typeof window === 'undefined') {
      return { 
        maxPoints: 10, 
        groupPoints: 20, 
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
    groupPoints: 20, 
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

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const AVATAR_POOL = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🦄'];

export const GROUP_AVATAR_POOL = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🪐', '🌍', '🌕', '🌟', '🔥', '💧', '⚡', '🌈', '🍎', '🍇', '🍉'];

export const getRandomAvatar = () => AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
