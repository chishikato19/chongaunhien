

export type Gender = 'M' | 'F';

// NEW: Academic Level
export type AcademicLevel = 'GOOD' | 'FAIR' | 'PASS' | 'FAIL'; 
// Tốt | Khá | Đạt | Chưa đạt

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  avatar: string; 
  score: number; 
  cumulativeScore?: number; 
  balance?: number; 
  unlockedAvatars?: string[]; 
  tags: string[]; 
  lastPickedDate: number | null; 
  group?: string; 
  achievements?: string[]; 
  isAbsent?: boolean; 
  // NEW
  academicLevel?: AcademicLevel;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
  // NEW: Track recent picks to avoid repetition
  recentPickHistory?: string[]; 
}

export interface Video {
  id: string;
  title: string;
  url: string;
  videoId: string;
}

export enum PresentationMode {
  SIMPLE = 'SIMPLE',
  RACE = 'RACE',
  WHEEL = 'WHEEL',
  SLOT = 'SLOT',
  BOX = 'BOX',
  SPOTLIGHT = 'SPOTLIGHT',
  GRID_ELIMINATION = 'GRID_ELIMINATION',
  FLIP = 'FLIP',
  GALAXY = 'GALAXY',
  CLAW_MACHINE = 'CLAW_MACHINE', 
  LUCKY_CARDS = 'LUCKY_CARDS',
  DICE = 'DICE',
  EGG_HATCH = 'EGG_HATCH'
}

export enum SelectionLogic {
  RANDOM_INDIVIDUAL = 'RANDOM_INDIVIDUAL',
  GROUP_ROTATION = 'GROUP_ROTATION', 
  TAG_FILTER = 'TAG_FILTER',
  GENDER_ROTATION = 'GENDER_ROTATION',
  ABSOLUTE_RANDOM = 'ABSOLUTE_RANDOM'
}

export type QuestionType = 'MCQ' | 'ESSAY' | 'SEQUENCE' | 'MATCHING';
// NEW: Difficulty
export type Difficulty = 'HARD' | 'MEDIUM' | 'EASY';

export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  options?: string[]; 
  pairs?: {left: string, right: string}[]; 
  correctAnswer?: number; 
  essayAnswer?: string; 
  isAnswered?: boolean; 
  image?: string; 
  // NEW
  difficulty?: Difficulty;
}

export interface Settings {
  maxPoints: number; 
  minusPoints: number; 
  groupPoints: number; 
  groupMinusPoints: number; 
  minLuckyPoints: number;
  maxLuckyPoints: number;
  minGroupLuckyPoints: number; 
  maxGroupLuckyPoints: number; 
  spinDuration: number; 
  raceDuration: number; 
  themeColor: string;
  allowRepeats: boolean;
  soundEnabled: boolean;
  gameUnlockThresholds: {[key in PresentationMode]?: number};
  achievementThresholds: {[key: string]: number};
  congratulationTemplate: string;
  commonAvatars: string[];
  specialAvatars: string[];
  
  // NEW: Tiered Shop
  priceTiers: {
      tier1: number; // Low
      tier2: number; // Mid
      tier3: number; // High
  };
  avatarTiers: {[avatar: string]: 1 | 2 | 3}; // Map avatar char to tier

  // Deprecated but kept for compatibility logic
  avatarPrice: number; 
  
  warningSeconds: number; 
}