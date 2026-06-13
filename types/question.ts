export type QuestionMood =
  | "nerdig"
  | "philosophisch"
  | "moralisch"
  | "lustig"
  | "absurd"
  | "emotional"
  | "unangenehm"
  | "sci-fi"
  | "dating"
  | "alltag"
  | "hart";

export interface QuestionStats {
  optionA: number;
  optionB: number;
}

export interface Question {
  id: string;
  categoryId: string;
  question: string;
  optionA: string;
  optionB: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  discussionPotential: 1 | 2 | 3 | 4 | 5;
  moods: QuestionMood[];
  followUp: string;
  reflectionA: string;
  reflectionB: string;
  isPremium: boolean;
  isActive: boolean;
  stats: QuestionStats;
}
