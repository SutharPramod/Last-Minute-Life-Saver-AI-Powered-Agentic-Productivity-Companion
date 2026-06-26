import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  AlertTriangle, 
  Bot, 
  HelpCircle,
  Play
} from "lucide-react";
import { Task, AgentSpeaker, BoardroomAnalysis } from "../types";

interface BoardroomProps {
  tasks: Task[];
  boardroomData: BoardroomAnalysis | null;
  boardroomLoading: boolean;
  onSendMessage: (msg: string) => void;
}

export default function Boardroom({ tasks, boardroomData, boardroomLoading, onSendMessage }: BoardroomProps) {
  const [userInput, setUserInput] = useState("");
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of debate
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [boardroomData, boardroomLoading]);

  // Handle Send Message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || boardroomLoading) return;
    onSendMessage(userInput.trim());
    setUserInput("");
  };

  // Text-To-Speech for individual agent comments
  const speakAgentMessage = (idx: number, message: string, agentName: string) => {
    if (!window.speechSynthesis) {
      alert("TTS not supported.");
      return;
    }

    if (activeSpeechIndex === idx) {
      window.speechSynthesis.cancel();
      setActiveSpeechIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${agentName} says: ${message}`);
    
    // Choose voice parameters based on character
    if (agentName.includes("Strategist")) {
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
    } else if (agentName.includes("Sentinel")) {
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
    } else if (agentName.includes("Recovery")) {
      utterance.rate = 1.15;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
    }

    utterance.onend = () => setActiveSpeechIndex(null);
    utterance.onerror = () => setActiveSpeechIndex(null);

    setActiveSpeechIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Helper colors for different agents
  const getAgentTheme = (name: string) => {
    if (name.includes("Strategist")) return { bg: "bg-white/5 border-white/10", text: "text-blue-400", accent: "border-blue-500/25", iconBg: "bg-blue-500/10" };
    if (name.includes("Sentinel")) return { bg: "bg-white/5 border-white/10", text: "text-orange-400", accent: "border-orange-500/25", iconBg: "bg-orange-500/10" };
    if (name.includes("Recovery")) return { bg: "bg-white/5 border-white/10", text: "text-rose-400", accent: "border-rose-500/25", iconBg: "bg-rose-500/10" };
    return { bg: "bg-white/5 border-white/10", text: "text-emerald-400", accent: "border-emerald-500/25", iconBg: "bg-emerald-500/10" };
  };

  const presetQuestions = [
    "What should I work on next?",
    "Can I finish all my tasks this week?",
    "How can I avoid missing my upcoming deadline?",
    "I am feeling completely overwhelmed. What do I do?"
  ];

  return (
    <div id="boardroom-view-wrapper" className="flex flex-col lg:flex-row h-full w-full bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Debating Arena Area */}
      <div id="boardroom-main-feed" className="flex-1 flex flex-col h-full border-r border-white/10">
        
        {/* Arena Header */}
        <div id="arena-header" className="p-6 border-b border-white/10 bg-black flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-light text-white tracking-tight font-sans uppercase">
                AI Boardroom <span className="font-extrabold text-orange-500">Debating Arena</span>
              </h2>
            </div>
            <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
              Your 4 specialized AI guardians debate schedule strategies and solve procrastination.
            </p>
          </div>

          <div className="hidden sm:flex gap-1 bg-white/5 p-1 rounded border border-white/10">
            <span className="text-[10px] font-mono text-white/40 px-2 py-1 uppercase tracking-widest">Active: 4 Agents</span>
          </div>
        </div>

        {/* Boardroom Chat Logs */}
        <div id="boardroom-logs" className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Initial Boardroom Greeting */}
          <div className="flex gap-4 p-5 rounded bg-white/5 border border-white/10">
            <div className="p-3 bg-orange-600/10 rounded text-orange-400 h-11 w-11 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white font-mono tracking-widest uppercase">Strategic Briefing Desk</h4>
              <p className="text-xs text-white/70 mt-2 leading-relaxed">
                Welcome to your multi-agent command boardroom. When you submit a challenge or ask for advice, our agents analyze your active task board of <strong className="text-orange-400">{tasks.filter(t => !t.completed).length} items</strong> and debate the optimal completion vectors.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    disabled={boardroomLoading}
                    className="text-[10px] font-mono uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded text-white/80 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Discussion blocks */}
          {boardroomData?.discussion.map((speak, idx) => {
            const theme = getAgentTheme(speak.name);
            const speakingThis = activeSpeechIndex === idx;

            return (
              <div 
                key={idx} 
                className={`flex gap-4 p-5 rounded border ${theme.accent} ${theme.bg} hover:border-white/20 transition-all duration-200`}
              >
                {/* Agent Avatar */}
                <div className={`w-12 h-12 rounded flex items-center justify-center text-2xl shrink-0 ${theme.iconBg} border border-white/5`}>
                  {speak.avatar}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-sm font-extrabold tracking-tight ${theme.text} font-sans`}>
                        {speak.name}
                      </h4>
                      <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{speak.role}</p>
                    </div>

                    <button
                      onClick={() => speakAgentMessage(idx, speak.message, speak.name)}
                      className={`p-2 rounded transition-colors cursor-pointer ${
                        speakingThis 
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                          : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title={speakingThis ? "Mute Speech" : "Play Agent voice"}
                    >
                      {speakingThis ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-white/80 mt-3.5 leading-relaxed font-sans">
                    {speak.message}
                  </p>

                  <div className="mt-3 flex justify-end">
                    <span className="text-[9px] font-mono text-white/40 uppercase px-1.5 py-0.5 bg-black rounded border border-white/5">
                      Tone: {speak.tone}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loader */}
          {boardroomLoading && (
            <div className="flex gap-4 p-5 rounded bg-white/5 border border-white/10 animate-pulse">
              <div className="w-12 h-12 rounded bg-black border border-white/10 flex items-center justify-center text-xl text-white/40">
                ⌛
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/4"></div>
                <div className="h-3 bg-white/5 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Arena Form Entry */}
        <div id="arena-chat-entry" className="p-4 bg-black border-t border-white/10 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Submit an execution problem or prompt the boardroom (e.g., 'Draft recovery list')..."
              className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-600 outline-none rounded px-4 py-3 text-xs text-white placeholder-white/20 transition-colors"
              disabled={boardroomLoading}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || boardroomLoading}
              className="bg-orange-600 hover:bg-orange-500 disabled:bg-white/5 text-white p-3 rounded transition-all cursor-pointer shadow-lg shadow-orange-600/15 disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Active Unified Command Action Plan */}
      <div id="boardroom-action-plan" className="w-full lg:w-80 bg-black p-6 flex flex-col h-full overflow-y-auto">
        <h3 className="text-[10px] font-mono font-extrabold tracking-widest text-white/40 uppercase mb-4">
          Boardroom Directives
        </h3>

        {boardroomData && boardroomData.consolidatedPlan.length > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <span className="text-[9px] font-mono text-orange-400 font-bold uppercase block mb-1">Combined Urgency Index</span>
              <span className="text-3xl font-extrabold text-white">{boardroomData.overallRiskScore}%</span>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-white uppercase font-mono tracking-widest">Unified Action Sprints</h4>
              {boardroomData.consolidatedPlan.map((plan, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded bg-white/5 border border-white/5 text-xs">
                  <span className="text-orange-400 font-bold font-mono text-sm shrink-0">0{idx + 1}</span>
                  <p className="text-white/70 leading-relaxed font-sans">{plan}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/30 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-white/20" />
            <p className="text-xs">No active directives. Type your dilemma in the debate bar to request a unified boardroom plan.</p>
          </div>
        )}
      </div>

    </div>
  );
}
