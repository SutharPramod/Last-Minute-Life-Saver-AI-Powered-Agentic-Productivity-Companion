import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  orderBy,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "./firebase";
import { Task, BoardroomAnalysis } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TaskBoard from "./components/TaskBoard";
import Boardroom from "./components/Boardroom";
import CalendarView from "./components/CalendarView";
import HabitsTracker from "./components/HabitsTracker";
import Analytics from "./components/Analytics";
import VoiceAssistant from "./components/VoiceAssistant";
import { 
  ShieldAlert, 
  Sparkles, 
  Lock, 
  Mail, 
  Key, 
  ArrowRight,
  User as UserIcon,
  Activity
} from "lucide-react";

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation state
  const [activeTab, setActiveTab] = useState("dashboard");

  // App core task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Multi-agent AI insights state
  const [urgencyIndex, setUrgencyIndex] = useState(45);
  const [stressLevel, setStressLevel] = useState("Moderate");
  const [insights, setInsights] = useState<string[]>([
    "Pay Q2 Server Infrastructure Bill requires your immediate focus. Hours remaining is less than 6 hours.",
    "Your work and academic targets are tightly clustered on Friday. Consider splitting the 'Draft Client Pitch Deck' task early.",
    "No current habit failures detected. Maintain your procrastination shield streak!"
  ]);

  const [aiLoading, setAiLoading] = useState(false);

  // Boardroom debate chat state
  const [boardroomData, setBoardroomData] = useState<BoardroomAnalysis | null>(null);
  const [boardroomLoading, setBoardroomLoading] = useState(false);

  // Monitor Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync tasks when authorized user changes
  useEffect(() => {
    if (user) {
      loadUserTasks(user.uid);
    } else {
      setTasks([]);
    }
  }, [user]);

  // Fetch or Seed user tasks from Firestore
  const loadUserTasks = async (uid: string) => {
    setTasksLoading(true);
    try {
      if (uid === "local-sandbox") {
        const stored = localStorage.getItem("local_sandbox_tasks");
        if (stored) {
          setTasks(JSON.parse(stored));
        } else {
          const seeded = seedInitialTasksLocal();
          setTasks(seeded);
          localStorage.setItem("local_sandbox_tasks", JSON.stringify(seeded));
        }
      } else {
        const q = query(collection(db, "tasks"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const loaded: Task[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });

        if (loaded.length === 0) {
          // Seed initial mock tasks to demonstrate immediate value
          const seeded = await seedInitialTasks(uid);
          setTasks(seeded);
        } else {
          setTasks(loaded);
        }
      }
    } catch (err) {
      console.error("Error loading tasks: ", err);
    } finally {
      setTasksLoading(false);
    }
  };

  // Seed Helper for local sandbox
  const seedInitialTasksLocal = (): Task[] => {
    return [
      {
        id: "seeded-local-1",
        userId: "local-sandbox",
        title: "Pay Q2 Server Infrastructure Bill",
        description: "Verify automatic transaction ledger to prevent high-traffic failover downtime.",
        category: "bills",
        priority: "critical",
        estimatedHours: 0.5,
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "low",
        riskScore: 92,
        riskAnalysis: "Imminent transaction cutoff in less than 6 hours. Leaving this until the last hour leaves zero time for banking troubleshooting."
      },
      {
        id: "seeded-local-2",
        userId: "local-sandbox",
        title: "Draft Client Pitch Deck",
        description: "Prepare dynamic slides outlining budget projections, deployment timelines, and core MVP specs.",
        category: "work",
        priority: "high",
        estimatedHours: 4,
        deadline: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 days from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "high",
        riskScore: 65,
        riskAnalysis: "Intimidating deck scope creates high initial friction. Break it into micro-sections early to lock in inertia."
      },
      {
        id: "seeded-local-3",
        userId: "local-sandbox",
        title: "Prepare for Technical Architecture Interview",
        description: "Review cloud design architectures, microservice patterns, scaling rules, and load balancers.",
        category: "interviews",
        priority: "medium",
        estimatedHours: 3,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "medium",
        riskScore: 25,
        riskAnalysis: "Broad concept scope leads to vague start dates. Use AI Breakdowns to pick a single focused topic."
      }
    ];
  };

  // Seed Helper
  const seedInitialTasks = async (uid: string): Promise<Task[]> => {
    const initialSeed = [
      {
        title: "Pay Q2 Server Infrastructure Bill",
        description: "Verify automatic transaction ledger to prevent high-traffic failover downtime.",
        category: "bills" as const,
        priority: "critical" as const,
        estimatedHours: 0.5,
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "low" as const,
        riskScore: 92,
        riskAnalysis: "Imminent transaction cutoff in less than 6 hours. Leaving this until the last hour leaves zero time for banking troubleshooting."
      },
      {
        title: "Draft Client Pitch Deck",
        description: "Prepare dynamic slides outlining budget projections, deployment timelines, and core MVP specs.",
        category: "work" as const,
        priority: "high" as const,
        estimatedHours: 4,
        deadline: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 days from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "high" as const,
        riskScore: 65,
        riskAnalysis: "Intimidating deck scope creates high initial friction. Break it into micro-sections early to lock in inertia."
      },
      {
        title: "Prepare for Technical Architecture Interview",
        description: "Review cloud design architectures, microservice patterns, scaling rules, and load balancers.",
        category: "interviews" as const,
        priority: "medium" as const,
        estimatedHours: 3,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        completed: false,
        createdAt: new Date().toISOString(),
        procrastinationRisk: "medium" as const,
        riskScore: 25,
        riskAnalysis: "Broad concept scope leads to vague start dates. Use AI Breakdowns to pick a single focused topic."
      }
    ];

    const seededTasks: Task[] = [];
    for (const s of initialSeed) {
      const docId = `seeded-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const fullTask = { id: docId, userId: uid, ...s };
      await setDoc(doc(db, "tasks", docId), fullTask);
      seededTasks.push(fullTask);
    }
    return seededTasks;
  };

  // 1. Trigger Gemini AI Schedule Analyzer
  const handleRefreshAIInsights = async () => {
    if (tasks.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            priority: t.priority,
            estimatedHours: t.estimatedHours,
            deadline: t.deadline,
            completed: t.completed
          })),
          currentTime: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Gemini API call failed");
      const analysis = await res.json();
      
      if (analysis) {
        setUrgencyIndex(analysis.overallRiskScore ?? 50);
        setStressLevel(analysis.stressLevel ?? "Moderate");
        setInsights(analysis.insights ?? []);

        // Update task risk properties in local state and Firestore
        const updatedTasks = tasks.map(task => {
          const tAnalysis = analysis.tasksAnalysis?.find((ta: any) => ta.taskId === task.id);
          if (tAnalysis) {
            const updates = {
              riskScore: tAnalysis.riskScore,
              procrastinationRisk: tAnalysis.procrastinationRisk,
              riskAnalysis: tAnalysis.riskAnalysis
            };
            // Async write updates to Firestore to keep durable sync
            if (user?.uid !== "local-sandbox") {
              updateDoc(doc(db, "tasks", task.id), updates).catch(e => console.error(e));
            }
            return { ...task, ...updates };
          }
          return task;
        });

        setTasks(updatedTasks);
        if (user?.uid === "local-sandbox") {
          localStorage.setItem("local_sandbox_tasks", JSON.stringify(updatedTasks));
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error calculating schedule with Gemini. Ensure your Gemini API Key is configured in Settings > Secrets.");
    } finally {
      setAiLoading(false);
    }
  };

  // 2. Trigger Gemini AI Breakdown
  const handleBreakdownTask = async (task: Task) => {
    const res = await fetch("/api/ai/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        category: task.category,
        deadline: task.deadline
      })
    });
    if (!res.ok) throw new Error("Breakdown calculation failed");
    return await res.json();
  };

  // 3. Trigger Gemini AI Recovery Plan
  const handleActivateRecovery = async (task: Task) => {
    const res = await fetch("/api/ai/recovery-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
    if (!res.ok) throw new Error("Recovery formulation failed");
    return await res.json();
  };

  // 4. Send Message to Multi-Agent Boardroom
  const handleSendBoardroomMessage = async (msg: string) => {
    setBoardroomLoading(true);
    // Add temporary message to represent active prompt
    const userPromptSpeaker = {
      name: "Executive Coach" as const, // Placeholder name for formatting
      avatar: "👤",
      role: "User Dialogue",
      message: msg,
      tone: "analytical" as const
    };

    setBoardroomData(prev => ({
      overallRiskScore: prev?.overallRiskScore ?? urgencyIndex,
      discussion: [...(prev?.discussion ?? []), userPromptSpeaker],
      consolidatedPlan: prev?.consolidatedPlan ?? []
    }));

    try {
      const res = await fetch("/api/ai/boardroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => !t.completed).map(t => ({
            title: t.title,
            category: t.category,
            priority: t.priority,
            estimatedHours: t.estimatedHours,
            deadline: t.deadline
          })),
          userMessage: msg,
          currentConversation: boardroomData?.discussion ?? []
        })
      });

      if (!res.ok) throw new Error("Boardroom deliberation failed");
      const result = await res.json();
      if (result) {
        setBoardroomData(result);
      }
    } catch (err) {
      console.error(err);
      alert("Error convening Boardroom. Check your server status and secrets.");
    } finally {
      setBoardroomLoading(false);
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!email || !password) return;

    if (password.length < 6) {
      setAuthError("Keycode must be at least 6 characters long.");
      return;
    }

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication process failed.");
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Google Sign-In failed.");
    }
  };

  const handleAnonymousAuth = async () => {
    setAuthError("");
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn("Firebase Anonymous Auth restricted. Falling back to local offline sandbox mode.", err);
      // Fallback gracefully to Local Sandbox User so that the app works perfectly!
      setUser({
        uid: "local-sandbox",
        email: "guest-sandbox@local.com",
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
        refreshToken: "",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        displayName: "Local Guest Sandbox"
      } as any as User);
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.uid === "local-sandbox") {
        setUser(null);
      } else {
        await signOut(auth);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Task Actions CRUD
  const handleAddTask = async (taskInput: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const docId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newTask: Task = {
      id: docId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      ...taskInput
    };

    try {
      if (user.uid === "local-sandbox") {
        const updated = [newTask, ...tasks];
        setTasks(updated);
        localStorage.setItem("local_sandbox_tasks", JSON.stringify(updated));
      } else {
        await setDoc(doc(db, "tasks", docId), newTask);
        setTasks(prev => [newTask, ...prev]);
      }
    } catch (err) {
      console.error("Error creating task: ", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (user?.uid === "local-sandbox") {
        const updated = tasks.filter(t => t.id !== taskId);
        setTasks(updated);
        localStorage.setItem("local_sandbox_tasks", JSON.stringify(updated));
      } else {
        await deleteDoc(doc(db, "tasks", taskId));
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error deleting task: ", err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      if (user?.uid === "local-sandbox") {
        const updated = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
        setTasks(updated);
        localStorage.setItem("local_sandbox_tasks", JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, "tasks", taskId), updates);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      }
    } catch (err) {
      console.error("Error updating task: ", err);
    }
  };

  // Select a task and focus on Task tab
  const handleSelectTask = (task: Task) => {
    setActiveTab("tasks");
  };

  // Loading Splash Screen
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-orange-600/10 rounded border border-orange-500/20 animate-pulse text-orange-500">
          <Activity className="w-8 h-8" />
        </div>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">
          Establishing Safe Environment...
        </p>
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return (
      <div className="min-h-screen w-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-6">
        
        {/* Auth Box Container */}
        <div className="w-full max-w-md bg-[#0A0A0A] rounded border border-white/10 p-8 space-y-6 shadow-2xl">
          
          {/* Logo Heading */}
          <div className="text-center space-y-2">
            <div className="p-3 bg-orange-600/10 rounded border border-orange-500/20 inline-block text-orange-500">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight font-sans uppercase">
              Last-Minute <span className="font-extrabold text-orange-500">Life Saver</span>
            </h2>
            <p className="text-[9px] text-orange-400 font-mono tracking-widest uppercase">
              Intelligent Execution Partner
            </p>
          </div>

          {/* Google Sign-In (Highly Recommended as it works out of the box) */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-white/90 text-black font-bold text-xs tracking-widest uppercase py-3 rounded transition-all cursor-pointer shadow-lg shadow-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-[9px] text-center text-white/30 font-mono uppercase tracking-widest">
              ⚡ Recommended • No setup required
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">or use credentials</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3.5 bg-red-950/20 text-red-400 rounded text-xs border border-red-500/10 space-y-2.5">
                <div className="font-semibold">{authError}</div>
                {(authError.includes("auth/operation-not-allowed") || 
                  authError.includes("operation-not-allowed") || 
                  authError.includes("admin-restricted-operation") ||
                  authError.includes("auth/admin-restricted-operation")) && (
                  <div className="text-[10px] text-white/60 leading-normal border-t border-red-500/10 pt-2 space-y-1.5">
                    <p className="font-bold text-orange-400 uppercase tracking-wider font-mono">⚠️ Firebase Setup Required:</p>
                    <p>To authorize with Email/Password or Guest Sandbox, enable those providers in your Firebase project:</p>
                    <ol className="list-decimal list-inside pl-1 space-y-1 font-sans">
                      <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-orange-400 underline">Firebase Console</a></li>
                      <li>Click on <strong>Authentication</strong> in the left sidebar</li>
                      <li>Go to the <strong>Sign-in method</strong> tab</li>
                      <li>Enable <strong>Email/Password</strong> and/or <strong>Anonymous</strong></li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Secure Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-white/30">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded pl-10 pr-4 py-2 text-sm placeholder-white/20 animate-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Access Keycode (6+ chars)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-white/30">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded pl-10 pr-4 py-2 text-sm placeholder-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs tracking-widest uppercase py-3 rounded transition-all cursor-pointer shadow-lg shadow-orange-600/15"
            >
              <span>{authMode === 'login' ? 'Authorize Access' : 'Create Key Account'}</span>
            </button>
          </form>

          {/* Form switcher */}
          <div className="text-center pt-2">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-[10px] uppercase tracking-wider font-mono text-white/40 hover:text-white underline cursor-pointer"
            >
              {authMode === 'login' ? 'Need account? Keycode registration' : 'Already have access key? Authorize'}
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">or sandbox</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Anonymous Trial */}
          <button
            onClick={handleAnonymousAuth}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-widest uppercase py-3 rounded transition-all cursor-pointer"
          >
            <span>Enter Trial Sandbox</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

        <p className="text-[9px] text-white/30 font-mono mt-8 uppercase tracking-widest">
          🔒 Secure Auth Shield Active
        </p>
      </div>
    );
  }

  // Logged in Dashboard Layout
  return (
    <div className="h-screen w-screen flex bg-[#0A0A0A] overflow-hidden font-sans select-none">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
        urgencyIndex={urgencyIndex}
      />

      {/* Main Panel Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            tasks={tasks}
            urgencyIndex={urgencyIndex}
            stressLevel={stressLevel}
            insights={insights}
            aiLoading={aiLoading}
            onRefreshAI={handleRefreshAIInsights}
            onSelectTask={handleSelectTask}
            onCompleteTask={(taskId) => handleUpdateTask(taskId, { completed: true, completedAt: new Date().toISOString() })}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskBoard 
            tasks={tasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onBreakdownTask={handleBreakdownTask}
            onActivateRecovery={handleActivateRecovery}
          />
        )}

        {activeTab === 'boardroom' && (
          <Boardroom 
            tasks={tasks}
            boardroomData={boardroomData}
            boardroomLoading={boardroomLoading}
            onSendMessage={handleSendBoardroomMessage}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView tasks={tasks} />
        )}

        {activeTab === 'habits' && (
          <HabitsTracker userId={user.uid} />
        )}

        {activeTab === 'analytics' && (
          <Analytics tasks={tasks} />
        )}

      </main>

      {/* Floating Microphone Voice Capture Assistant */}
      <VoiceAssistant 
        onAddTask={handleAddTask} 
        aiLoading={aiLoading} 
      />

    </div>
  );
}
