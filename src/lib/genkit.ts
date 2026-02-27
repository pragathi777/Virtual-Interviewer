import 'server-only';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GEN_AI_API_KEY })],
});

// 1. Define the strict JSON structure for our MCQs
const QuestionSchema = z.object({
  id: z.string(),
  category: z.string().describe("Quantitative, Logical, or Verbal"),
  questionText: z.string(),
  options: z.array(z.string()).length(4).describe("Exactly 4 options"),
  correctAnswer: z.string().describe("Must match one of the options exactly"),
});

// 2. Define the flow that generates the test
export const generateAptitudeTest = ai.defineFlow(
  {
    name: 'generateAptitudeTest',
    inputSchema: z.void(), 
    outputSchema: z.array(QuestionSchema), 
  },
  async () => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Generate exactly 5 challenging multiple-choice questions for a Software Engineering Aptitude Test. 
      Include a mix of Quantitative Aptitude, Logical Reasoning, and Verbal reasoning.
      Make them moderately difficult. Do not use markdown blocks, only return the JSON.`,
      output: { schema: z.array(QuestionSchema) } 
    });
    
    // FIX: Removed the parentheses. It is a property, not a method.
    return response.output; 
  }
); 

// 3. Schema for generating the coding problem
const CodingProblemSchema = z.object({
  title: z.string(),
  description: z.string().describe("Detailed problem statement with examples"),
  initialCode: z.string().describe("Starting template, e.g., 'function solve() { // write code here }'"),
});

// 4. Flow to generate the problem
export const generateCodingChallenge = ai.defineFlow(
  {
    name: 'generateCodingChallenge',
    inputSchema: z.void(),
    outputSchema: CodingProblemSchema,
  },
  async () => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Generate a medium-difficulty Data Structures and Algorithms coding interview question. 
      Do NOT output markdown blocks. Return only JSON matching the schema.`,
      output: { schema: CodingProblemSchema }
    });
    
    // FIX
    return response.output; 
  }
);

// 5. Schema for AI evaluation
const CodeEvaluationSchema = z.object({
  score: z.number().describe("Score out of 100 based on correctness and efficiency"),
  feedback: z.string().describe("Short explanation of what works or what failed"),
  passed: z.boolean().describe("True if score is 70 or higher"),
});

// 6. Flow to act as the compiler/reviewer
export const evaluateCode = ai.defineFlow(
  {
    name: 'evaluateCode',
    inputSchema: z.object({ problemDescription: z.string(), userCode: z.string() }),
    outputSchema: CodeEvaluationSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `You are an expert technical interviewer. Review this candidate's code for the following problem:
      Problem: ${input.problemDescription}
      Candidate Code: ${input.userCode}
      
      Does this code correctly solve the problem? Evaluate for edge cases and logic.
      Return the evaluation in pure JSON.`,
      output: { schema: CodeEvaluationSchema }
    });
    
    // FIX
    return response.output; 
  }
);
// ... (Keep ALL your Phase 1, 2, and 3 code above this)

// 7. Flow for the HR Chat conversation
export const chatWithHR = ai.defineFlow(
  {
    name: 'chatWithHR',
    inputSchema: z.object({
      history: z.array(z.object({ role: z.string(), content: z.string() })),
      newMessage: z.string()
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // We format the history so Gemini knows what was already said
    const conversationContext = input.history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
    
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `You are an empathetic but professional HR Manager conducting the final interview round.
      Here is the conversation so far:
      ${conversationContext}
      
      The candidate just said: "${input.newMessage}"
      
      Respond to the candidate. Ask exactly ONE behavioral or cultural fit question. 
      Keep your response under 3 sentences. Be conversational.`,
    });
    
    return response.text; 
  }
);

// 8. Schema for the Final AI Report
const ReportSchema = z.object({
  overallScore: z.number().describe("Final score out of 100 based on all rounds"),
  strengths: z.array(z.string()).describe("3-4 key strengths shown by the candidate"),
  weaknesses: z.array(z.string()).describe("1-2 areas for improvement"),
  verdict: z.enum(['Strong Hire', 'Hire', 'No Hire']).describe("Final hiring decision"),
  summary: z.string().describe("A 2-sentence executive summary of the candidate's performance.")
});

// 9. Flow to generate the Final Report
export const generateFinalReport = ai.defineFlow(
  {
    name: 'generateFinalReport',
    inputSchema: z.object({
      aptitudeScore: z.number(),
      codingFeedback: z.string(),
      hrTranscript: z.string()
    }),
    outputSchema: ReportSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `You are the Lead Technical Recruiter. Review this candidate's entire file and generate a final JSON report:
      
      1. Aptitude Round Score: ${input.aptitudeScore}%
      2. Coding Round Feedback: ${input.codingFeedback}
      3. HR Interview Transcript:
      ${input.hrTranscript}
      
      Analyze their technical skills, problem-solving, and cultural fit. Return ONLY JSON matching the schema.`,
      output: { schema: ReportSchema }
    });
    
    return response.output;
  }
);