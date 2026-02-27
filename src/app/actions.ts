'use server'

import { 
  generateAptitudeTest, 
  generateCodingChallenge, 
  evaluateCode, 
  chatWithHR, 
  generateFinalReport 
} from '@/lib/genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function fetchAptitudeQuestions() {
  return await generateAptitudeTest(); 
}

export async function saveInterviewResult(candidateName: string, round: string, score: number, passed: boolean) {
  await addDoc(collection(db, "interview_results"), {
    candidateName,
    round,
    score,
    passed,
    timestamp: new Date().toISOString(),
  });
}

export async function fetchCodingProblem() {
  return await generateCodingChallenge();
}

// Added language parameter here
export async function submitCodeReview(problemDescription: string, userCode: string, language: string) {
  return await evaluateCode({ problemDescription, userCode, language });
}

export async function submitHrMessage(history: any[], newMessage: string) {
  return await chatWithHR({ history, newMessage });
}

export async function fetchFinalReport(aptitudeScore: number, codingFeedback: string, hrTranscript: string) {
  return await generateFinalReport({ aptitudeScore, codingFeedback, hrTranscript });
}