'use server'

import { generateAptitudeTest } from '@/lib/genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function fetchAptitudeQuestions() {
  // Calls the Genkit flow and returns the guaranteed JSON array
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

// ... (Keep your existing fetchAptitudeQuestions and saveInterviewResult above this)
import { generateCodingChallenge, evaluateCode } from '@/lib/genkit';

export async function fetchCodingProblem() {
  return await generateCodingChallenge();
}

export async function submitCodeReview(problemDescription: string, userCode: string) {
  return await evaluateCode({ problemDescription, userCode });
}
// ... (Keep all previous exports)
import { chatWithHR, generateFinalReport } from '@/lib/genkit';

export async function submitHrMessage(history: any[], newMessage: string) {
  return await chatWithHR({ history, newMessage });
}

export async function fetchFinalReport(aptitudeScore: number, codingFeedback: string, hrTranscript: string) {
  return await generateFinalReport({ aptitudeScore, codingFeedback, hrTranscript });
}