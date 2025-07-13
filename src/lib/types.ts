import {z} from 'zod';

// --- Tipos Base ---
export type SalesEntry = {
  id: string;
  date: Date;
  salesValue: number;
  ticketAverage: number;
  productsPerService: number;
};

export type UserRole = 'admin' | 'seller';

export interface BaseUser {
  id: string; // Corresponde ao UID do Firebase Auth
  name: string;
  email: string;
  role: UserRole;
}

export interface Seller extends BaseUser {
  role: 'seller';
  nickname?: string;
  salesValue: number;
  ticketAverage: number;
  pa: number;
  points: number;
  extraPoints: number;
  hasCompletedQuiz?: boolean;
  lastCourseCompletionDate?: string;
  completedCourseIds?: string[];
  workSchedule?: { [key: string]: string };
}

export interface Admin extends BaseUser {
  role: 'admin';
  nickname: string;
}

// --- Tipos de Metas e Missões ---
export type GoalLevel = {
  threshold: number;
  prize: number;
};

export type GoalLevels = {
  metinha: GoalLevel;
  meta: GoalLevel;
  metona: GoalLevel;
  lendaria: GoalLevel;
};

export type SalesValueGoals = GoalLevels & {
  performanceBonus?: {
    per: number;
    prize: number;
  };
};

export type GamificationPoints = {
  course: {
    Fácil: number;
    Médio: number;
    Difícil: number;
  };
  quiz: {
    Fácil: number;
    Médio: number;
    Difícil: number;
  };
};

export type PointsGoals = GoalLevels & {
  topScorerPrize?: number;
};

export type Goals = {
  salesValue: SalesValueGoals;
  ticketAverage: GoalLevels;
  pa: GoalLevels;
  points: PointsGoals;
  gamification: GamificationPoints;
};

export type Mission = {
  id: string;
  name: string;
  description: string;
  rewardValue: number;
  rewardType: 'points' | 'cash';
  startDate: Date;
  endDate: Date;
};

export type CycleSnapshot = {
  id: string;
  endDate: string;
  sellers: Seller[];
  goals: Goals;
}

export type Offer = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice?: number;
  promotionalPrice: number;
  startDate: Date;
  expirationDate: Date;
  isActive: boolean;
  category: string;
  productCode?: string;
  reference?: string;
  isFlashOffer?: boolean;
  isBestSeller?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

// --- Esquemas de Fluxo de IA ---

// Esquema para Gerar Quiz
export const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).min(4).max(4).describe('A list of four possible answers for the question.'),
  correctAnswerIndex: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('A brief explanation of why the correct answer is right.'),
});

export const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  numberOfQuestions: z.number().min(1).max(10).describe('The number of questions to generate.'),
  difficulty: z.enum(['Fácil', 'Médio', 'Difícil']).describe('The difficulty level for the quiz.'),
  seed: z.string().optional().describe('An optional seed for controlling randomness and uniqueness.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export const GenerateQuizOutputSchema = z.object({
  title: z.string().describe('The title of the quiz.'),
  questions: z.array(QuizQuestionSchema),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// Esquema para Gerar Curso
export const CourseQuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswerIndex: z.number(),
  explanation: z.string(),
});

export const GenerateCourseOutputSchema = z.object({
  title: z.string(),
  content: z.string(),
  quiz: z.array(CourseQuizQuestionSchema),
});
export type GenerateCourseOutput = z.infer<typeof GenerateCourseOutputSchema>;

export const GenerateCourseInputSchema = z.object({
  topic: z.string(),
  seed: z.string().optional().describe('An optional seed for controlling randomness and uniqueness.'),
  dificuldade: z.enum(['Fácil', 'Médio', 'Difícil']).optional(),
});
export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;

// --- Tipos Específicos de Componentes ---
export type Course = {
  id: string;
  title: string;
  content: string;
  quiz: QuizQuestion[];
  points: number;
  dificuldade?: 'Fácil' | 'Médio' | 'Difícil';
};

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export type QuizResult = {
  score: number;
  total: number;
  date: string;
};
