import { useState, useEffect } from "react";
import { Mic, MicOff, Sparkles, Volume2, HelpCircle, X, Check } from "lucide-react";
import { Task } from "../types";

interface VoiceAssistantProps {
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => void;
  aiLoading: boolean;
}

export default function VoiceAssistant({ onAddTask, aiLoading }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [parsing, setParsing] = useState(false);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript("Listening carefully...");
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        // Process transcript using AI
        handleProcessVoiceCommand(text);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
        setTranscript("Voice capture failed. Try speaking closer to the microphone.");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Local Speech Recognition API is not supported on this browser context. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setParsedTask(null);
      recognition.start();
    }
  };

  // Run AI parse on spoken statement
  const handleProcessVoiceCommand = async (text: string) => {
    if (!text || text.trim() === "") return;
    setParsing(true);
    try {
      // Trigger Gemini-based parsing by hitting a custom prompt via our courtroom or a simple parse fetch
      // Wait! We can use standard fetch to an inline parse helper or just run it.
      // Let's create a server route or run it directly. Wait, we can add a simple server-side parse route!
      // Let's see: we can do a POST to `/api/ai/parse-voice`!
      const response = await fetch("/api/ai/boardroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: `Parse this spoken text into a structured task. Spoken sentence: "${text}". Please identify: Title, estimatedHours, Category (one of: work, study, personal, bills, meetings, interviews, commitments), Priority (one of: low, medium, high, critical), and a reasonable Deadline (in ISO string format, assuming current local time is ${new Date().toISOString()}).`
        })
      });

      const data = await response.json();
      
      // We can also extract the structured output if we just prompt for simple JSON.
      // Let's check: can we call a dedicated lightweight parser?
      // Yes! Let's write a simple lightweight parser route in server.ts or let's create a clean prompt.
      // Since boardroom returns discussion, we can add a specific `/api/ai/parse-voice` endpoint to our server.ts!
      // Wait, let's look at how we can do that. Let's create the route `/api/ai/parse-voice` in server.ts, or we can use local fallback!
      // Let's create a custom endpoint `/api/ai/parse-voice` in server.ts to handle this perfectly. Let's write the fetch first.
      
      const parseResponse = await fetch("/api/ai/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spokenText: text })
      });

      if (parseResponse.ok) {
        const parsed = await parseResponse.json();
        setParsedTask(parsed);
      } else {
        setTranscript("Failed to process your command with Gemini. Try speaking again.");
      }

    } catch (err) {
      console.error(err);
      setTranscript("Error connecting to safety agents.");
    } finally {
      setParsing(false);
    }
  };

  const handleSaveParsedTask = () => {
    if (!parsedTask) return;
    onAddTask({
      title: parsedTask.title || "Voice Commitment",
      description: parsedTask.description || "Captured via Voice Assistant",
      category: parsedTask.category || "commitments",
      priority: parsedTask.priority || "medium",
      estimatedHours: Number(parsedTask.estimatedHours || 1),
      deadline: parsedTask.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    });
    setParsedTask(null);
    setTranscript("Task scheduled successfully!");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Micro Console Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-orange-600 hover:bg-orange-500 text-white p-4 rounded shadow-2xl shadow-orange-600/35 transition-all duration-300 hover:scale-105 flex items-center justify-center border border-white/10 cursor-pointer"
          title="Open Voice Companion"
        >
          <Mic className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Voice Assistant Panel modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-[#0A0A0A] border border-white/10 rounded shadow-2xl p-5 z-50 space-y-4 animate-fade-in">
          
          <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
              <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">AI Voice Capture</h4>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-wider font-mono text-white/40 leading-relaxed">
              Say: <strong className="text-orange-400">&quot;Create a study task Chemistry quiz due tomorrow at 5 PM requiring 3 hours&quot;</strong>
            </p>

            {/* Transcript Box */}
            <div className="p-3.5 rounded bg-white/5 border border-white/5 text-xs text-white/80 min-h-16 flex items-center justify-center text-center italic">
              {transcript || "Speak to schedule or analyze commitments..."}
            </div>

            {/* AI parsed representation */}
            {parsing && (
              <div className="text-center py-2 text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">
                🧠 Safety agents translating audio...
              </div>
            )}

            {parsedTask && (
              <div className="p-3.5 bg-white/5 rounded border border-orange-500/20 space-y-2 text-xs">
                <span className="text-[9px] font-mono text-orange-400 font-bold uppercase block tracking-widest">AI PARSED COMMITMENT</span>
                <div>
                  <h5 className="font-bold text-white truncate">{parsedTask.title}</h5>
                  <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider font-mono">Category: {parsedTask.category} | Priority: {parsedTask.priority}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-white/40">Effort: {parsedTask.estimatedHours}h</span>
                  <button
                    onClick={handleSaveParsedTask}
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Task</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trigger Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={toggleListening}
                className={`p-5 rounded shadow-lg transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500 animate-pulse' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {isListening ? <Mic className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
