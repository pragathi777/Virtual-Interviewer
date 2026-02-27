#  TechHire AI - Virtual Interviewer

TechHire AI is a next-generation, AI-powered automated technical screening platform. Built with Next.js 16 and Google Genkit, it simulates a full, multi-stage software engineering interview process complete with proctoring, AI-generated coding challenges, and a conversational HR round.

##  Features

The application operates as a state machine, moving candidates through four distinct phases:

* ** Phase 1: Secure Environment & Proctoring**
    * Candidate login and onboarding.
    * Live webcam and microphone feed integration.
    * Anti-cheat tab-switching detection (Proctor Strikes).
* ** Phase 2: Aptitude Round**
    * Dynamically generated Multiple Choice Questions (Quantitative, Logical, Verbal) via Gemini 2.5 Flash.
    * Strict JSON schema parsing ensures perfect UI rendering.
    * Auto-grading with a 70% passing threshold to advance.
* ** Phase 3: Coding Sandbox (LeetCode Style)**
    * AI-generated Data Structures and Algorithms (DSA) problems.
    * Integrated Monaco Editor (the engine behind VS Code) with syntax highlighting.
    * AI Code Compiler: Evaluates the candidate's logic, edge cases, and provides a score out of 100.
* ** Phase 4: HR Interview & Final Report**
    * Real-time chat interface with an AI HR Manager evaluating cultural/behavioral fit.
    * **Final Report Generation:** AI digests the aptitude score, coding feedback, and HR transcript to generate a structured evaluation (Strengths, Weaknesses, Verdict, and Summary).
    * Data persistence to Firebase Firestore.

##  Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **AI Framework:** [Google Genkit](https://firebase.google.com/docs/genkit) (`@genkit-ai/google-genai`)
* **Model:** Gemini 2.5 Flash (`gemini-2.5-flash`)
* **Database:** Firebase Firestore
* **UI Components:**  react-webcam (Proctoring)
    * @monaco-editor/react (Code Sandbox)
    * lucide-react (Icons)

##  Prerequisites

Before you begin, ensure you have the following:
1.  **Node.js** (v18 or higher recommended)
2.  **Google Cloud / AI Studio Account** with billing enabled (to access Gemini 2.5 Flash quotas).
3.  **Firebase Project** set up with Firestore Database enabled.

##  Installation & Setup

**1. Clone the repository (if applicable) and navigate to the project directory:**
bash

cd virtual-interviewer

**2. Install all dependencies:**

Bash

npm install
npm install @genkit-ai/google-genai genkit
npm install lucide-react react-webcam @monaco-editor/react

**3. Set up Environment Variables:**
Create a .env.local file in the root of your project and add your API keys:

Code snippet
## Google Gemini API Key (Generate via Google AI Studio)
GOOGLE_GEN_AI_API_KEY="AIzaSyYourKeyHere..."

## Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="12345678"
NEXT_PUBLIC_FIREBASE_APP_ID="1:12345:web:abcde"


##  Running the Application
Start the Next.js development server using Turbopack:

Bash

npm run dev

Open http://localhost:3000 in your browser to start interviewing!
