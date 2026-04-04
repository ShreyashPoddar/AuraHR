'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Cpu, X, CheckCircle, Brain, BarChart3, Users, Trophy, Send,
  Loader2, Clock, TrendingUp, Star, Phone, GraduationCap, Building2,
  CalendarCheck, ChevronRight, Zap, Upload, AlertCircle, FileText,
  ArrowRight, Sparkles, Archive, ChevronDown, ShieldCheck, XCircle,
  LayoutGrid, Link2, Mic, MicOff, Trash2, Monitor, Eye, ShieldAlert
} from 'lucide-react';
import Papa from 'papaparse';
import { DigitalFootprintMiner } from '@/components/experiments/DigitalFootprintMiner';
import IntegrityTimeline, { IntegrityEvent } from '@/components/features/CandidateSuite/IntegrityTimeline';
import RadarChart from '@/components/RadarChart';
import { motion, AnimatePresence } from 'framer-motion';
import JDAnalysisFourBox from '@/components/features/CandidateSuite/JDAnalysisFourBox';
import JitsiRoom from '@/components/features/Proctoring/JitsiRoom';

type Candidate = {
  id: string; name: string; role: string; status: string;
  score: any; matchPercent: number; matchTags: string[];
  phone?: string; email?: string; education?: string; institute?: string;
  experience?: number;
  aiInterviewScore?: number; academiaScore?: number; salaryExpectation?: number;
  source?: string; gender?: string; profileStrength?: number;
  jdMatchRank?: string; matchedMust?: string[]; missingMust?: string[];
  recruiterRating?: number;
  recruiterFeedback?: string;
  aiSummary?: string;
  academicAssessment?: {
    questions: any[];
    completedAt?: string;
    submissions?: any[];
    proctoringSignals?: any[];
  };
};

const VettingBadge = ({ variant, label }: { variant: string; label: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest ${variant === 'gold' ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-white/10 text-white/40 uppercase'}`}>
    {label}
  </span>
);

const scoreBadge = (pct: number) =>
  pct >= 80
    ? `bg-sage/15 text-sage border border-sage/25`
    : pct >= 50
    ? `bg-yellow-900/25 text-yellow-300 border border-yellow-600/25`
    : `bg-red-900/25 text-red-400 border border-red-600/25`;
type Matrix = {
  technicalAccuracy: number; communicationClarity: number; culturalFit: number;
  jdRelevance: number; overall: number; sentiment: string; reasoning: Record<string, string>;
};
type ChatMessage = { role: 'ai' | 'user'; content: string; matrix?: Matrix };

const TABS = ['Pipeline', 'Smart Match', 'Academia Round', 'AI Interview', 'Analytics', 'Final Ranking'] as const;
type Tab = typeof TABS[number];
const PIPELINE_STAGES = ['Applied', 'Screened', 'Interview', 'Offer', 'Rejected'];

const STATUS_COLORS: Record<string, string> = {
  Applied: 'bg-white/10 text-white/60',
  Screened: 'bg-gold/10 text-gold border border-gold/20',
  Interview: 'bg-rust/10 text-rust border border-rust/20',
  Offer: 'bg-sage/10 text-sage border border-sage/20',
  Rejected: 'bg-red-900/20 text-red-400'
};
const SOURCE_COLORS: Record<string, string> = {
  PDF_Upload: 'bg-purple-900/30 text-purple-300 border-purple-500/20',
  CSV_Import: 'bg-blue-900/30 text-blue-300 border-blue-500/20',
  LinkedIn: 'bg-sky-900/30 text-sky-300 border-sky-500/20',
  Naukri: 'bg-orange-900/20 text-orange-300 border-orange-500/20',
  Referral: 'bg-sage/10 text-sage border-sage/20',
  GitHub: 'bg-white/10 text-white/60 border-white/10',
  Default: 'bg-white/5 text-white/40 border-white/10',
};

const OCR_STAGES = [
  { label: 'Analyzing Layout…', duration: 700 },
  { label: 'Extracting Fields…', duration: 900 },
  { label: 'Scoring Profile…', duration: 600 },
];

const formatLPA = (v: number) => `${(v / 100000).toFixed(1)} LPA`;
const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function RecruitmentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Pipeline');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  // JD Parser state
  const [jdText, setJdText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedJD, setParsedJD] = useState<any>(null);
  // Editable skill lists (allow recruiter to X-remove or add)
  const [editMust, setEditMust] = useState<string[]>([]);
  const [editNice, setEditNice] = useState<string[]>([]);
  const [editSoft, setEditSoft] = useState<string[]>([]);
  const [editFuture, setEditFuture] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<{must:string;nice:string;soft:string}>({must:'',nice:'',soft:''});
  // PDF Upload state
  const [ocrStage, setOcrStage] = useState(-1); // -1=idle, 0/1/2=stage index, 3=done
  const [pdfExtracted, setPdfExtracted] = useState<any>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvConverting, setCsvConverting] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  // Smart Match
  const [smartMatchData, setSmartMatchData] = useState<any>(null);
  const [smartMatchLoading, setSmartMatchLoading] = useState(false);
  // Stage transition
  const [isInviting, setIsInviting] = useState<string | null>(null);
  const [stageChanging, setStageChanging] = useState<string | null>(null);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Academia Round State
  const [isGeneratingAcademia, setIsGeneratingAcademia] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isSubmittingAcademia, setIsSubmittingAcademia] = useState(false);
  const [testView, setTestView] = useState(false);
  const [reportView, setReportView] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [academiaAnswers, setAcademiaAnswers] = useState<Record<string, string>>({});
  const [watchingCandidate, setWatchingCandidate] = useState<any>(null);
  const [proctoringEvents, setProctoringEvents] = useState<IntegrityEvent[]>([]);
  const [promotionLimit, setPromotionLimit] = useState(200);
  const [showViewPaperModal, setShowViewPaperModal] = useState(false);

  // ─── SPEECH TO TEXT (STT) ──────────────────────────────────────────────────
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Optimized for Indian English
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('STT Error:', event.error);
      setIsListening(false);
    };
    recognition.start();
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const fetchCandidates = async () => {
    const res = await fetch('/api/candidates');
    const d = await res.json();
    setCandidates(d.candidates || []);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const d = await res.json();
    if (d.settings?.academiaPromotionThreshold) {
      setPromotionLimit(d.settings.academiaPromotionThreshold);
    }
  };

  const savePromotionLimit = async (limit: number) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academiaPromotionThreshold: limit })
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const [, aRes] = await Promise.all([
        fetchCandidates(), 
        fetch('/api/recruitment/analytics'),
        fetchSettings()
      ]);
      setAnalytics(await aRes.json());
    };
    init();
  }, []);

  // Auto-save promotion limit with debounce
  useEffect(() => {
    // Skip initial load save
    const handler = setTimeout(() => {
      savePromotionLimit(promotionLimit);
    }, 1000);
    return () => clearTimeout(handler);
  }, [promotionLimit]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { if (activeTab === 'Smart Match') loadSmartMatch(); }, [activeTab]);

  // Monitor Academia assessment tab switches
  useEffect(() => {
    if (!testView) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctoringEvents(prev => [...prev, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: "Tab Switch Detected",
          type: "warning",
          icon: AlertCircle as any,
          note: "Candidate left the assessment tab."
        }]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    setProctoringEvents([{
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: "Environment Secured",
      type: "success",
      icon: ShieldCheck as any,
      note: "Proctoring & Eye-tracking active."
    }]);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testView]);

  // Sync parsed JD into editable state
  useEffect(() => {
    if (parsedJD) {
      setEditMust(parsedJD.mustHave || []);
      setEditNice(parsedJD.niceToHave || []);
      setEditSoft(parsedJD.softSkills || []);
      setEditFuture(parsedJD.futureProof || []);
    }
  }, [parsedJD]);

  const loadSmartMatch = async () => {
    setSmartMatchLoading(true);
    const res = await fetch('/api/recruitment/smart-match');
    setSmartMatchData(await res.json());
    setSmartMatchLoading(false);
  };

  const startInterview = (c: Candidate) => {
    setInterviewCandidate(c);
    setChatMessages([{ role: 'ai', content: `Welcome! I'm the NexusHR AI Interviewer assessing **${c.name}** for the **${c.role}** role. Let's begin — introduce yourself and walk me through your most impactful project.` }]);
    setActiveTab('AI Interview');
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !interviewCandidate) return;
    const msg = userInput; setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsAiThinking(true);
    try {
      const res = await fetch('/api/ai-interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: interviewCandidate.role, answer: msg }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', content: data.nextQuestion, matrix: data.matrix }]);
    } finally { setIsAiThinking(false); }
  };

  const parseJD = async () => {
    if (!jdText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/parse-jd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: jdText }) });
      setParsedJD(await res.json());
      // Reload candidates because parse-jd dynamically assigned them new semantic match scores
      await fetchCandidates();
    } finally { setIsParsing(false); }
  };

  const handlePdfUpload = async (file: File) => {
    setOcrStage(0); setPdfExtracted(null); setPdfFilename(file.name);
    // Simulate OCR pipeline stages with delays
    for (let i = 0; i < OCR_STAGES.length; i++) {
      setOcrStage(i);
      await new Promise(r => setTimeout(r, OCR_STAGES[i].duration));
    }
    try {
      // 1. Upload to S3 for storage
      const s3FormData = new FormData();
      s3FormData.append('file', file);
      await fetch('/api/storage/upload', { method: 'POST', body: s3FormData });

      // 2. Clear simulated delay and call Textract OCR backend
      const parseFormData = new FormData();
      parseFormData.append('file', file);
      const res = await fetch('/api/resume/parse', { method: 'POST', body: parseFormData });
      const data = await res.json();
      setPdfExtracted(data);
    } finally { setOcrStage(3); }
    await fetchCandidates();
  };

  const handleCsvConvert = async (file: File) => {
    setCsvConverting(true); setCsvResult(null);
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => {
      try {
        const res = await fetch('/api/candidates/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: results.data }) });
        setCsvResult(await res.json());
        await fetchCandidates();
      } finally { setCsvConverting(false); }
    }});
  };

  const handleInvite = async (candidate: Candidate) => {
    setIsInviting(candidate.id);
    try {
      const res = await fetch('/api/comms/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, name: candidate.name, role: candidate.role })
      });
      const data = await res.json();
      if (data.success) alert(`Invite sent via SES! Jitsi Link: ${data.jitsiLink}`);
    } finally { setIsInviting(null); }
  };

  const advanceStage = async (candidateId: string, newStage: string) => {
    setStageChanging(candidateId);
    try {
      await fetch(`/api/applicants/${candidateId}/stage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: newStage }) });
      await fetchCandidates();
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(c => c ? { ...c, status: newStage } : null);
    } finally { setStageChanging(null); setShowStageDropdown(false); }
  };

  const handleBatchGenerate = async () => {
    if (qualifiedAcademia.length === 0) return;
    setIsBatchGenerating(true);
    try {
      const res = await fetch('/api/recruitment/academia/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateIds: qualifiedAcademia.map(c => c.id), 
          role: qualifiedAcademia[0].role 
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCandidates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleGenerateAcademia = async (candidateId: string) => {
    setIsGeneratingAcademia(candidateId);
    try {
      const c = candidates.find(cand => cand.id === candidateId);
      if (!c) return;

      const res = await fetch('/api/recruitment/academia/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c.id, role: c.role })
      });
      const data = await res.json();
      if (data.success) {
        // Sync everything and open the test immediately
        setSelectedCandidate({ ...c, academicAssessment: { questions: data.questions, submissions: [], totalScore: 0, id: `acad_${Date.now()}` } });
        setCurrentQuestions(data.questions);
        setTestView(true);
        await fetchCandidates();
      }
    } finally {
      setIsGeneratingAcademia(null);
    }
  };

  const handleSubmitAcademia = async () => {
    if (!selectedCandidate) return;
    setIsSubmittingAcademia(true);
    try {
      const submissions = Object.entries(academiaAnswers).map(([id, ans]) => ({ questionId: id, answer: ans }));
      const res = await fetch('/api/recruitment/academia/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId: selectedCandidate.id, 
          submissions,
          proctoringSignals: proctoringEvents 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Assessment Completed! Score: ${data.totalScore}`);
        setTestView(false);
        await fetchCandidates();
      }
    } finally {
      setIsSubmittingAcademia(false);
    }
  };

  const handleSaveRating = async () => {
    if (!interviewCandidate) return;
    try {
      await fetch(`/api/candidates/${interviewCandidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterRating: rating, recruiterFeedback: feedback, status: 'Screened' })
      });
      alert('Rating saved successfully!');
      setShowReport(false);
      setInterviewCandidate(null);
      await fetchCandidates();
    } catch (e) { console.error(e); }
  };
  
  const handleClearAllCandidates = async () => {
    if (!window.confirm("Are you sure you want to clear ALL applicants? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/candidates', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchCandidates();
      }
    } catch (e) {
      console.error("Failed to clear candidates:", e);
    }
  };

  const getFinalScore = (c: Candidate) => {
    const jd = c.matchPercent || 0;
    const ai = c.aiInterviewScore || 0;
    const recruiter = ((c.recruiterRating || 0) / 5) * 100;
    const academia = c.academiaScore || 0;
    
    // Balanced weighted score (25% each)
    return Math.round((jd * 0.25) + (ai * 0.25) + (recruiter * 0.25) + (academia * 0.25));
  };

  const sortedRanking = [...candidates].sort((a, b) => getFinalScore(b) - getFinalScore(a));

  const sortedLeaderboard = [...candidates].sort((a, b) =>
    ((b.matchPercent || 0) + (b.aiInterviewScore || 0)) / 2 - ((a.matchPercent || 0) + (a.aiInterviewScore || 0)) / 2
  );

  const getSourceColor = (source?: string) => SOURCE_COLORS[source || ''] || SOURCE_COLORS.Default;

  const qualifiedAcademia = [...candidates]
    .sort((a, b) => (b.matchPercent || 0) - (a.matchPercent || 0))
    .slice(0, promotionLimit);

  return (
    <div className="min-h-screen bg-[#0D0C0A] text-cream font-sans pb-16" onClick={() => setShowStageDropdown(false)}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-gold/70 uppercase mb-2 block">AI RECRUITMENT SUITE · IST OPTIMISED</span>
            <h1 className="text-4xl font-serif text-white tracking-tight flex items-center gap-4">
              Hiring Intelligence <span className="text-gold italic">Centre</span>
            </h1>
          </div>
          <div className="flex space-x-4">
            {[{ v: candidates.length, l: 'Candidates', c: 'text-gold' }, { v: candidates.filter(c => c.status === 'Offer').length, l: 'Offers', c: 'text-sage' }].map(s => (
              <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                <div className={`text-3xl font-serif ${s.c}`}>{s.v}</div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-1 mt-8 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === tab ? 'bg-gold text-ink shadow-[0_0_20px_rgba(200,168,75,0.4)]' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              {tab === 'Pipeline' && <LayoutGrid className="w-4 h-4" />}
              {tab === 'Smart Match' && <Sparkles className="w-4 h-4" />}
              {tab === 'Academia Round' && <GraduationCap className="w-4 h-4" />}
              {tab === 'AI Interview' && <Brain className="w-4 h-4" />}
              {tab === 'Analytics' && <BarChart3 className="w-4 h-4" />}
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 pt-8">

        {/* ══════════════════ PIPELINE TAB ══════════════════ */}
        {activeTab === 'Pipeline' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ── JD PARSER ── */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="text-gold w-5 h-5" />
                  <h2 className="font-serif text-xl text-white">AI JD Parser</h2>
                  <span className="text-[9px] font-mono text-gold/60 bg-gold/10 px-2 py-0.5 rounded ml-auto">Constraint-Based</span>
                </div>
                <div className="flex gap-3">
                  <textarea className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 resize-none h-28"
                    placeholder="Paste JD here — the AI will classify 'Required'/'Mandatory' as Must-Have and 'Preferred'/'Plus' as Nice-to-Have..."
                    value={jdText} onChange={e => setJdText(e.target.value)} />
                  <button onClick={parseJD} disabled={isParsing || !jdText}
                    className="bg-gold text-ink px-5 rounded-xl font-bold text-sm hover:bg-gold/90 disabled:opacity-40 flex items-center space-x-2 self-stretch shadow-[0_0_20px_rgba(200,168,75,0.2)]">
                    {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /><span>Parse</span></>}
                  </button>
                </div>

                {parsedJD && (
                  <div className="space-y-3 animate-in slide-in-from-bottom-4">

                    {/* ── Live Match Count Banner ── */}
                    <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-white">
                          <span className="text-indigo-300 text-lg font-serif">{parsedJD.liveMatchCount ?? 0}</span> existing candidates match ≥60% of these skills
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] font-mono">
                        <span className="text-indigo-400/70">{(editMust.length)} must-have</span>
                        <span className="text-white/30">·</span>
                        <span className="text-blue-400/70">{(editNice.length)} preferred</span>
                        <span className="text-white/30">·</span>
                        <span className="text-white/40">{(editSoft.length)} soft</span>
                      </div>
                    </div>

                    {/* ── 4-Box AI Insight Matrix ── */}
                    <div className="pt-4 border-t border-white/10">
                       <JDAnalysisFourBox 
                         mustHave={editMust.length > 0 ? editMust : undefined}
                         niceToHave={editNice.length > 0 ? editNice : undefined}
                         teamGap={parsedJD.gaps?.length > 0 ? parsedJD.gaps : undefined}
                         futureProof={editFuture.length > 0 ? editFuture : undefined}
                       />
                    </div>

                      {/* Skill Gaps Alert */}
                      {(parsedJD.gaps || []).length > 0 && (
                        <div className="flex items-start space-x-2 bg-red-950/30 border border-red-800/25 rounded-xl px-4 py-3">
                          <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[10px] font-mono text-red-400/80 font-bold mb-1.5">UNMET MUST-HAVES — No candidate in pool covers these:</div>
                            <div className="flex flex-wrap gap-1">
                              {(parsedJD.gaps || []).map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-red-900/25 text-red-300 text-[9px] rounded font-mono border border-red-800/30">✗ {s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}


                    {/* Recommended Existing Talent */}
                    {parsedJD.recommendedTalent?.length > 0 && (
                      <div className="bg-white/5 border border-gold/20 rounded-xl p-4">
                        <div className="text-[10px] font-mono text-gold/80 uppercase tracking-wider mb-3 font-bold flex items-center space-x-2">
                          <Sparkles className="w-3 h-3" /><span>Recommended Existing Talent</span>
                          <span className="ml-auto text-white/30">{parsedJD.totalRanked} searched</span>
                        </div>
                        <div className="space-y-2">
                          {parsedJD.recommendedTalent.map((c: any, i: number) => {
                            const metSkills = c.must_haves_met || c.matchedMust || [];
                            const missingSkills = c.must_haves_missing || c.missingMust || [];
                            const matchPct = c.overall_match_score ?? c.match ?? 0;
                            return (
                              <div key={c.id} className={`flex items-start space-x-3 p-3 rounded-xl ${i === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-white/3 border border-white/8'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-gold text-ink' : 'bg-white/10 text-white/60'}`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white text-sm">{c.name}</span>
                                    <span className={`font-mono text-sm font-bold px-1.5 py-0.5 rounded border ${scoreBadge(matchPct)}`}>{matchPct}%</span>
                                  </div>
                                  <div className="text-[10px] text-white/40 mt-0.5 italic">{c.justification || c.role}</div>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {metSkills.slice(0, 2).map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-sage/10 text-sage text-[9px] rounded font-mono">✓ {s}</span>)}
                                    {missingSkills.slice(0, 2).map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-red-900/20 text-red-400 text-[9px] rounded font-mono">✗ {s}</span>)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* ── PDF OCR UPLOAD ── */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="text-sage w-5 h-5" />
                  <h2 className="font-serif text-xl text-white">OCR Resume Upload</h2>
                  <span className="text-[9px] font-mono text-sage/60 bg-sage/10 px-2 py-0.5 rounded ml-auto">Layout-Aware</span>
                </div>

                {/* OCR Progress Steps */}
                {ocrStage >= 0 && ocrStage < 3 && (
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2">
                    {OCR_STAGES.map((st, i) => (
                      <div key={st.label} className={`flex items-center space-x-3 transition-all duration-300 ${i === ocrStage ? 'opacity-100' : i < ocrStage ? 'opacity-40' : 'opacity-20'}`}>
                        {i < ocrStage ? <CheckCircle className="w-4 h-4 text-sage flex-shrink-0" /> : i === ocrStage ? <Loader2 className="w-4 h-4 text-gold animate-spin flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />}
                        <span className={`text-sm font-mono ${i === ocrStage ? 'text-gold' : 'text-white/50'}`}>{st.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {ocrStage === -1 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-sage/40 hover:bg-sage/5 cursor-pointer transition-all group">
                    <input type="file" accept=".pdf,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
                    <Upload className="w-8 h-8 text-white/20 mb-2 group-hover:text-sage transition-colors" />
                    <span className="text-sm text-white/40 group-hover:text-white/70">Drop Resume PDF / TXT here</span>
                    <span className="text-[10px] font-mono text-white/20 mt-1">Auto-extracted → added to Applied stage</span>
                  </label>
                )}

                {ocrStage === 3 && pdfExtracted && (
                  <div className="space-y-3 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Extraction Complete</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-20 bg-white/10 rounded-full h-2">
                            <div className="bg-gold h-2 rounded-full transition-all duration-700"
                              style={{ width: `${pdfExtracted.profileStrength?.score || 0}%` }} />
                          </div>
                          <span className={`text-xs font-mono font-bold ${pdfExtracted.profileStrength?.score >= 70 ? 'text-gold' : 'text-rust'}`}>
                            {pdfExtracted.profileStrength?.score}% {pdfExtracted.profileStrength?.tier}
                          </span>
                        </div>
                        {pdfExtracted.autoSaved
                          ? <span className="text-[10px] font-mono bg-sage/20 text-sage px-2 py-0.5 rounded-full border border-sage/20">✓ Auto-saved</span>
                          : <span className="text-[10px] font-mono bg-rust/20 text-rust px-2 py-0.5 rounded-full border border-rust/20">Duplicate</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { l: 'Name', v: pdfExtracted.extracted?.name },
                        { l: 'Email', v: pdfExtracted.extracted?.email },
                        { l: 'Phone', v: pdfExtracted.extracted?.phone },
                        { l: 'Experience', v: pdfExtracted.extracted?.totalExpYears != null ? `${pdfExtracted.extracted.totalExpYears} yrs` : 'Inferred' },
                        { l: 'Degree', v: pdfExtracted.extracted?.education?.degree },
                        { l: 'Institute Tier', v: pdfExtracted.extracted?.education?.tier },
                      ].map(f => (
                        <div key={f.l} className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                          <div className="text-[9px] font-mono text-white/30 mb-0.5">{f.l}</div>
                          <div className={`text-xs font-bold truncate ${!f.v ? 'text-rust' : 'text-white'}`}>{f.v || 'Incomplete'}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-white/30 mb-1.5 uppercase tracking-wider">Detected Skills ({pdfExtracted.extracted?.skillsList?.length || 0})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(pdfExtracted.extracted?.skillsList || []).map((s: string) => <span key={s} className="px-2 py-0.5 bg-sage/15 text-sage text-[10px] rounded font-mono">{s}</span>)}
                        {!pdfExtracted.extracted?.skillsList?.length && <span className="text-[10px] text-white/30 italic">None detected in text</span>}
                      </div>
                    </div>
                    {pdfExtracted.extracted?.incompleteFields?.length > 0 && (
                      <div className="flex items-center space-x-2 text-rust text-[10px] font-mono bg-rust/10 border border-rust/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>Flagged incomplete: {pdfExtracted.extracted.incompleteFields.join(', ')}</span>
                      </div>
                    )}
                    {/* Profile Strength Breakdown */}
                    {pdfExtracted.jdMatch && (
                      <div className={`border rounded-xl p-3 space-y-2 ${pdfExtracted.jdMatch.matchPercent >= 80 ? 'bg-sage/5 border-sage/20' : pdfExtracted.jdMatch.matchPercent >= 50 ? 'bg-yellow-900/10 border-yellow-600/20' : 'bg-red-900/10 border-red-600/20'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">JD Match Score</span>
                          <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${scoreBadge(pdfExtracted.jdMatch.matchPercent)}`}>{pdfExtracted.jdMatch.matchPercent}% — {pdfExtracted.jdMatch.matchRank}</span>
                        </div>
                        {pdfExtracted.activeJD && <div className="text-[9px] text-white/30 font-mono">vs. {pdfExtracted.activeJD.title}</div>}
                        {pdfExtracted.jdMatch.missingMust?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[9px] text-rust font-mono mr-1">Missing must-haves:</span>
                            {pdfExtracted.jdMatch.missingMust.map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-rust/10 text-rust text-[9px] rounded font-mono">{s}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                    {pdfExtracted.profileStrength?.breakdown && (
                      <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                        <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-2">Profile Strength Breakdown</div>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(pdfExtracted.profileStrength.breakdown).map(([k, v]) => (
                            <div key={k} className="text-center">
                              <div className="text-xs font-mono font-bold text-gold mb-0.5">{v as number}</div>
                              <div className="text-[8px] text-white/30 capitalize">{k}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => { setOcrStage(-1); setPdfExtracted(null); }}
                      className="w-full border border-white/10 py-2 rounded-xl text-xs font-mono text-white/40 hover:text-white hover:border-white/20 transition-all">
                      Upload Another Resume
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── CSV BULK CONVERT ── */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Upload className="text-sage w-4 h-4" />
                  <h2 className="font-serif text-lg text-white">Bulk CSV → Applicants</h2>
                </div>
                {csvResult && <span className="text-[10px] font-mono text-sage bg-sage/10 border border-sage/20 px-3 py-1 rounded-full">✓ {csvResult.added} added, {csvResult.duplicates} dupes skipped</span>}
              </div>
              <p className="text-[10px] text-white/25 mb-3 font-mono">Headers: name, email, role, ctc, expectedCtc, noticePeriod, skills, pan, gender, source, institute</p>
              <label className={`flex items-center justify-center w-full h-14 rounded-xl border-2 border-dashed cursor-pointer transition-all group ${csvConverting ? 'border-gold/40 bg-gold/5' : 'border-white/10 hover:border-sage/40 hover:bg-sage/5'}`}>
                <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCsvFile(f); handleCsvConvert(f); } }} />
                {csvConverting ? <div className="flex items-center space-x-2 text-gold"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs font-mono">Processing…</span></div>
                  : <span className="text-xs text-white/30 group-hover:text-white/60">{csvFile ? csvFile.name : 'Drop CSV or click to select'}</span>}
              </label>
            </div>

            {/* ── APPLIED LIST with Score + Origin ── */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gold" />
                  <span>All Applicants</span>
                  <span className="ml-2 text-sm font-sans font-normal text-white/30">{candidates.length} total</span>
                </h2>
                {candidates.length > 0 && (
                  <button 
                    onClick={handleClearAllCandidates}
                    className="flex items-center space-x-2 text-[10px] font-mono text-rust/60 hover:text-rust border border-rust/20 hover:border-rust/40 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Candidate', 'Role', 'Exp', 'Skills', 'Match %', 'Stage', 'Action'].map(h => (
                        <th key={h} className="text-left pb-3 pr-4 text-[10px] font-mono text-white/30 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {candidates.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setSelectedCandidate(c)}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif font-bold text-gold text-sm flex-shrink-0">{c.name.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm group-hover:text-gold transition-colors truncate">{c.name}</div>
                              <div className="text-[9px] text-white/30 font-mono truncate">{c.email || c.phone || 'No contact'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/50">{c.role}</td>
                        <td className="py-3 pr-4 text-xs font-mono text-gold/80">{c.experience != null ? `${c.experience}y` : '—'}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(c.matchTags || []).slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="relative group flex items-center space-x-2">
                            <div className="w-10 bg-white/10 rounded-full h-1">
                              <div className={`h-1 rounded-full ${c.matchPercent >= 80 ? 'bg-sage' : c.matchPercent >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                style={{ width: `${c.matchPercent}%` }} />
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${scoreBadge(c.matchPercent)}`}>{c.matchPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-mono font-bold ${STATUS_COLORS[c.status] || 'bg-white/10 text-white/40'}`}>{c.status}</span>
                        </td>
                        <td className="py-3">
                          <button onClick={e => { e.stopPropagation(); startInterview(c); }}
                            className="text-[9px] font-mono font-bold text-gold/60 hover:text-gold border border-gold/15 hover:border-gold/40 rounded-lg px-2 py-1 transition-all">
                            Interview →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ SMART MATCH TAB ══════════════════ */}
        {activeTab === 'Smart Match' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles className="text-gold w-6 h-6" />
              <h2 className="font-serif text-2xl text-white">JD-to-Talent Smart Match</h2>
              <div className="flex items-center space-x-3 ml-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:border-gold/30 transition-all">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Academia Promotion Threshold</span>
                <input type="number" value={promotionLimit} onChange={e => setPromotionLimit(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-transparent text-gold font-serif text-lg focus:outline-none border-b border-gold/20 text-center" />
              </div>
            </div>
            {smartMatchData && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <div className="text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">Matching Against</div>
                <div className="font-serif text-2xl text-white mb-3">{smartMatchData.jd?.title}</div>
                <div className="flex flex-wrap gap-2">
                  {smartMatchData.jd?.mustHave?.map((s: string) => <span key={s} className="px-2 py-1 bg-sage/10 text-sage text-xs rounded font-mono border border-sage/20">{s}</span>)}
                  {smartMatchData.jd?.niceToHave?.map((s: string) => <span key={s} className="px-2 py-1 bg-gold/10 text-gold text-xs rounded font-mono border border-gold/20">{s}</span>)}
                  {smartMatchData.jd?.softSkills?.map((s: string) => <span key={s} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded font-mono border border-cyan-500/20">{s}</span>)}
                  {smartMatchData.jd?.futureProof?.map((s: string) => <span key={s} className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded font-mono border border-purple-500/20">{s}</span>)}
                </div>
              </div>
            )}
            {smartMatchLoading ? (
              <div className="flex items-center justify-center py-20 space-x-3 text-gold">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="font-mono text-sm">Running semantic match…</span>
              </div>
            ) : (
              <div className="space-y-3">
                {(smartMatchData?.ranked || []).map((c: any, i: number) => (
                  <div key={c.id} className={`flex items-center space-x-5 p-5 rounded-2xl border cursor-pointer group transition-all ${i === 0 ? 'bg-gold/10 border-gold/30' : 'bg-white/3 border-white/8 hover:border-gold/20'}`}
                    onClick={() => { const full = candidates.find(ca => ca.id === c.id); if (full) setSelectedCandidate(full); }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-lg flex-shrink-0 ${i === 0 ? 'bg-gold text-ink' : i < 3 ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'}`}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white group-hover:text-gold transition-colors">{c.name}</div>
                      <div className="text-xs text-white/40 flex items-center space-x-3 mt-0.5">
                        <span>{c.role}</span>
                        {c.institute && <span className="flex items-center"><GraduationCap className="w-3 h-3 mr-1" />{c.institute}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div><div className="text-[10px] font-mono text-white/30 uppercase mb-1">Match</div><div className="font-serif text-3xl text-gold">{c.matchPct}%</div></div>
                      <div>
                        <div className="text-[10px] font-mono text-white/30 uppercase mb-1.5">Matched</div>
                        <div className="flex flex-wrap gap-1">{c.matchedSkills.slice(0, 3).map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-sage/10 text-sage text-[9px] rounded font-mono">{s}</span>)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-rust/60 uppercase mb-1.5">Gaps</div>
                        <div className="flex flex-wrap gap-1">{c.missingSkills.length > 0 ? c.missingSkills.map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-rust/10 text-rust text-[9px] rounded font-mono">{s}</span>) : <span className="text-[9px] text-white/30">None</span>}</div>
                      </div>
                      {c.salaryExpectation && <div className="text-right"><div className="text-[10px] font-mono text-white/30 uppercase mb-1">Expected</div><div className="font-mono text-white text-sm font-bold">{formatLPA(c.salaryExpectation)}</div></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ACADEMIA ROUND TAB ══════════════════ */}
        {activeTab === 'Academia Round' && (
          <div className="space-y-8">
            {/* Live Proctoring Modal (Injected for Supervisor Mode) */}
            <AnimatePresence>
              {watchingCandidate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="bg-[#11100D] border border-white/20 p-8 rounded-[40px] w-full max-w-5xl h-[80vh] flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,1)]">
                    <button onClick={() => setWatchingCandidate(null)} className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-2xl hover:bg-red-600 transition-all z-[110]">×</button>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-serif text-white tracking-tight">Live Feed: <span className="text-gold italic">{watchingCandidate.name}</span></h3>
                        <p className="text-xs font-mono text-white/40 uppercase mt-1">Status: <span className="text-green-500">SECURE</span> · Real-time Sync</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 px-5 py-2.5 rounded-2xl flex items-center gap-4">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <span className="text-[11px] font-mono font-bold text-red-500 uppercase tracking-widest">Supervisor Mode</span>
                      </div>
                    </div>
                    <div className="flex-1 rounded-[32px] overflow-hidden border border-white/10 bg-black shadow-inner">
                      <JitsiRoom roomName={`ACADEMIA-${watchingCandidate.id}`} userName="AuraHR Recruiter" />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {!testView && !reportView ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gold/10 border border-gold/20 p-4 rounded-2xl flex items-center gap-4 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Elite Selection Protocol Active</h4>
                      <p className="text-[10px] text-white/40">Only the Top <span className="text-gold font-bold">{promotionLimit}</span> candidates ranked by AI Smart Match qualify for academic testing.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="font-serif text-2xl text-white flex items-center"><GraduationCap className="text-gold w-6 h-6 mr-3" />Academia Pipeline</h3>
                       <span className="text-xs font-mono text-white/30 uppercase tracking-widest">{qualifiedAcademia.length} Qualified / {candidates.length} Total</span>
                     </div>
                     {qualifiedAcademia[0]?.academicAssessment ? (
                       <button 
                         onClick={() => setShowViewPaperModal(true)} 
                         className="bg-white/5 border border-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:border-gold/50 hover:text-gold transition-all flex items-center shadow-lg group"
                       >
                         <Eye className="w-4 h-4 mr-2 text-gold group-hover:scale-110 transition-transform" />
                         <span>View Standardized Tech Paper</span>
                       </button>
                     ) : (
                       <button 
                         onClick={handleBatchGenerate} 
                         disabled={isBatchGenerating || qualifiedAcademia.length === 0}
                         className="bg-gold text-ink px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gold/90 transition-all flex items-center shadow-[0_0_20px_rgba(200,168,75,0.3)] disabled:opacity-40"
                       >
                         {isBatchGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                         <span>Generate Paper for All Qualified</span>
                       </button>
                     )}
                  </div>
                  
                  {qualifiedAcademia.map((c: any) => (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-gold/30 transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif font-bold text-gold text-xl">{c.name.charAt(0)}</div>
                        <div>
                          <h4 className="font-serif text-lg text-white group-hover:text-gold transition-colors">{c.name}</h4>
                          <p className="text-xs text-white/40 font-mono italic">{c.role} · Academic Avg: {c.academiaScore || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px]">
                        {c.academicAssessment?.completedAt ? (
                          <button onClick={() => { setSelectedReport(c); setReportView(true); }} className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center uppercase tracking-widest"><FileText className="w-4 h-4 mr-2" /> Report</button>
                        ) : c.academicAssessment ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setWatchingCandidate(c)} className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center uppercase tracking-widest"><Eye className="w-4 h-4 mr-2" /> Monitor</button>
                            <button onClick={() => { 
                              setSelectedCandidate(c); 
                              setCurrentQuestions(c.academicAssessment.questions); 
                              setTestView(true); 
                            }} className="bg-gold text-ink px-4 py-2 rounded-xl font-bold hover:bg-gold/90 transition-all flex items-center uppercase tracking-widest"><Zap className="w-4 h-4 mr-2" /> Start Test</button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-white/30 uppercase bg-white/5 px-4 py-2 rounded-xl border border-white/10 italic">
                            Waiting for Batch Generation…
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-1">
                   <div className="bg-gold/5 border border-gold/10 rounded-2xl p-6 mt-6">
                      <h4 className="text-xs font-mono font-bold text-gold uppercase tracking-widest mb-4">Vetting Intelligence</h4>
                      <p className="text-white/40 text-xs leading-relaxed">Papers are AI-generated based on the specific Job Description. Proctoring monitors tab visibility and environment status in real-time.</p>
                   </div>
                </div>
              </div>
            ) : reportView ? (
              <div className="max-w-4xl">
                 <button onClick={() => setReportView(false)} className="mb-6 flex items-center gap-2 text-white/40 hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest"><ChevronRight className="rotate-180 w-4 h-4" /> Back to Pipeline</button>
                 <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/5">
                      <div>
                        <h2 className="text-2xl font-serif text-white mb-1">{selectedReport?.name}</h2>
                        <p className="text-gold font-mono text-[10px] tracking-widest uppercase italic">{selectedReport?.role} Report</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-serif text-gold">{selectedReport?.academiaScore || 0}</span>
                        <span className="text-xs font-mono text-white/20 ml-2">/ 100</span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {selectedReport?.academicAssessment?.submissions?.map((sub: any, i: number) => {
                        const q = selectedReport.academicAssessment.questions.find((quest: any) => quest.id === sub.questionId);
                        return (
                          <div key={sub.questionId} className="bg-white/5 rounded-xl p-6 border border-white/5">
                            <div className="flex items-start gap-4 mb-3">
                              <span className="bg-white/10 text-white/60 w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                              <h4 className="text-white text-sm font-medium">{q?.question}</h4>
                            </div>
                            <p className={`text-xs mt-2 pl-10 ${sub.isCorrect ? 'text-green-400' : 'text-red-400'}`}>Answer: {sub.answer}</p>
                          </div>
                        );
                      })}
                    </div>
                 </div>
              </div>
            ) : (
                <div className="max-w-5xl bg-white/5 border border-white/10 rounded-3xl p-10 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-10 pb-10 border-b border-white/5">
                      <div>
                        <h2 className="text-3xl font-serif text-white mb-2">{selectedCandidate?.name}</h2>
                        <p className="text-gold font-mono text-xs tracking-widest uppercase italic">{selectedCandidate?.role} Technical Paper</p>
                      </div>
                      <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">LIVE PROCTORING</span>
                      </div>
                    </div>
                    <div className="space-y-8 overflow-y-auto max-h-[60vh] pr-4">
                      {currentQuestions.map((q, i) => (
                        <div key={q.id} className="space-y-4 bg-white/5 p-8 rounded-2xl border border-white/5">
                          <div className="flex items-start gap-4">
                            <span className="bg-gold text-ink w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                            <h3 className="text-lg text-white font-medium">{q.question}</h3>
                          </div>
                          <textarea onChange={(e) => setAcademiaAnswers({ ...academiaAnswers, [q.id]: e.target.value })}
                            placeholder="Type response…" className="w-full bg-[#0d0c0a] border border-white/10 rounded-xl p-5 text-sm text-white focus:border-gold/40 h-32" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-end gap-4">
                      <button onClick={() => setTestView(false)} className="px-8 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest">Back</button>
                      <button onClick={handleSubmitAcademia} disabled={isSubmittingAcademia} className="bg-gold text-ink px-10 py-3 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all flex items-center shadow-[0_0_30px_rgba(200,168,75,0.3)]">
                        {isSubmittingAcademia ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Submit Assessment'}
                      </button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* ══════════════════ AI INTERVIEW TAB ══════════════════ */}
        {activeTab === 'AI Interview' && (
          <div className="max-w-3xl mx-auto">
            {!interviewCandidate ? (
              <div className="text-center py-20">
                <Brain className="w-16 h-16 text-gold/30 mx-auto mb-6" />
                <h3 className="font-serif text-3xl text-white mb-4">Select a Candidate</h3>
                <p className="text-white/40 mb-8">Select from the Pipeline tab or choose below:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {candidates.slice(0, 6).map(c => (
                    <button key={c.id} onClick={() => startInterview(c)} className="bg-white/5 hover:bg-gold/10 hover:border-gold/50 border border-white/10 rounded-xl px-4 py-3 text-left transition-all group">
                      <div className="font-bold text-white text-sm group-hover:text-gold">{c.name}</div>
                      <div className="text-xs text-white/40">{c.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[72vh]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif font-bold text-gold">{interviewCandidate.name.charAt(0)}</div>
                    <div><div className="font-bold text-white">{interviewCandidate.name}</div><div className="text-xs text-white/40">{interviewCandidate.role}</div></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => advanceStage(interviewCandidate.id, 'Offer')} className="flex items-center space-x-1.5 bg-sage/20 hover:bg-sage/30 text-sage border border-sage/20 px-3 py-2 rounded-xl text-xs font-bold transition-all">
                      <ArrowRight className="w-3.5 h-3.5" /><span>Promote</span>
                    </button>
                    <button onClick={() => setInterviewCandidate(null)} className="text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
                  </div>
                </div>
                
                {/* ── JITSI PROCTORING VIEW ── */}
                <div className="h-[400px] mb-6">
                  <JitsiRoom 
                    roomName={`AuraHR-PROCTOR-${interviewCandidate.id}`} 
                    userName={`Recruiter (Monitoring ${interviewCandidate.name})`} 
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${msg.role === 'ai' ? 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none' : 'bg-gold text-ink font-medium rounded-tr-none'}`}>
                        {msg.role === 'ai' && <div className="flex items-center space-x-2 mb-2"><Brain className="w-4 h-4 text-gold" /><span className="text-xs text-gold font-mono font-bold">NexusHR AI Interviewer</span></div>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.matrix && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5">
                            <div className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded inline-block mb-1 ${msg.matrix.sentiment === 'positive' ? 'bg-sage/20 text-sage' : msg.matrix.sentiment === 'negative' ? 'bg-rust/20 text-rust' : 'bg-gold/20 text-gold'}`}>
                              {msg.matrix.sentiment} — Overall {msg.matrix.overall}/100
                            </div>
                            {[
                              { label: 'Technical (40%)', score: msg.matrix.technicalAccuracy, note: msg.matrix.reasoning?.technicalAccuracy },
                              { label: 'Communication (20%)', score: msg.matrix.communicationClarity, note: msg.matrix.reasoning?.communicationClarity },
                              { label: 'Cultural Fit (20%)', score: msg.matrix.culturalFit, note: msg.matrix.reasoning?.culturalFit },
                              { label: 'JD Relevance (20%)', score: msg.matrix.jdRelevance, note: msg.matrix.reasoning?.jdRelevance },
                            ].map(d => (
                              <div key={d.label} className="flex items-start space-x-3">
                                <div className="w-32 flex-shrink-0">
                                  <div className="text-[9px] font-mono text-white/40 mb-1">{d.label}</div>
                                  <div className="bg-white/5 rounded-full h-1.5"><div className="bg-gold h-1.5 rounded-full" style={{ width: `${d.score}%` }} /></div>
                                </div>
                                <div className="text-[10px] text-white/35 italic leading-tight flex-1">{d.note}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-gold animate-spin" />
                        <span className="text-xs text-white/40 font-mono">NexusHR AI evaluating…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex space-x-3">
                  <button onClick={startListening} disabled={isAiThinking}
                    className={`px-4 rounded-xl transition-all border ${isListening ? 'bg-gold/20 border-gold text-gold animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:text-gold hover:border-gold/40'}`}>
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type or speak candidate's response…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-all" />
                  <button onClick={sendMessage} disabled={!userInput.trim() || isAiThinking}
                    className="bg-gold text-ink px-5 rounded-xl hover:bg-gold/90 disabled:opacity-40 shadow-[0_0_15px_rgba(200,168,75,0.3)]">
                    <Send className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowReport(true)}
                    className="border border-gold text-gold px-4 py-2 rounded-xl text-xs font-bold hover:bg-gold/10 transition-all flex items-center">
                    <Trophy className="w-3.5 h-3.5 mr-2" />Finalize
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ANALYTICS TAB ══════════════════ */}
        {activeTab === 'Analytics' && analytics && (
          <div className="space-y-6">
            
            {/* NEEV CLOUD ANALYTICS MODULES (Features Injected) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-2">
              <div className="lg:col-span-1">
                <DigitalFootprintMiner />
              </div>
              <div className="lg:col-span-1">
                <MarketTrendEvolution />
              </div>
              <div className="lg:col-span-2">
              </div>
              <div className="lg:col-span-2">
                <TeamCollaborationGraph />
              </div>
            </div>

            <h3 className="font-serif text-2xl text-white mb-4 mt-8 flex items-center border-t border-white/10 pt-8">
              <BarChart3 className="text-gold w-6 h-6 mr-3" />
              Standard Recruitment Telemetry
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Avg. Time to Hire', value: `${analytics.timeToHireAvg}d`, icon: Clock, color: 'text-gold' },
                { label: 'Total Pipeline', value: analytics.total, icon: Users, color: 'text-sage' },
                { label: 'Offers Extended', value: analytics.byStatus?.Offer || 0, icon: Star, color: 'text-rust' },
                { label: 'AI Interviews Done', value: candidates.filter(c => c.aiInterviewScore).length, icon: Brain, color: 'text-gold' },
                { label: 'Avg. Academia Score', value: Math.round(candidates.reduce((acc, c) => acc + (c.academiaScore || 0), 0) / (candidates.filter(c => c.academiaScore).length || 1)), icon: GraduationCap, color: 'text-gold' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <s.icon className={`w-5 h-5 ${s.color} mb-4 opacity-80`} />
                  <div className={`font-serif text-4xl ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs font-mono text-white/40 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-serif text-xl text-white mb-6 flex items-center"><TrendingUp className="text-gold w-5 h-5 mr-2" />Time to Hire by Stage</h3>
                {analytics.stages?.map((s: any) => (
                  <div key={s.stage} className="flex items-center space-x-4 mb-3">
                    <div className="w-20 text-xs font-mono text-white/50 text-right">{s.stage}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div className="bg-gold h-4 rounded-full" style={{ width: `${(s.avgDays / 20) * 100}%` }} />
                    </div>
                    <div className="w-16 text-xs font-mono text-gold font-bold">{s.avgDays} days</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-serif text-xl text-white mb-6">Sourcing Channels</h3>
                {Object.entries(analytics.bySource || {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between mb-3">
                    <div className="text-sm text-white/70">{source}</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-white/5 rounded-full h-2">
                        <div className="bg-gold h-2 rounded-full" style={{ width: `${((count as number) / analytics.total) * 100}%` }} />
                      </div>
                      <div className="text-xs font-mono text-gold">{count as number}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ FINAL RANKING TAB ══════════════════ */}
        {activeTab === 'Final Ranking' && (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy className="w-32 h-32 text-gold" /></div>
               <h3 className="font-serif text-3xl text-white mb-2">Talent Leaderboard</h3>
               <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Weighted Synthesis of Match, AI Interview & Recruiter Rating</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {sortedRanking.map((c, i) => (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:border-gold/30 transition-all group cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                    <div className="flex items-center space-x-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold text-xl ${i === 0 ? 'bg-gold/20 text-gold border border-gold/40 shadow-[0_0_15px_rgba(200,168,75,0.2)]' : 'bg-white/10 text-white/60 border border-white/10'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-white group-hover:text-gold transition-colors">{c.name}</h4>
                        <p className="text-xs text-white/40 font-mono">{c.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                       <div className="text-center group-hover:scale-110 transition-transform">
                          <div className="text-[9px] font-mono text-white/30 uppercase mb-1 flex items-center justify-center gap-1">
                             <GraduationCap className="w-2.5 h-2.5" /> Acad
                          </div>
                          <div className="text-lg font-serif text-gold/80 italic">{c.academiaScore || 0}</div>
                       </div>
                       <div className="text-center">
                          <div className="text-[10px] font-mono text-white/30 uppercase mb-1">Final Score</div>
                          <div className="text-2xl font-serif text-gold">{getFinalScore(c)}</div>
                       </div>
                       <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-gold transition-all" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-gold/5 border border-gold/10 rounded-2xl p-6">
                    <h4 className="text-xs font-mono font-bold text-gold uppercase tracking-widest mb-6">Top Performer Intelligence</h4>
                    {sortedRanking[0] && (
                      <div className="space-y-6">
                        <DigitalFootprintMiner candidateName={sortedRanking[0].name} role={sortedRanking[0].role} />
                        <TeamCollaborationGraph scores={sortedRanking[0].score} />
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ CANDIDATE DETAIL MODAL ══════════════════ */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md" onClick={() => { setSelectedCandidate(null); setShowStageDropdown(false); }}>
          <div className="bg-[#111009] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif font-bold text-gold text-2xl">{(selectedCandidate as any).name.charAt(0)}</div>
                  <div>
                    <h3 className="font-serif text-2xl text-white">{(selectedCandidate as any).name}</h3>
                    <p className="text-xs text-white/40 font-mono">{(selectedCandidate as any).role} · {(selectedCandidate as any).phone}</p>
                  </div>
                </div>
              <div className="flex items-center space-x-3">
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowStageDropdown((p: boolean) => !p)}
                    className="flex items-center space-x-2 bg-gold text-ink px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gold/90 transition-all">
                    {stageChanging === (selectedCandidate as any).id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /><span>Move to Stage</span><ChevronDown className="w-4 h-4" /></>}
                  </button>
                  {showStageDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-top-2">
                      {PIPELINE_STAGES.filter(s => s !== (selectedCandidate as any).status).map(stage => (
                        <button key={stage} onClick={() => advanceStage((selectedCandidate as any).id, stage)}
                          className="w-full text-left px-5 py-3 text-sm text-white/70 hover:bg-gold/10 hover:text-gold transition-colors font-medium">
                          → {stage}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex gap-8 p-8 overflow-y-auto">
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-mono text-white/40 mb-1">JD Match</div>
                    <div className="font-serif text-4xl text-gold">{(selectedCandidate as any).matchPercent}%</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-mono text-white/40 mb-1">AI Score</div>
                    <div className="font-serif text-4xl text-sage">{(selectedCandidate as any).aiInterviewScore || '—'}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-mono text-white/40 mb-1">Origin</div>
                    <span className={`text-[10px] px-2 py-1 rounded border font-mono ${getSourceColor((selectedCandidate as any).source)}`}>{(selectedCandidate as any).source || 'Manual'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider mb-2">Education</div>
                  <div className="flex items-center space-x-2 text-white mb-1"><GraduationCap className="w-4 h-4 text-gold" /><span>{(selectedCandidate as any).education || '—'}</span></div>
                  <div className="flex items-center space-x-2 text-white/50"><Building2 className="w-4 h-4" /><span className="text-sm">{(selectedCandidate as any).institute || '—'}</span></div>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider mb-2">Matched Skills</div>
                  <div className="flex flex-wrap gap-2">{(selectedCandidate as any).matchTags.map((t: string) => <span key={t} className="px-3 py-1.5 bg-gold/10 text-gold border border-gold/20 text-xs rounded-lg font-mono flex items-center"><CheckCircle className="w-3 h-3 mr-1.5" />{t}</span>)}</div>
                </div>
                {(selectedCandidate as any).salaryExpectation && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-mono text-white/40 mb-1">Expected CTC</div>
                    <div className="font-serif text-2xl text-white">{formatLPA((selectedCandidate as any).salaryExpectation)}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{formatINR((selectedCandidate as any).salaryExpectation)} per annum</div>
                  </div>
                )}
                <div className="flex space-x-3 pt-2">
                  <button onClick={() => { setSelectedCandidate(null); startInterview(selectedCandidate); }}
                    className="flex-1 bg-gold text-ink py-3 rounded-xl font-bold text-sm hover:bg-gold/90 flex items-center justify-center">
                    <Brain className="w-4 h-4 mr-2" />Start AI Interview
                  </button>
                  <button onClick={() => handleInvite(selectedCandidate as any)} disabled={!!isInviting}
                    className="flex-1 border border-white/10 py-3 rounded-xl font-bold text-sm text-white/50 hover:text-white hover:border-white/20 flex items-center justify-center disabled:opacity-50">
                    {isInviting === (selectedCandidate as any).id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2 text-gold/60" />}
                    Send AI Invite (SES)
                  </button>
                </div>
              </div>
              <div className="w-64 bg-white/3 rounded-2xl border border-white/5 p-5 flex flex-col items-center flex-shrink-0">
                <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4 self-start">5-Axis Radar</div>
                <div className="w-full flex-1 flex items-center justify-center">
                  <RadarChart data={(selectedCandidate as any).score} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════ POST-INTERVIEW RATING MODAL ══════════════════ */}
      {showReport && interviewCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#111009] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-8 relative">
            <button onClick={() => setShowReport(false)} className="absolute top-6 right-6 text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
            
            <h3 className="font-serif text-3xl text-white mb-2">Finalize Evaluation</h3>
            <p className="text-white/40 text-sm mb-8 font-mono">Candidate: <span className="text-gold">{interviewCandidate.name}</span></p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest block mb-4">Recruiter Rating</label>
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className={`p-3 rounded-xl border transition-all ${rating >= s ? 'bg-gold/20 border-gold/50 text-gold shadow-[0_0_15px_rgba(200,168,75,0.2)]' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20'}`}>
                      <Star className={`w-7 h-7 ${rating >= s ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest block mb-3">Interview Summary & Notes</label>
                <textarea 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Summarize your overall impression of the candidate's performance, cultural fit, and potential for the team..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder:text-white/20 min-h-[120px] focus:outline-none focus:border-gold/40 transition-all"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button onClick={handleSaveRating} className="flex-1 bg-gold text-ink font-bold py-4 rounded-2xl hover:bg-gold/90 transition-all flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 mr-3" />Save & Complete Interview
                </button>
                <button onClick={() => setShowReport(false)} className="px-6 border border-white/10 text-white/50 rounded-2xl hover:text-white hover:border-white/20 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ VIEW PAPER MODAL ══════════════════ */}
      {showViewPaperModal && qualifiedAcademia[0]?.academicAssessment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/85 backdrop-blur-2xl" onClick={() => setShowViewPaperModal(false)}>
          <div className="bg-[#11100D] border border-white/10 w-full max-w-3xl rounded-[40px] overflow-hidden max-h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div>
                <h3 className="font-serif text-2xl text-white">Standardized Technical Paper</h3>
                <p className="text-xs text-gold font-mono uppercase tracking-widest mt-1 italic">Assigned to Batch: {qualifiedAcademia[0].role}</p>
              </div>
              <button onClick={() => setShowViewPaperModal(false)} className="text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="bg-gold/5 border border-gold/10 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <VettingBadge variant="gold" label="AI CALIBRATED" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">10 Questions · Standard Benchmark</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed italic">This paper has been generated based on the active Job Description to ensure all candidates meet the same technical bar.</p>
              </div>

              {qualifiedAcademia[0]?.academicAssessment?.questions?.map((q: any, i: number) => (
                <div key={q.id} className="space-y-4 bg-white/3 border border-white/5 p-8 rounded-3xl group hover:border-white/10 transition-all">
                  <div className="flex items-start gap-5">
                    <span className="bg-white/10 text-white/40 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 group-hover:bg-gold group-hover:text-ink transition-all">{i + 1}</span>
                    <div className="space-y-4 flex-1">
                      <h4 className="text-lg text-white font-medium leading-snug">{q.question}</h4>
                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-2 gap-3">
                          {q.options.map((opt: string) => (
                            <div key={opt} className={`px-4 py-3 rounded-xl border text-xs font-medium ${opt === q.correctAnswer ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-black/20 border-white/5 text-white/40'}`}>
                              {opt} {opt === q.correctAnswer && <CheckCircle className="w-3 h-3 inline ml-2" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'text' && (
                        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Expected Logic / Answer Key</div>
                          <p className="text-xs text-sage italic opacity-80">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-white/5 bg-white/2 flex justify-end">
              <button onClick={() => setShowViewPaperModal(false)} className="bg-white/10 text-white px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

