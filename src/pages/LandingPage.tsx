import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Clock,
  Search,
  ChevronRight,
  Layers,
  Calculator,
  Users,
  ArrowRight,
  TrendingUp,
  Workflow,
  Sparkles,
  Database,
  Lock,
  Link,
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  Activity,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import dashboardImg from '@/assets/dashboard.png';

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Scroll detection for Dynamic Island Navbar
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic Priority Calculator State for Interactive Demo
  const [basePriority, setBasePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [slaUrgency, setSlaUrgency] = useState<'NORMAL' | 'NEAR_BREACH' | 'BREACHED'>('NORMAL');
  const [downstreamTasks, setDownstreamTasks] = useState<number>(2);
  const [impact, setImpact] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive Calculator Logic matching backend formulas
  const calculateScore = () => {
    let score = 0;

    // Base Priority Score
    const baseMap = { LOW: 10, MEDIUM: 30, HIGH: 60, CRITICAL: 90 };
    score += baseMap[basePriority];

    // SLA Urgency Score (SLA Status adds offset)
    if (slaUrgency === 'NEAR_BREACH') score += 20;
    else if (slaUrgency === 'BREACHED') score += 40;

    // Downstream Dependency weight (downstream block multiplier)
    score += downstreamTasks * 15;

    // Impact Score (Organizational weight)
    const impactMap = { LOW: 5, MEDIUM: 15, HIGH: 30 };
    score += impactMap[impact];

    return Math.min(score, 200); // capped at 200 max
  };

  const score = calculateScore();
  const getPriorityLabel = (s: number) => {
    if (s < 40) return { label: 'LOW', color: 'text-green-600 bg-green-50 border-green-200', darkColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30', led: 'bg-emerald-400' };
    if (s < 90) return { label: 'MEDIUM', color: 'text-amber-600 bg-amber-50 border-amber-200', darkColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30', led: 'bg-amber-400' };
    if (s < 140) return { label: 'HIGH', color: 'text-orange-600 bg-orange-50 border-orange-200', darkColor: 'text-orange-400 bg-orange-950/40 border-orange-500/30', led: 'bg-orange-400' };
    return { label: 'CRITICAL', color: 'text-red-600 bg-red-50 border-red-200', darkColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30', led: 'bg-rose-400' };
  };

  const priorityResult = getPriorityLabel(score);

  // Pseudo-Execution Logs for the Terminal View
  const getExecutionLogs = () => {
    return [
      `[GATEWAY] Ingested evaluation trigger...`,
      `[ENGINE] Evaluated base priority: ${basePriority} (${basePriority === 'LOW' ? 10 : basePriority === 'MEDIUM' ? 30 : basePriority === 'HIGH' ? 60 : 90} pts)`,
      `[SLA_MONITOR] SLA Urgency offset: ${slaUrgency} (${slaUrgency === 'NEAR_BREACH' ? '+20' : slaUrgency === 'BREACHED' ? '+40' : '+0'} pts)`,
      `[CASCADE] Processed ${downstreamTasks} downstream blocked tasks (${downstreamTasks * 15} pts)`,
      `[IMPACT] Analyzed organizational weight: ${impact} (${impact === 'LOW' ? 5 : impact === 'MEDIUM' ? 15 : 30} pts)`,
      `[LEDGER] Dynamic Priority compiled successfully: ${score} / 200`
    ];
  };

  // Enterprise FAQ Data
  const faqs = [
    {
      q: "How does the Dynamic Priority Engine compute priority scores?",
      a: "The engine uses a rigorous additive-multiplier model. It takes a Task's Base Priority (10-90 severity points), checks for near/breached SLAs to append latency penalties (+20/40 points), adds downstream dependency block counts (15 points per blocked task), and factors in overall organizational impact (5-30 points) to compile a final capped priority value of 0-200."
    },
    {
      q: "What makes the Activity History cryptographically secure?",
      a: "Every transaction, update, or change logs directly as a sequential node block. The system computes a unique SHA-256 hash using the previous block's hash, current sequence, timestamps, and active user details. Administrators can trigger a complete integrity verification in the frontend toolbar to validate hashes in milliseconds and detect unauthorized changes."
    },
    {
      q: "How are SLAs paused and monitored?",
      a: "The portal monitors response and resolution due times. Whenever a task is marked as blocked or pending external ordered approvals, the SLA timer is safely suspended to preserve operational compliance. The timeline automatically resumes once downstream bottlenecks resolve."
    },
    {
      q: "How does Vector AI Semantic Intelligence function without keyword queries?",
      a: "Our system generates high-dimensional mathematical vector embeddings of tasks and epic notes. When you conceptually search for a task (e.g. 'user credentials latency'), the model performs a cosine similarity analysis to surface contextually related tasks and suggested projects, even if they share zero keyword matches."
    }
  ];

  return (
    <div className="min-h-screen bg-olive-50 institutional-grid overflow-hidden selection:bg-olive-200 selection:text-olive-900 pb-0">

      {/* Floating Dynamic Island Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={`pointer-events-auto flex items-center justify-between transition-all duration-500 ease-in-out ${isScrolled
              ? "w-[92%] md:w-[65%] max-w-4xl rounded-full py-2.5 px-6 bg-olive-950/95 text-white shadow-2xl backdrop-blur-xl border border-white/10"
              : "w-full max-w-7xl rounded-2xl py-4 px-8 bg-white/80 text-olive-950 shadow-sm backdrop-blur-md border border-olive-200/50"
            }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg flex items-center justify-center transition-all ${isScrolled ? "bg-white text-olive-950" : "bg-olive-900 text-white"
              }`}>
              <Layers className="w-4 h-4" />
            </div>
            <span className={`font-display font-black text-sm tracking-widest transition-all ${isScrolled ? "text-white" : "text-olive-900"
              }`}>SYNC TODO</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className={`text-xs font-mono tracking-wider transition-colors ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-600 hover:text-olive-950"
              }`}>FEATURES</a>
            <a href="#matrix" className={`text-xs font-mono tracking-wider transition-colors ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-600 hover:text-olive-950"
              }`}>COMPARE</a>
            <a href="#demo" className={`text-xs font-mono tracking-wider transition-colors ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-600 hover:text-olive-950"
              }`}>CALCULATOR</a>
            <a href="#governance" className={`text-xs font-mono tracking-wider transition-colors ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-600 hover:text-olive-950"
              }`}>GOVERNANCE</a>
            <a href="#faq" className={`text-xs font-mono tracking-wider transition-colors ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-600 hover:text-olive-950"
              }`}>FAQ</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className={`py-1.5 px-4 rounded-full font-bold text-xs flex items-center gap-1 transition-all ${isScrolled
                    ? "bg-white text-olive-950 hover:bg-olive-100"
                    : "bg-olive-700 text-white hover:bg-olive-800"
                  }`}
              >
                Launch App <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={`text-xs font-bold transition-all ${isScrolled ? "text-white/70 hover:text-white" : "text-olive-700 hover:text-olive-950"
                    }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className={`py-1.5 px-4 rounded-full font-bold text-xs transition-all ${isScrolled
                      ? "bg-white text-olive-950 hover:bg-olive-100"
                      : "bg-olive-700 text-white hover:bg-olive-800"
                    }`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </motion.header>
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 text-center max-w-7xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-olive-950 max-w-5xl mx-auto leading-none">
            Deep Operational Architecture.<br />
            <span className="text-gradient">Govern tasks with absolute certitude.</span>
          </h1>

          <p className="text-base md:text-lg text-olive-600 max-w-3xl mx-auto leading-relaxed">
            Sync Todo bridges collaborative task coordination with mathematical priority simulation, microsecond SLA audit tracks, cryptographically chained sequence governance, and vector intelligence suggestions.
          </p>

          {/* Institutional KPI Stats Badges */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 py-6">
            <div className="text-center">
              <div className="text-2xl md:text-2xl font-bold text-olive-900">100%</div>
              <div className="text-[10px] text-olive-400 uppercase tracking-widest mt-1">Tamper Proof Auditing</div>
            </div>
            <div className="text-center border-x border-olive-200/50">
              <div className="text-2xl md:text-2xl font-bold text-olive-900">0.0ms</div>
              <div className="text-[10px] text-olive-400 uppercase tracking-widest mt-1">Priority Calculation Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-2xl font-bold text-olive-900">99.98%</div>
              <div className="text-[10px] text-olive-400 uppercase tracking-widest mt-1">SLA Compliance Ratio</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="btn-primary text-base px-8 py-3.5 shadow-xl shadow-olive-900/10"
            >
              Get Started Free <ChevronRight className="w-5 h-5" />
            </button>
            <a
              href="#demo"
              className="btn-secondary text-base px-8 py-3.5"
            >
              Try Interactive Calculator
            </a>
          </div>
        </motion.div>

        {/* Dashboard Screenshot Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-olive-200/80 bg-white p-2 shadow-2xl shadow-olive-900/5 overflow-hidden group perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-olive-50/50 via-transparent to-transparent z-10 pointer-events-none" />
          <img
            src={dashboardImg}
            alt="Sync Todo Dashboard Page Mockup"
            className="w-full h-auto rounded-xl border border-olive-100 shadow-inner group-hover:scale-[1.005] transition-transform duration-700"
          />
        </motion.div>
      </section>

      {/* Core Features Bento Grid */}
      <section id="features" className="py-24 bg-white border-y border-olive-200/50 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-olive-950 tracking-tight">
              An Exhaustive Breakdown of Capabilities
            </h2>
            <p className="text-olive-500 text-sm md:text-base max-w-2xl mx-auto">
              We cover every administrative, intelligence, and operational workflow implemented inside Sync Todo. No generic lists, only precise technical features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* 1. Dynamic Priority Engine Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl w-fit">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Dynamic Priority Engine</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Real-time recalculation of task priority based on an exact mathematical combination of base severity, organization impact weights, SLA urgency offsets, and cascading downstream dependency calculations. Evaluates bottleneck tasks blocking multiple active team deliverables.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>Global mass recalculation option next to refresh</li>
                  <li>Real-time priority breakdowns in Task Inspector</li>
                  <li>Capped evaluation scale (0 - 200)</li>
                </ul>
              </div>
            </div>

            {/* 2. Micro-SLA Management Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl w-fit">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Micro-SLA Breach Tracking</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Rigorous timers measuring both First Response due times and Resolution due times. Keeps close logs of completion times, SLA statuses (Breached, Near Breach, Met), and pauses due timers whenever task execution is blocked.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>First response date logging in settings</li>
                  <li>SLA dashboard panel summarizing breach ratios</li>
                  <li>Compact badge indicators showing remaining time</li>
                </ul>
              </div>
            </div>

            {/* 3. Cryptographic Activity History Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Cryptographic Governance</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Compliance validation through SHA-256 block hash chaining. Every project operation (creation, deletions, note updates, team modifications) receives sequential ID hashes, preventing administrative log manipulation.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>On-demand audit chain integrity validation</li>
                  <li>Customizable project retention policies (days)</li>
                  <li>Legal Hold locks to prevent data deletion</li>
                </ul>
              </div>
            </div>

            {/* 4. AI-Powered Semantic Intelligence Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl w-fit">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Semantic AI Intelligence</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Go beyond keyword matching. Leverage built-in vector embeddings to semantically query tasks, discover cross-project task suggestions, and automatically align work notes using semantic similarity algorithms.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>Semantic search interface for conceptual matches</li>
                  <li>AI task and note relationship matching suggestions</li>
                  <li>Vector distance visualizations</li>
                </ul>
              </div>
            </div>

            {/* 5. Ordered Approval Workflows Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl w-fit">
                  <Workflow className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Ordered Approval Workflows</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Restricts sensitive operations (such as legal hold overrides, priority updates, and settings changes) using structured multi-approver chains. Every change request requires ordered, sequential team consensus.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>Request modal targeting specific team members</li>
                  <li>Actionable pending approval banners</li>
                  <li>State tracking (Pending, Approved, Rejected, Cancelled)</li>
                </ul>
              </div>
            </div>

            {/* 6. Collaborative Project Workspace Card */}
            <div className="bento-item flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl w-fit">
                  <Database className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-olive-900">Structured Workspace</h3>
                <p className="text-xs text-olive-600 leading-relaxed">
                  Complete operational coordination via highly responsive Kanban boards and list layouts. Break deliverables into Epics, edit subtasks inline, compile rich markdown work notes, and discuss changes over task comments.
                </p>
                <ul className="text-[11px] text-olive-500 space-y-1 pl-4 list-disc">
                  <li>Real-time sync via WebSocket integration</li>
                  <li>Robust member management and task assignments</li>
                  <li>Sober, professional layout focusing on typography</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Feature Matrix Section */}
      <section id="matrix" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="system-label text-olive-500">How We Stand Out</span>
          <h2 className="text-3xl md:text-4xl font-black text-olive-950 tracking-tight">
            Sync Todo vs Legacy Task Managers
          </h2>
          <p className="text-olive-600 text-sm md:text-base max-w-2xl mx-auto">
            Traditional todo lists rely on basic tags and manual sorting. Sync Todo implements strict cryptographically governed operations and mathematical priority routing.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-olive-200 shadow-xl bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-olive-900 text-white font-mono text-xs uppercase tracking-wider">
                <th className="p-5 font-bold">Advanced Capabilities</th>
                <th className="p-5 font-bold">Standard Task Tool</th>
                <th className="p-5 font-bold text-amber-400">Sync Todo Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-100">
              <tr>
                <td className="p-5 font-bold text-olive-900">Task Priority Calculations</td>
                <td className="p-5 text-olive-500">Static (Low/Med/High text dropdown)</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Dynamic Score Engine (0-200) based on SLAs, impacts, downstream counts
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-olive-900">Activity Log Compliance</td>
                <td className="p-5 text-olive-500">Plain Database Logs (modifiable by admins)</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-2" />
                  Immutable SHA-256 block-hash chaining with on-demand tampering verification
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-olive-900">SLA Breach Tracking</td>
                <td className="p-5 text-olive-500">Basic due dates with no response tracking</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50">
                  Dual-timer tracking (First Response & Resolution due times) + Block pause states
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-olive-900">Sensitive Action Control</td>
                <td className="p-5 text-olive-500">None (Anyone with write access can edit anything)</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50">
                  <Workflow className="w-4 h-4 text-violet-500 inline mr-2" />
                  Sequential ordered team approval chains for escalations and overrides
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-olive-900">AI Assistance</td>
                <td className="p-5 text-olive-500">Basic keyword search filters</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50">
                  Vector similarity queries, cross-project suggestions, semantic note matching
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-olive-900">Real-time Task Board</td>
                <td className="p-5 text-olive-500">Requires manual browser refresh</td>
                <td className="p-5 text-olive-800 font-bold bg-olive-50/50">
                  Socket.io-based immediate synchronizations across collaborative teams
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Dynamic Visual Operations Pipeline Section */}
      <section className="py-24 px-6 bg-white border-y border-olive-200/50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="system-label text-olive-500">System Architecture</span>
            <h2 className="text-3xl md:text-4xl font-black text-olive-950 tracking-tight">
              Dynamic Operations Flow
            </h2>
            <p className="text-olive-600 text-sm md:text-base max-w-2xl mx-auto">
              Behind the scenes, Sync Todo synchronizes user actions, priority calculations, and security signatures in a unified high-speed pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 bg-olive-50/50 border border-olive-200 rounded-xl relative group hover:border-olive-400 hover:bg-olive-50 transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-olive-900 text-white font-mono text-xs flex items-center justify-center font-bold">1</div>
              <div className="space-y-3 pt-2">
                <div className="p-2 bg-olive-900 text-white rounded w-fit"><Activity className="w-4 h-4" /></div>
                <h4 className="font-bold text-olive-900 text-sm">Action Ingestion</h4>
                <p className="text-xs text-olive-600 leading-relaxed">Task creation, subtask updates, or note configurations hit the gateway controller via Secure WebSocket streams.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-olive-50/50 border border-olive-200 rounded-xl relative group hover:border-olive-400 hover:bg-olive-50 transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-olive-900 text-white font-mono text-xs flex items-center justify-center font-bold">2</div>
              <div className="space-y-3 pt-2">
                <div className="p-2 bg-olive-900 text-white rounded w-fit"><Calculator className="w-4 h-4" /></div>
                <h4 className="font-bold text-olive-900 text-sm">Priority Optimization</h4>
                <p className="text-xs text-olive-600 leading-relaxed">The Priority Engine recalculates scores using base parameters, active SLA durations, and cascading downstream blocked dependencies.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-olive-50/50 border border-olive-200 rounded-xl relative group hover:border-olive-400 hover:bg-olive-50 transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-olive-900 text-white font-mono text-xs flex items-center justify-center font-bold">3</div>
              <div className="space-y-3 pt-2">
                <div className="p-2 bg-olive-900 text-white rounded w-fit"><ShieldCheck className="w-4 h-4" /></div>
                <h4 className="font-bold text-olive-900 text-sm">Ledger Verification</h4>
                <p className="text-xs text-olive-600 leading-relaxed">The activity commits to the chronological database. The system appends a sequential sequence ID and locks the hash pointer.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-olive-50/50 border border-olive-200 rounded-xl relative group hover:border-olive-400 hover:bg-olive-50 transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-olive-900 text-white font-mono text-xs flex items-center justify-center font-bold">4</div>
              <div className="space-y-3 pt-2">
                <div className="p-2 bg-olive-900 text-white rounded w-fit"><Users className="w-4 h-4" /></div>
                <h4 className="font-bold text-olive-900 text-sm">Consensus Dispatch</h4>
                <p className="text-xs text-olive-600 leading-relaxed">Changes stream immediately to all project members. Bypasses normal database sync lag for optimal group transparency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section id="demo" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="system-label text-olive-500">Live Simulator</span>
          <h2 className="text-3xl md:text-4xl font-black text-olive-950 tracking-tight">
            See the Priority Engine in Action
          </h2>
          <p className="text-olive-600 text-sm md:text-base max-w-xl mx-auto">
            Interact with the factors that drive our dynamic evaluation score. Watch priority ratings update live based on backend logic.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 bg-white/60 backdrop-blur-xl border border-olive-200/60 p-8 md:p-12 shadow-[0_20px_50px_rgba(40,55,30,0.06)] rounded-3xl relative overflow-hidden">
          {/* Controls */}
          <div className="space-y-8 pr-2">
            <div className="space-y-2">
              <span className="bg-olive-100 border border-olive-200/50 text-olive-800 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-olive-600" /> Evaluation Simulator
              </span>
              <h3 className="text-2xl font-black text-olive-950 tracking-tight">
                Evaluation Inputs
              </h3>
            </div>

            {/* Base Priority */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold text-olive-500 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-olive-400" /> Base Priority
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(p => {
                  const activeStyles = {
                    LOW: basePriority === 'LOW' ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    MEDIUM: basePriority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-800 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    HIGH: basePriority === 'HIGH' ? 'bg-orange-500/10 text-orange-800 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    CRITICAL: basePriority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-800 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => setBasePriority(p)}
                      className={`py-2.5 text-[10px] font-mono font-bold border rounded-xl transition-all duration-300 ${activeStyles[p]}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SLA Urgency */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold text-olive-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-olive-400" /> SLA Urgency
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['NORMAL', 'NEAR_BREACH', 'BREACHED'] as const).map(u => {
                  const activeStyles = {
                    NORMAL: slaUrgency === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    NEAR_BREACH: slaUrgency === 'NEAR_BREACH' ? 'bg-orange-500/10 text-orange-800 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    BREACHED: slaUrgency === 'BREACHED' ? 'bg-rose-500/10 text-rose-800 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                  };
                  return (
                    <button
                      key={u}
                      onClick={() => setSlaUrgency(u)}
                      className={`py-2.5 text-[10px] font-mono font-bold border rounded-xl transition-all duration-300 ${activeStyles[u]}`}
                    >
                      {u.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impact */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold text-olive-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3 text-olive-400" /> Organizational Impact
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(i => {
                  const activeStyles = {
                    LOW: impact === 'LOW' ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    MEDIUM: impact === 'MEDIUM' ? 'bg-amber-500/10 text-amber-800 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                    HIGH: impact === 'HIGH' ? 'bg-orange-500/10 text-orange-800 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.15)] scale-[1.02]' : 'bg-olive-50/40 text-olive-600 border-olive-200/60 hover:border-olive-400 hover:bg-white',
                  };
                  return (
                    <button
                      key={i}
                      onClick={() => setImpact(i)}
                      className={`py-2.5 text-[10px] font-mono font-bold border rounded-xl transition-all duration-300 ${activeStyles[i]}`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Downstream Tasks Dependency Slider */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-olive-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-olive-400" /> Downstream Blocked Tasks</span>
                <span className="bg-olive-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[10px] shadow-sm">{downstreamTasks} {downstreamTasks === 1 ? 'Task' : 'Tasks'}</span>
              </div>
              <div className="relative pt-1">
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={downstreamTasks}
                  onChange={(e) => setDownstreamTasks(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-olive-100 rounded-lg appearance-none cursor-pointer accent-olive-900 focus:outline-none border border-olive-200/50"
                />
                <div className="flex justify-between px-1 mt-2 text-[9px] font-mono font-bold text-olive-400 select-none">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((val) => (
                    <span
                      key={val}
                      className={`transition-all duration-300 ${
                        downstreamTasks === val ? 'text-olive-950 scale-125 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-olive-400/70'
                      }`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result Output Screen with Live Terminal Execution Console */}
          <div className="flex flex-col justify-between p-8 bg-neutral-950 text-white rounded-3xl border border-neutral-800/80 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.35)] min-h-[480px]">
            {/* Ambient glowing radial shapes */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30 z-0" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700 z-0" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700 z-0" />

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center border-b border-neutral-800/80 pb-4">
                <span className="text-[10px] font-mono font-bold text-white/40 tracking-widest">CALCULATED SCORE</span>
                <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold font-mono tracking-wider drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                  <TrendingUp className="w-3.5 h-3.5" /> DYNAMIC ENGINE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <div className="text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.35)] select-none flex items-baseline">
                    {score}
                    <span className="text-lg text-white/30 font-normal ml-1">/200</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/40">Capped cumulative rating</p>
                </div>

                {/* Score Status Badge */}
                <div className="flex flex-col items-end">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Engine Status</div>
                  <div className={`text-[10px] mt-1.5 px-3 py-1.5 border rounded-xl font-mono font-black uppercase flex items-center gap-2 transition-all duration-300 ${priorityResult.darkColor || 'text-rose-400 bg-rose-950/40 border-rose-500/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-ping ${priorityResult.led || 'bg-rose-400'}`} />
                    {priorityResult.label}
                  </div>
                </div>
              </div>

              {/* Score Meter Visualizer */}
              <div className="space-y-2.5">
                <div className="w-full bg-neutral-900 border border-neutral-800/80 rounded-full h-2.5 overflow-hidden p-[2px]">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{ width: `${(score / 200) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/30 font-mono font-bold tracking-wider select-none">
                  <span>0 (LOW)</span>
                  <span>100 (HIGH)</span>
                  <span>200 (CRITICAL)</span>
                </div>
              </div>

              {/* Technical Execution Console Terminal Output */}
              <div className="bg-black/90 rounded-2xl border border-neutral-800/85 p-5 mt-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] font-mono text-[10px] leading-relaxed relative">
                <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2.5 mb-3 text-white/30">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 mr-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> ENGINE_CONSOLE_V4.2</span>
                  </div>
                  <span className="text-[8px] bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-emerald-400 font-bold tracking-wider">LIVE EVAL</span>
                </div>
                <div className="space-y-1.5 text-emerald-400/90 font-mono">
                  {getExecutionLogs().map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-white/20 select-none w-4">{String(i + 1).padStart(2, '0')}</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 pl-6 pt-0.5">
                    <span className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 relative z-10">
              <button
                onClick={() => navigate('/register')}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-mono text-xs font-bold tracking-widest uppercase rounded-xl transition-all duration-300 hover:from-emerald-400 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.45)] transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Deploy Engine Now <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Crypto Ledger Diagram Section */}
      <section id="governance" className="py-24 bg-neutral-950 border-t border-neutral-900 text-white relative overflow-hidden">
        {/* Ambient Grid overlay and glowing vector shapes */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.04),transparent_60%)] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="system-label text-[9px] text-white/80 tracking-widest">Compliance First</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              Rigorous Security &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">Activity Governance</span>
            </h2>
            <p className="text-sm md:text-base text-white/70 leading-relaxed max-w-xl">
              Every audit track, member sign-off, or project settings change is logged inside a non-repudiable audit chain. With cryptographically sealed logs, administrators can confirm chronological compliance in seconds.
            </p>

            <div className="space-y-6 pt-6">
              <div className="group flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 hover:bg-white/[0.04] shadow-lg shadow-black/10">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 mt-1 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm transition-colors duration-300 group-hover:text-emerald-300">Legal Hold Controls</h4>
                  <p className="text-xs text-white/50 leading-relaxed">Prevent critical record purge during high-stakes compliance evaluations.</p>
                </div>
              </div>
              <div className="group flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all duration-300 hover:bg-white/[0.04] shadow-lg shadow-black/10">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 mt-1 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:border-amber-500/40">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm transition-colors duration-300 group-hover:text-amber-300">Ordered Sign-Off Chains</h4>
                  <p className="text-xs text-white/50 leading-relaxed">Require multi-step approvals for priority adjustments or regulatory changes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Cryptographic Ledger Visualizer */}
          <div className="w-full flex flex-col gap-5 p-8 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 rounded-3xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-neutral-800/85 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">LEDGER INTEGRITY VERIFIED</span>
              </div>
              <div className="p-1.5 bg-emerald-950/40 border border-emerald-800/30 rounded text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {/* Block 01 - Genesis */}
            <div className="group flex items-center justify-between p-5 bg-neutral-950/80 border border-neutral-800 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/50" />
              <div className="space-y-1.5 pl-2">
                <div className="text-[9px] font-mono text-emerald-500 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                  <Database className="w-3 h-3" /> Block #001 (Genesis)
                </div>
                <div className="text-xs font-bold text-white font-mono tracking-tight">SEQ_NO: 1 | ACTION: CREATE_PROJECT</div>
              </div>
              <div className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 px-3 py-1 rounded-lg shadow-sm">
                SHA-256: 8a7f...d49e
              </div>
            </div>

            {/* Neon Connection 1 -> 2 */}
            <div className="flex justify-center -my-3.5 relative z-10">
              <div className="h-7 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-500 relative flex items-center justify-center">
                <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>

            {/* Block 02 */}
            <div className="group flex items-center justify-between p-5 bg-neutral-950/80 border border-neutral-800 hover:border-teal-500/30 rounded-2xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1 bg-teal-500/50" />
              <div className="space-y-1.5 pl-2">
                <div className="text-[9px] font-mono text-teal-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                  <Activity className="w-3 h-3" /> Block #002
                </div>
                <div className="text-xs font-bold text-white font-mono tracking-tight">SEQ_NO: 2 | ACTION: EVALUATE_PRIORITY</div>
              </div>
              <div className="text-[10px] font-mono bg-teal-950/80 text-teal-400 border border-teal-900/60 px-3 py-1 rounded-lg shadow-sm">
                SHA-256: 3c9b...81ea
              </div>
            </div>

            {/* Neon Connection 2 -> 3 */}
            <div className="flex justify-center -my-3.5 relative z-10">
              <div className="h-7 w-0.5 bg-gradient-to-b from-teal-500 to-amber-500 relative flex items-center justify-center animate-pulse">
                <div className="absolute w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-60" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              </div>
            </div>

            {/* Block 03 (Pending/Active) */}
            <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-amber-500/[0.03] to-amber-500/[0.08] border border-amber-500/30 rounded-2xl transition-all duration-300 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.06)] animate-[pulse_3s_infinite_ease-in-out]">
              <div className="absolute top-0 left-0 h-full w-1 bg-amber-500 animate-pulse" />
              <div className="space-y-1.5 pl-2">
                <div className="text-[9px] font-mono text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                  <Workflow className="w-3 h-3" /> Block #003
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div className="text-xs font-bold text-white font-mono tracking-tight">SEQ_NO: 3 | ACTION: LEGAL_HOLD_ON</div>
              </div>
              <div className="text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/60 px-3 py-1 rounded-lg shadow-sm">
                SHA-256: e2d4...91bc
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise FAQ Accordion Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="system-label text-olive-500">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-black text-olive-950 tracking-tight">
            Technical Frequently Asked Questions
          </h2>
          <p className="text-olive-600 text-sm md:text-base max-w-xl mx-auto">
            Get comprehensive, direct answers on the underlying engineering decisions and capabilities of the portal.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-olive-200 shadow-sm overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-olive-900 hover:bg-olive-50/50 transition-colors"
              >
                <span className="text-sm md:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-olive-400 flex-shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-olive-500 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''
                  }`} />
              </button>

              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-olive-100"
                  >
                    <p className="p-6 text-xs md:text-sm text-olive-600 leading-relaxed bg-olive-50/20">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Massive Detailed Multi-Column Enterprise Footer */}
      <footer className="bg-olive-950 text-white pt-24 pb-12 border-t border-olive-900">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

            {/* Column 1: Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white text-olive-950 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-display font-black text-sm tracking-wider">SYNC TODO</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Enterprise task intelligence, micro-SLA timelines, and immutable cryptographic chains for compliant engineering groups.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono text-white/50">ALL REGULATORY SYSTEMS OPERATIONAL</span>
              </div>
            </div>

            {/* Column 2: Operational Engine */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">Operational Engine</h4>
              <ul className="text-xs text-white/60 space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Dynamic Priority Matrix</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Cascading Downstream Count</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Microsecond Resolution SLA</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">First Response Timers</a></li>
              </ul>
            </div>

            {/* Column 3: Compliance & Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Security & Ledger</h4>
              <ul className="text-xs text-white/60 space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">SHA-256 Log Hash Chain</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">On-Demand Verification</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Legal Retention Holds</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Ordered Approval Consensus</a></li>
              </ul>
            </div>

            {/* Column 4: Platform Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Resources</h4>
              <ul className="text-xs text-white/60 space-y-2">
                <li><a href="/sdk-docs" className="hover:text-white transition-colors flex items-center gap-1">Developer SDK Docs <ArrowUpRight className="w-3 h-3 text-white/40" /></a></li>
                <li><a href="/intelligence" className="hover:text-white transition-colors">Semantic Indexer</a></li>
                <li><a href="#matrix" className="hover:text-white transition-colors">Capability Matrix</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Engine Simulator</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright and Legal Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-white/40">
            <div>
              &copy; {new Date().getFullYear()} Sync Todo Inc. All institutional and cryptographic rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Security Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Operations</a>
              <a href="#" className="hover:text-white transition-colors">Audit Ledger Whitepaper</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
