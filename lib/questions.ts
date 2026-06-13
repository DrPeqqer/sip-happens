import questionsData from "@/data/questions.json";
import type { Question } from "@/types/question";

const questions = questionsData as Question[];

export function getActiveQuestions() {
  return questions.filter((question) => question.isActive);
}

export function getQuestionById(questionId: string | null | undefined) {
  if (!questionId) {
    return null;
  }

  return questions.find((question) => question.id === questionId && question.isActive) ?? null;
}

export function getRandomQuestion(excludeIds: string[] = []) {
  const availableQuestions = getActiveQuestions().filter((question) => !excludeIds.includes(question.id));

  if (availableQuestions.length === 0) {
    return null;
  }

  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}
