
export type Gender = 'M' | 'F';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  avatar: string; // Emoji char
  score: number;
  tags: string[]; // e.g., 'absent', 'answered'
  lastPickedDate: number | null; // Timestamp
  group?: string; // Group name (e.g., "Group 1")
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
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
  GROUP_ROTATION = 'GROUP_ROTATION', // Simulated by picking least picked
  TAG_FILTER = 'TAG_FILTER',
  GENDER_ROTATION = 'GENDER_ROTATION',
  ABSOLUTE_RANDOM = 'ABSOLUTE_RANDOM'
}

// --- NEW QUESTION TYPES ---
export type QuestionType = 'MCQ' | 'ESSAY';

export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  options?: string[]; // Only for MCQ
  correctAnswer?: number; // Index of correct option (0, 1, 2...) for MCQ
  essayAnswer?: string; // Teacher notes for essay
  isAnswered?: boolean; // Track if question has been used
}

export interface Settings {
  maxPoints: number; // Individual standard points
  minusPoints: number; // Individual penalty points
  groupPoints: number; // Group standard points
  groupMinusPoints: number; // Group penalty points
  minLuckyPoints: number;
  maxLuckyPoints: number;
  minGroupLuckyPoints: number; // NEW: Group lucky min
  maxGroupLuckyPoints: number; // NEW: Group lucky max
  spinDuration: number; // Standard duration
  raceDuration: number; // Race mode duration (usually longer)
  themeColor: string;
  allowRepeats: boolean;
  soundEnabled: boolean;
}