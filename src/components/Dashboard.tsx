import { useState } from "react";
import { 
  AlertTriangle, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Volume2, 
  Calendar, 
  Activity, 
  Clock, 
  Smile, 
  Lightbulb, 
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { Task } from "../types";

interface DashboardProps {
  tasks: Task[];
  urgencyIndex: number;
  stressLevel: string;
  insights: string[];
  aiLoading: boolean;
  onRefreshAI: () => void;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
}

export default function Dashboard({ 
  tasks, 
  urgencyIndex, 
  stressLevel, 
  insights, 
  aiLoading, 
  onRefreshAI, 
  onSelectTask, 
  onCompleteTask 
}: DashboardProps) {
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Local text-to-speech for AI Insights
  const speakInsights = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    const speakText = `Your Urgency Index is currently ${urgencyIndex} percent, indicating a ${stressLevel} situation. Here is my strategic advice: ${
      insights.length > 0 
        ? insights.join(". ") 
        : "You currently have a clean slate. Perfect time to plan ahead and build high-quality habits!"
    }`;

    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Find the highest priority/risk task to work on next
  const getNextRecommendedTask = (): Task | null => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return null;

    // Sort by risk score descending, then priority (critical > high > medium > low)
    return [...activeTasks].sort((a, b) => {
      const aScore = a.riskScore || (a.priority === 'critical' ? 90 : a.priority === 'high' ? 70 : a.priority === 'medium' ? 40 : 10);
      const bScore = b.riskScore || (b.priority === 'critical' ? 90 : b.priority === 'high' ? 70 : b.priority === 'medium' ? 40 : 10);
      return bScore - aScore;
    })[0];
  };

  const nextTask = getNextRecommendedTask();

  // Status Colors Helper
  const getStressBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "critical crisis":
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "moderate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div id="dashboard-wrapper" className="p-8 space-y-8 overflow-y-auto h-full flex-1 bg-[#0A0A0A] text-white">
      
      {/* Upper Status Bar */}
      <div id="dashboard-header-bar" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight font-sans uppercase">
            Safety <span className="font-extrabold text-orange-500">Command Center</span>
          </h2>
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
            Dynamic risk modeling and real-time intervention engine.
          </p>
        </div>

        <button
          id="refresh-ai-insights-btn"
          onClick={onRefreshAI}
          disabled={aiLoading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded text-xs font-mono uppercase tracking-widest text-white transition-colors cursor-pointer disabled:opacity-55"
        >
          <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
          <span>{aiLoading ? 'RECALCULATING...' : 'ANALYZE WITH GAI'}</span>
        </button>
      </div>

      {/* Extreme Risk Banner */}
      {urgencyIndex > 70 && (
        <div id="critical-alert-banner" className="flex items-start gap-4 p-5 rounded bg-orange-950/20 border border-orange-600/30 animate-pulse">
          <div className="p-2.5 bg-orange-600/20 rounded text-orange-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Critical Schedule Alert</h4>
            <p className="text-orange-200 text-xs mt-1 leading-relaxed">
              Your overall Urgency Index is critical! Multiple imminent deadlines are colliding. Use the <strong>Task Execution</strong> dashboard to launch immediate emergency recovery plans.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Command Dashboard Grid */}
      <div id="stats-summary-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Urgency Score Card */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Urgency Index</span>
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white tracking-tighter font-sans">
                {urgencyIndex}%
              </span>
              <span className={`text-[9px] px-2.5 py-1 rounded border ${getStressBadgeColor(stressLevel)} font-mono font-bold uppercase tracking-widest`}>
                {stressLevel}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-3 leading-relaxed">
              Computed based on estimated time vs remaining time across {tasks.filter(t => !t.completed).length} active tasks.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={speakInsights}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded text-[10px] uppercase font-mono tracking-widest transition-colors ${
                isSpeaking 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
              <span>{isSpeaking ? 'MUTE AUDIO COACH' : 'LISTEN TO AUDIO COACH'}</span>
            </button>
          </div>
        </div>

        {/* Task Completion Ratios */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Commitments Resolved</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white tracking-tighter font-sans">
                {tasks.filter(t => t.completed).length}
              </span>
              <span className="text-white/40 text-lg font-mono">/ {tasks.length}</span>
            </div>

            <p className="text-white/50 text-xs mt-3 leading-relaxed">
              {tasks.length > 0 
                ? `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}% of your lifetime commitments successfully preserved without slipping.`
                : "Add commitments to start monitoring your execution resilience."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
              <span>RISK WARNING COUNT</span>
              <span className="text-orange-500 font-bold">{tasks.filter(t => !t.completed && (t.riskScore || 0) > 50).length} tasks</span>
            </div>
          </div>
        </div>

        {/* Next Imminent Deadline */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Most Imminent Target</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>

            {nextTask ? (
              <div>
                <h4 className="text-lg font-bold text-white truncate font-sans">{nextTask.title}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/10 uppercase tracking-wider">
                    {new Date(nextTask.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-3 line-clamp-2 leading-relaxed">
                  Estimated Effort: {nextTask.estimatedHours} hours.
                  {nextTask.riskAnalysis ? ` AI Risk: ${nextTask.riskAnalysis}` : ''}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white/50 text-xs">No pending commitments.</p>
                <p className="text-[11px] text-white/30 mt-2 font-mono uppercase tracking-widest">All scheduled deadlines met!</p>
              </div>
            )}
          </div>

          {nextTask && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => onSelectTask(nextTask)}
                className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest font-mono text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
              >
                <span>EXECUTE NOW</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Main Execution Board Overview */}
      <div id="execution-overview-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommended Focus Area */}
        <div className="lg:col-span-2 bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest font-mono">
                AI Next Best Action
              </h3>
            </div>

            {nextTask ? (
              <div className="space-y-4">
                <div className="p-5 rounded bg-white/5 border border-white/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`text-[8px] uppercase font-mono px-2 py-0.5 rounded ${
                        nextTask.category === 'bills' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                        nextTask.category === 'study' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                        'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                      }`}>
                        {nextTask.category}
                      </span>
                      <h4 className="text-xl font-bold text-white mt-2 font-sans tracking-tight">{nextTask.title}</h4>
                      <p className="text-white/60 text-xs mt-1 leading-relaxed">{nextTask.description || 'No description provided.'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono text-white/40 block uppercase tracking-wider">Deadline Risk</span>
                      <span className={`text-xs font-extrabold font-mono uppercase tracking-widest ${
                        (nextTask.riskScore || 0) > 70 ? 'text-orange-500' :
                        (nextTask.riskScore || 0) > 40 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {nextTask.riskScore || 50}% {(nextTask.riskScore || 0) > 70 ? 'Critical' : (nextTask.riskScore || 0) > 40 ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                  </div>

                  {nextTask.riskAnalysis && (
                    <div className="mt-4 p-3.5 bg-black/40 rounded border border-white/5 flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/70 italic leading-relaxed">
                        &quot;{nextTask.riskAnalysis}&quot;
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/15 rounded text-orange-500">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-white/80 leading-relaxed">Don&apos;t wait any longer. Launch deep focus execution mode.</p>
                      <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">PROCRASTINATION SHIELD ACTIVE</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTask(nextTask)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded transition-all cursor-pointer shadow-lg shadow-orange-600/15"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>INITIATE SPRINT</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-white/40 space-y-3">
                <Smile className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
                <p className="text-xs">Excellent work! You have no outstanding, pending commitments.</p>
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Enjoy the respite or schedule a new long-term goal.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Strategic Advice Panel */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest font-mono">
                Aura AI Guidance
              </h3>
            </div>

            <div className="space-y-4">
              {insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-[10px] font-bold font-mono text-orange-400 bg-orange-500/10 w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-white/80 leading-relaxed font-sans">{insight}</p>
                  </div>
                ))
              ) : (
                <div className="text-white/40 text-center py-8 space-y-2">
                  <p className="text-xs">No active alerts or recommendations generated.</p>
                  <button 
                    onClick={onRefreshAI}
                    className="text-xs font-mono text-orange-400 hover:underline cursor-pointer"
                  >
                    Click &apos;ANALYZE WITH GAI&apos; to process your schedule
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Active Guardians: 4</span>
            <div className="flex gap-1.5 text-sm">
              <span title="Deadline Strategist">📊</span>
              <span title="Procrastination Sentinel">🛡️</span>
              <span title="Recovery Officer">🚨</span>
              <span title="Executive Coach">🧠</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
