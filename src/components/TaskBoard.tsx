import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  Lightbulb, 
  ListTodo
} from "lucide-react";
import { Task, SubTask, RecoveryStep, RecoveryPlan } from "../types";

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onBreakdownTask: (task: Task) => Promise<any>;
  onActivateRecovery: (task: Task) => Promise<any>;
}

export default function TaskBoard({ 
  tasks, 
  onAddTask, 
  onDeleteTask, 
  onUpdateTask, 
  onBreakdownTask, 
  onActivateRecovery 
}: TaskBoardProps) {
  
  // States for Task Creation Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<Task['category']>("work");
  const [newPriority, setNewPriority] = useState<Task['priority']>("medium");
  const [newEstHours, setNewEstHours] = useState(2);
  const [newDeadline, setNewDeadline] = useState("");

  // States for Filter and Tabs
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [activeTaskTab, setActiveTaskTab] = useState<'pending' | 'completed'>('pending');

  // Expanded cards for AI Breakdowns or Recovery Plans
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  // Async API loading indicators per-task
  const [loadingBreakdown, setLoadingBreakdown] = useState<string | null>(null);
  const [loadingRecovery, setLoadingRecovery] = useState<string | null>(null);

  // Pomodoro Focus Timer states
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTask, setTimerTask] = useState<Task | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(1500); // 25 mins default
  const [originalDuration, setOriginalDuration] = useState(1500);

  // Pomodoro ticking effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      triggerAlarm();
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const triggerAlarm = () => {
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance("Focus interval complete! Great work. Take a 5-minute breather.");
      window.speechSynthesis.speak(u);
    } else {
      alert("Focus interval complete!");
    }
  };

  // Format Timer Text
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  // Start Focus Session
  const startFocusSession = (task: Task, durationMins: number = 25) => {
    setTimerTask(task);
    setSecondsLeft(durationMins * 60);
    setOriginalDuration(durationMins * 60);
    setTimerRunning(true);
  };

  // Create Task Submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      priority: newPriority,
      estimatedHours: Number(newEstHours),
      deadline: new Date(newDeadline).toISOString(),
      completed: false
    });

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewCategory("work");
    setNewPriority("medium");
    setNewEstHours(2);
    setNewDeadline("");
    setShowAddForm(false);
  };

  // AI Breakdown trigger
  const triggerBreakdown = async (task: Task) => {
    setLoadingBreakdown(task.id);
    try {
      const response = await onBreakdownTask(task);
      if (response && response.microTasks) {
        const generatedSubTasks: SubTask[] = response.microTasks.map((st: any, idx: number) => ({
          id: `${task.id}-sub-${idx}-${Date.now()}`,
          title: st.title,
          completed: false,
          estimatedMinutes: st.estimatedMinutes
        }));
        onUpdateTask(task.id, { subTasks: generatedSubTasks });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBreakdown(null);
    }
  };

  // AI Recovery Plan trigger
  const triggerRecovery = async (task: Task) => {
    setLoadingRecovery(task.id);
    try {
      const response = await onActivateRecovery(task);
      if (response && response.steps) {
        const plan: RecoveryPlan = {
          activatedAt: new Date().toISOString(),
          steps: response.steps.map((s: any) => ({
            title: s.title,
            durationMinutes: s.durationMinutes,
            completed: false
          })),
          strategistAdvice: response.strategistAdvice,
          sentinelIntervention: response.sentinelIntervention
        };
        onUpdateTask(task.id, { recoveryPlan: plan });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecovery(null);
    }
  };

  // Toggle Sub-task completion
  const toggleSubTask = (task: Task, subTaskId: string) => {
    const updated = task.subTasks?.map(st => {
      if (st.id === subTaskId) return { ...st, completed: !st.completed };
      return st;
    });
    onUpdateTask(task.id, { subTasks: updated });
  };

  // Toggle Recovery step completion
  const toggleRecoveryStep = (task: Task, stepIdx: number) => {
    if (!task.recoveryPlan) return;
    const steps = [...task.recoveryPlan.steps];
    steps[stepIdx] = { ...steps[stepIdx], completed: !steps[stepIdx].completed };
    onUpdateTask(task.id, {
      recoveryPlan: {
        ...task.recoveryPlan,
        steps
      }
    });
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesTab = activeTaskTab === 'completed' ? t.completed : !t.completed;
    const matchesCat = filterCategory === 'all' ? true : t.category === filterCategory;
    const matchesPrior = filterPriority === 'all' ? true : t.priority === filterPriority;
    return matchesTab && matchesCat && matchesPrior;
  });

  return (
    <div id="taskboard-container" className="p-8 space-y-8 overflow-y-auto h-full flex-1 bg-[#0A0A0A] text-white">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight font-sans uppercase">
            Commitment <span className="font-extrabold text-orange-500">Task Execution</span>
          </h2>
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
            Activate multi-agent support, trigger micro-sprints, and destroy backlog inertia.
          </p>
        </div>

        <button
          id="toggle-add-task-form-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs tracking-widest uppercase px-4 py-2.5 rounded transition-all cursor-pointer shadow-lg shadow-orange-600/15"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'CLOSE SCHEDULER' : 'ADD NEW COMMITMENT'}</span>
        </button>
      </div>

      {/* Pomodoro Focus Timer Section */}
      {timerTask && (
        <div id="pomodoro-focus-bar" className="p-5 rounded bg-black border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block tracking-widest">ACTIVE FOCUS SESSION</span>
              <h4 className="text-md font-bold text-white truncate font-sans">{timerTask.title}</h4>
            </div>
          </div>

          {/* Clock Display */}
          <div className="flex items-center gap-6">
            <span className="text-4xl font-extrabold font-mono tracking-wider text-orange-400">
              {formatTime(secondsLeft)}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-orange-500/40 text-slate-300 hover:text-white cursor-pointer"
                title={timerRunning ? "Pause" : "Play"}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current text-orange-500" />}
              </button>
              <button
                onClick={() => setSecondsLeft(originalDuration)}
                className="p-2.5 bg-white/5 border border-white/10 rounded text-slate-300 hover:text-white cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerTask(null);
                }}
                className="p-2 bg-white/5 border border-white/10 text-xs text-orange-400 hover:bg-orange-500/10 rounded cursor-pointer px-3.5"
              >
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Form */}
      {showAddForm && (
        <div id="add-task-form-panel" className="bg-[#0A0A0A] rounded p-6 border border-white/10">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono mb-4">
            Schedule New Commitment
          </h3>

          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Commitment Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Submit Chemistry Lab Report"
                className="w-full bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded px-4 py-2.5 text-xs text-white placeholder-white/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Specific instructions, scope details, or starting links..."
                className="w-full bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded px-4 py-2.5 text-xs text-white placeholder-white/20 h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded px-4 py-2.5 text-xs text-white"
              >
                <option value="work">Work Project</option>
                <option value="study">Academic Assignment</option>
                <option value="personal">Personal Project</option>
                <option value="bills">Bill / Payment</option>
                <option value="meetings">Meeting Commitment</option>
                <option value="interviews">Interview Prep</option>
                <option value="commitments">Important Commitment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-600 outline-none rounded-lg px-4 py-2.5 text-sm font-bold"
              >
                <option value="low" className="text-slate-400">Low</option>
                <option value="medium" className="text-amber-400">Medium</option>
                <option value="high" className="text-orange-400 font-bold">High</option>
                <option value="critical" className="text-rose-500 font-extrabold">🚨 Critical Crisis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={newEstHours}
                onChange={(e) => setNewEstHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-600 outline-none rounded-lg px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Target Deadline *</label>
              <input
                type="datetime-local"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-600 outline-none rounded-lg px-4 py-2.5 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase px-5 py-2.5 rounded-lg cursor-pointer"
              >
                Authorize Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Control Filter Bar */}
      <div id="task-filter-bar" className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
        
        {/* State tabs */}
        <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => setActiveTaskTab('pending')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTaskTab === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Slipping & Pending ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setActiveTaskTab('completed')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTaskTab === 'completed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Resolved ({tasks.filter(t => t.completed).length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="work">Work Project</option>
              <option value="study">Academic Assignment</option>
              <option value="personal">Personal Project</option>
              <option value="bills">Bill / Payment</option>
              <option value="meetings">Meetings</option>
              <option value="interviews">Interviews</option>
              <option value="commitments">Commitments</option>
            </select>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Crisis</option>
            </select>
          </div>
        </div>

      </div>

      {/* Task Listing View */}
      <div id="tasks-feed" className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isExpanded = expandedTask === task.id;
            const hasSubTasks = task.subTasks && task.subTasks.length > 0;
            const hasRecovery = !!task.recoveryPlan;

            return (
              <div 
                key={task.id} 
                id={`task-card-${task.id}`}
                className={`rounded border bg-white/5 transition-all duration-200 overflow-hidden ${
                  task.completed ? 'border-white/5 opacity-50' :
                  (task.riskScore || 0) > 70 ? 'border-orange-500/40 hover:border-orange-500/65' :
                  (task.riskScore || 0) > 40 ? 'border-amber-500/30 hover:border-amber-500/60' :
                  'border-white/10 hover:border-white/20'
                }`}
              >
                
                {/* Main Card Body */}
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => onUpdateTask(task.id, { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined })}
                      className="text-slate-500 hover:text-white mt-1.5 cursor-pointer shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                      ) : (
                        <Square className="w-5.5 h-5.5 text-slate-700" />
                      )}
                    </button>

                    <div className="space-y-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-lg font-bold truncate ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded ${
                          task.category === 'bills' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                          task.category === 'study' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                          task.category === 'meetings' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {task.category}
                        </span>

                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-rose-600/20 text-rose-400 font-extrabold border border-rose-500/10 animate-pulse' :
                          task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority === 'critical' ? '🚨 Crisis' : task.priority}
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs line-clamp-2">{task.description || 'No description provided'}</p>
                      
                      {/* Deadline Indicators */}
                      <div className="flex items-center gap-4 pt-2 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deadline: {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Hours required: {task.estimatedHours} hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Risk Score column */}
                  <div className="flex items-center gap-6 justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-900 pt-4 md:pt-0">
                    
                    {!task.completed && (
                      <div className="text-left md:text-right">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Urgency Risk</span>
                        <span className={`text-md font-extrabold font-mono ${
                          (task.riskScore || 0) > 70 ? 'text-rose-500' :
                          (task.riskScore || 0) > 40 ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>
                          {task.riskScore || 50}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="p-2 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white cursor-pointer border border-slate-850"
                        title="AI Actions"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 hover:bg-rose-950/40 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete commitment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

                {/* Expanded AI Panel (Breakdown, Recovery, Subtasks) */}
                {isExpanded && !task.completed && (
                  <div className="border-t border-slate-900 bg-slate-950/60 p-6 space-y-6">
                    
                    {/* Action Hub buttons */}
                    <div className="flex flex-wrap gap-2.5 border-b border-slate-900 pb-5">
                      <button
                        onClick={() => triggerBreakdown(task)}
                        disabled={loadingBreakdown === task.id}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                        <span>{loadingBreakdown === task.id ? 'Structuring...' : 'AI Micro-Breakdown'}</span>
                      </button>

                      <button
                        onClick={() => triggerRecovery(task)}
                        disabled={loadingRecovery === task.id}
                        className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 px-4 py-2 rounded-lg text-xs font-bold text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{loadingRecovery === task.id ? 'Formulating rescue plan...' : 'Activate Recovery Plan'}</span>
                      </button>

                      <button
                        onClick={() => startFocusSession(task)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-lg text-xs font-bold text-teal-400 transition-colors cursor-pointer ml-auto"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start focus session</span>
                      </button>
                    </div>

                    {/* Displays Subtasks (Breakdown) */}
                    {hasSubTasks && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ListTodo className="w-4 h-4 text-rose-500" />
                          <h5 className="text-xs font-extrabold uppercase tracking-wider font-mono text-slate-300">
                            AI Micro-Breakdown Steps
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {task.subTasks?.map((sub) => (
                            <div 
                              key={sub.id}
                              onClick={() => toggleSubTask(task, sub.id)}
                              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                sub.completed 
                                  ? 'bg-slate-900/30 border-slate-900/60 opacity-60' 
                                  : 'bg-slate-900 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500">
                                  {sub.completed ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> : <Square className="w-4.5 h-4.5" />}
                                </span>
                                <span className={`text-xs ${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{sub.title}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded shrink-0">
                                {sub.estimatedMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Displays Recovery Plan */}
                    {hasRecovery && task.recoveryPlan && (
                      <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-rose-950/20 to-slate-950 border border-rose-500/20">
                        
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 shrink-0">
                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h5 className="text-sm font-extrabold text-white font-mono tracking-wide uppercase">
                              EMERGENCY RECOVERY SPRINT ACTIVE
                            </h5>
                            <p className="text-xs text-rose-300 mt-1">
                              Slashed unnecessary layers. Execute this MVF (Minimum Viable Focus) sprint sequence.
                            </p>
                          </div>
                        </div>

                        {/* Strategist and Sentinel quotes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                            <span className="text-[9px] font-mono text-blue-400 font-bold uppercase block mb-1">📊 Deadline Strategist: Trim Strategy</span>
                            <p className="text-xs text-slate-400 italic">
                              &quot;{task.recoveryPlan.strategistAdvice}&quot;
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                            <span className="text-[9px] font-mono text-amber-400 font-bold uppercase block mb-1">🛡️ Procrastination Sentinel: Intervention</span>
                            <p className="text-xs text-slate-400 italic">
                              &quot;{task.recoveryPlan.sentinelIntervention}&quot;
                            </p>
                          </div>
                        </div>

                        {/* Recovery Steps list */}
                        <div className="space-y-2 pt-2">
                          <h6 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Rescue Steps</h6>
                          <div className="space-y-2">
                            {task.recoveryPlan.steps.map((step, idx) => (
                              <div 
                                key={idx}
                                onClick={() => toggleRecoveryStep(task, idx)}
                                className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                                  step.completed 
                                    ? 'bg-slate-900/30 border-slate-900/50 opacity-60' 
                                    : 'bg-slate-900/80 border-rose-500/15 hover:border-rose-500/30'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-rose-400 font-bold font-mono text-xs">Sprint {idx + 1}</span>
                                  <span className={`text-xs ${step.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                    {step.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                                    {step.durationMinutes}m
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startFocusSession(task, step.durationMinutes);
                                    }}
                                    className="p-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
                                    title="Start focus timer on this step"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Standard Advice / Fallback if neither AI is loaded */}
                    {!hasSubTasks && !hasRecovery && (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                        <p className="text-xs text-slate-400">Trigger AI actions above to break this commitment down or rescue it from slipping.</p>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <CheckSquare className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-slate-400 text-sm">No commitments found match the selected criteria.</p>
            <p className="text-xs text-slate-600">Click &apos;Add New Commitment&apos; or change your filter configuration.</p>
          </div>
        )}
      </div>

    </div>
  );
}
