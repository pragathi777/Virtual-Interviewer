'use client'

import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import Editor from '@monaco-editor/react';
import { AlertTriangle, Code, User, Loader2, Play, Send, CheckCircle, XCircle, Award } from 'lucide-react';
import { 
  fetchAptitudeQuestions, 
  saveInterviewResult, 
  fetchCodingProblem, 
  submitCodeReview,
  submitHrMessage,
  fetchFinalReport
} from './actions';

type AppStage = 'login' | 'aptitude' | 'coding' | 'hr' | 'report' | 'failed';

export default function InterviewApp() {
  const [stage, setStage] = useState<AppStage>('login');
  const [candidateName, setCandidateName] = useState('');
  const [proctorStrikes, setProctorStrikes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Aptitude State
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [finalAptitudeScore, setFinalAptitudeScore] = useState(0);

  // Coding State
  const [codingProblem, setCodingProblem] = useState<any>(null);
  const [userCode, setUserCode] = useState('');
  const [evalResult, setEvalResult] = useState<any>(null);

  // HR State
  const [hrMessages, setHrMessages] = useState<{role: string, content: string}[]>([
    { role: 'model', content: "Hello! I'm the AI HR Manager. Congratulations on passing the technical rounds. To start, could you tell me about a time you had to learn a new technology quickly under pressure?" }
  ]);
  const [currentHrInput, setCurrentHrInput] = useState('');
  
  // Report State
  const [finalReport, setFinalReport] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hrMessages]);

  // Proctoring Engine
  useEffect(() => {
    if (['login', 'report', 'failed'].includes(stage)) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorStrikes((prev) => prev + 1);
        alert("WARNING: Tab switching detected. Violation recorded.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stage]);

  // --- APTITUDE LOGIC ---
  const startAptitudeTest = async () => {
    setIsLoading(true);
    const qs = await fetchAptitudeQuestions();
    setQuestions(qs);
    setIsLoading(false);
  };

  const submitAptitudeTest = async () => {
    let correctCount = 0;
    questions.forEach((q) => { if (selectedAnswers[q.id] === q.correctAnswer) correctCount++; });
    const score = (correctCount / questions.length) * 100;
    setFinalAptitudeScore(score);
    
    if (score >= 70) {
      alert("Aptitude Passed! Moving to Coding Round.");
      startCodingRound();
    } else {
      setStage('failed');
    }
  };

  // --- CODING LOGIC ---
  const startCodingRound = async () => {
    setStage('coding');
    setIsLoading(true);
    const problem = await fetchCodingProblem();
    setCodingProblem(problem);
    setUserCode(problem.initialCode);
    setIsLoading(false);
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    const result = await submitCodeReview(codingProblem.description, userCode);
    setEvalResult(result);
    setIsLoading(false);

    if (result.passed) {
      setTimeout(() => {
        alert("Coding Round Passed! Moving to HR Interview.");
        setStage('hr');
      }, 3000);
    }
  };

  // --- HR LOGIC ---
  const handleSendHrMessage = async () => {
    if (!currentHrInput.trim()) return;
    
    const newHistory = [...hrMessages, { role: 'user', content: currentHrInput }];
    setHrMessages(newHistory);
    setCurrentHrInput('');
    setIsLoading(true);

    try {
      const response = await submitHrMessage(hrMessages, currentHrInput);
      setHrMessages([...newHistory, { role: 'model', content: response }]);
    } catch (e) {
      console.error(e);
      alert("Failed to send message.");
    }
    setIsLoading(false);
  };

  // --- REPORT LOGIC ---
  const finishInterview = async () => {
    setStage('report');
    setIsLoading(true);
    
    const hrTranscript = hrMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    const report = await fetchFinalReport(finalAptitudeScore, evalResult?.feedback || "No feedback", hrTranscript);
    
    setFinalReport(report);
    // Save to Firebase (Optional, uses your Phase 1/2 logic)
    await saveInterviewResult(candidateName, "Final", report.overallScore, report.verdict !== 'No Hire');
    setIsLoading(false);
  };


  // --- UI RENDERING ---
  if (stage === 'login') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">TechHire AI</h1>
          <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter Full Name" />
          <button disabled={!candidateName} onClick={() => setStage('aptitude')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 rounded-lg font-bold transition">Start Proctored Interview</button>
        </div>
      </main>
    );
  }

  if (stage === 'failed') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-red-900/50">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400">Threshold Not Met</h1>
          <p className="text-zinc-400 mt-2">Thank you for your time, but you did not pass the required threshold.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* HEADER */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center z-10">
        <h2 className="font-bold text-blue-400">TechHire AI | Candidate: {candidateName}</h2>
        <div className="flex items-center gap-6">
          {proctorStrikes > 0 && <span className="text-red-400 font-bold"><AlertTriangle className="w-4 h-4 inline"/> Strikes: {proctorStrikes}</span>}
          {stage !== 'report' && (
            <div className="w-24 h-16 bg-black rounded overflow-hidden border border-zinc-700">
               <Webcam audio={true} muted={true} width="100%" height="100%" />
            </div>
          )}
        </div>
      </header>

      {/* STAGES */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* APTITUDE */}
        {stage === 'aptitude' && (
          <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Round 1: Aptitude Test</h2>
              {questions.length === 0 ? (
                <button onClick={startAptitudeTest} className="px-8 py-3 bg-blue-600 rounded-lg font-bold">{isLoading ? "Generating..." : "Generate Test"}</button>
              ) : (
                <div className="space-y-6">
                  <p className="text-lg">{questions[currentQIndex].questionText}</p>
                  <div className="grid gap-3">
                    {questions[currentQIndex].options.map((opt: string, idx: number) => (
                      <button key={idx} onClick={() => setSelectedAnswers(p => ({ ...p, [questions[currentQIndex].id]: opt }))}
                        className={`p-4 text-left rounded-lg border transition ${selectedAnswers[questions[currentQIndex].id] === opt ? 'bg-blue-900/40 border-blue-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4">
                    {currentQIndex < questions.length - 1 
                      ? <button disabled={!selectedAnswers[questions[currentQIndex].id]} onClick={() => setCurrentQIndex(i => i + 1)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 rounded-lg">Next Question</button>
                      : <button disabled={!selectedAnswers[questions[currentQIndex].id]} onClick={submitAptitudeTest} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold">Submit Assessment</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CODING */}
        {stage === 'coding' && (
          <div className="flex-1 flex gap-4 p-4 h-full">
            <div className="w-1/3 bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col overflow-y-auto">
              {!codingProblem ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-400"><Loader2 className="w-8 h-8 animate-spin mb-4" /><p>Generating challenge...</p></div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">{codingProblem.title}</h2>
                  <div className="text-zinc-300 space-y-2">{codingProblem.description.split('\n').map((l:string, i:number) => <p key={i}>{l}</p>)}</div>
                  {evalResult && (
                    <div className={`mt-8 p-4 rounded-lg border ${evalResult.passed ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                      <h3 className={`font-bold ${evalResult.passed ? 'text-green-400' : 'text-red-400'}`}>{evalResult.passed ? 'Pass' : 'Fail'} (Score: {evalResult.score}/100)</h3>
                      <p className="text-sm mt-2">{evalResult.feedback}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="w-2/3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
              <div className="bg-zinc-950 p-2 flex justify-between items-center border-b border-zinc-800">
                <span className="text-sm font-mono text-zinc-400 px-4">solution.js</span>
                <button onClick={handleRunCode} disabled={isLoading || !codingProblem} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 rounded text-sm font-bold">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Code
                </button>
              </div>
              <Editor height="100%" defaultLanguage="javascript" theme="vs-dark" value={userCode} onChange={(v) => setUserCode(v || '')} options={{ minimap: { enabled: false }, fontSize: 16 }} />
            </div>
          </div>
        )}

        {/* HR CHAT */}
        {stage === 'hr' && (
           <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-t-xl p-4 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2"><User className="text-purple-400"/> HR Interview</h2>
                <button onClick={finishInterview} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold transition">End Interview & Get Report</button>
              </div>
              
              <div className="flex-1 bg-zinc-950 border-x border-zinc-800 p-4 overflow-y-auto space-y-4">
                
                {hrMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start"><div className="p-4 bg-zinc-800 rounded-xl rounded-bl-none text-zinc-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> HR is typing...</div></div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl p-4 flex gap-2">
                <input 
                  type="text" 
                  value={currentHrInput} 
                  onChange={(e) => setCurrentHrInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendHrMessage()}
                  placeholder="Type your response..." 
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-purple-500"
                />
                <button onClick={handleSendHrMessage} disabled={isLoading || !currentHrInput.trim()} className="px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </button>
              </div>
           </div>
        )}

        {/* FINAL REPORT */}
        {stage === 'report' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {!finalReport ? (
                <div className="flex flex-col items-center justify-center py-20 text-blue-400">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <h2 className="text-xl font-bold">AI is analyzing your entire interview...</h2>
                  <p className="text-zinc-500">Generating structured feedback report</p>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                  
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-6 mb-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Interview Evaluation Report</h1>
                      <p className="text-zinc-400">Candidate: {candidateName}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black px-6 py-2 rounded-full inline-block ${
                        finalReport.verdict === 'Strong Hire' ? 'bg-green-500/20 text-green-400' : 
                        finalReport.verdict === 'Hire' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {finalReport.verdict}
                      </div>
                      <p className="text-2xl font-bold mt-2 text-zinc-300">Score: {finalReport.overallScore}/100</p>
                    </div>
                  </div>

                  <p className="text-lg text-zinc-300 leading-relaxed mb-8 italic">"{finalReport.summary}"</p>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                      <h3 className="text-green-400 font-bold flex items-center gap-2 mb-4"><CheckCircle className="w-5 h-5"/> Key Strengths</h3>
                      <ul className="space-y-3">
                        {finalReport.strengths.map((s:string, i:number) => <li key={i} className="flex gap-2 text-zinc-300"><span className="text-green-500">•</span> {s}</li>)}
                      </ul>
                    </div>
                    
                    <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                      <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4"><XCircle className="w-5 h-5"/> Areas for Improvement</h3>
                      <ul className="space-y-3">
                        {finalReport.weaknesses.map((w:string, i:number) => <li key={i} className="flex gap-2 text-zinc-300"><span className="text-red-500">•</span> {w}</li>)}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                     <button onClick={() => window.location.reload()} className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold transition">Start New Interview</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}