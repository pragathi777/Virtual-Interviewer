import 'server-only';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GEN_AI_API_KEY })],
});

// 1. Aptitude Schema & Flow
const QuestionSchema = z.object({
  id: z.string(),
  category: z.string().describe("Quantitative, Logical, or Verbal"),
  questionText: z.string(),
  options: z.array(z.string()).length(4).describe("Exactly 4 options"),
  correctAnswer: z.string().describe("Must match one of the options exactly"),
});

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
    return response.output; 
  }
); 

// 2. CODING SCHEMA UPDATED FOR LEETCODE STYLE
const CodingProblemSchema = z.object({
  title: z.string(),
  description: z.string().describe("Clear problem statement without examples."),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional()
  })).describe("2 to 3 test case examples"),
  constraints: z.array(z.string()).describe("Technical constraints (e.g., 1 <= nums.length <= 10^4)"),
  starterCode: z.object({
    javascript: z.string(),
    python: z.string(),
    java: z.string(),
    cpp: z.string()
  }).describe("Starter function templates for each language")
});

export const generateCodingChallenge = ai.defineFlow(
  {
    name: 'generateCodingChallenge',
    inputSchema: z.void(),
    outputSchema: CodingProblemSchema,
  },
  async () => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Generate an Easy-difficulty Data Structures and Algorithms coding interview question (similar to LeetCode Easy). 
      Provide standard inputs/outputs, constraints, and starting code templates for JavaScript, Python, Java, and C++.
      Return ONLY JSON matching the schema.`,
      output: { schema: CodingProblemSchema }
    });
    return response.output; 
  }
);

// 3. CODE EVALUATION UPDATED FOR MULTI-LANGUAGE
const CodeEvaluationSchema = z.object({
  score: z.number().describe("Score out of 100 based on correctness and efficiency"),
  feedback: z.string().describe("Short explanation of what works or what failed"),
  passed: z.boolean().describe("True if score is 70 or higher"),
});

export const evaluateCode = ai.defineFlow(
  {
    name: 'evaluateCode',
    // Added 'language' to inputSchema so AI knows how to compile it
    inputSchema: z.object({ problemDescription: z.string(), userCode: z.string(), language: z.string() }),
    outputSchema: CodeEvaluationSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `You are an expert technical interviewer. Review this candidate's ${input.language} code for the following problem:
      Problem: ${input.problemDescription}
      Candidate Code: ${input.userCode}
      
      Does this code correctly solve the problem? Evaluate for edge cases, logic, and syntax for ${input.language}.
      Return the evaluation in pure JSON.`,
      output: { schema: CodeEvaluationSchema }
    });
    return response.output; 
  }
);

// 4. HR Chat & Report
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
    const conversationContext = input.history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `You are an empathetic but professional HR Manager.
      Conversation so far:
      ${conversationContext}
      
      Candidate just said: "${input.newMessage}"
      Respond with exactly ONE behavioral question. Keep it under 3 sentences.`,
    });
    return response.text; 
  }
);

const ReportSchema = z.object({
  overallScore: z.number().describe("Final score out of 100"),
  strengths: z.array(z.string()).describe("3-4 key strengths"),
  weaknesses: z.array(z.string()).describe("1-2 areas for improvement"),
  verdict: z.enum(['Strong Hire', 'Hire', 'No Hire']).describe("Final hiring decision"),
  summary: z.string().describe("A 2-sentence executive summary.")
});

export const generateFinalReport = ai.defineFlow(
  {
    name: 'generateFinalReport',
    inputSchema: z.object({ aptitudeScore: z.number(), codingFeedback: z.string(), hrTranscript: z.string() }),
    outputSchema: ReportSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Review this candidate's entire file and generate a final JSON report:
      1. Aptitude Score: ${input.aptitudeScore}%
      2. Coding Feedback: ${input.codingFeedback}
      3. HR Transcript:\n${input.hrTranscript}
      Return ONLY JSON matching the schema.`,
      output: { schema: ReportSchema }
    });
    return response.output;
  }
);