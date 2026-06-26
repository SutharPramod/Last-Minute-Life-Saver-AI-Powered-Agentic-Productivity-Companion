import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Target
} from "lucide-react";
import { db, doc, setDoc, getDoc } from "../firebase";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  lastCompletedDate?: string; // YYYY-MM-DD
}

interface HabitsTrackerProps {
  userId: string;
}

export default function HabitsTracker({ userId }: HabitsTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Start with 5-minute Planning Review', streak: 3, completedToday: true, lastCompletedDate: new Date().toISOString().split('T')[0] },
    { id: '2', name: 'Set Phone/Distractions to Focus Mode', streak: 5, completedToday: false },
    { id: '3', name: 'Draft micro-breakdowns for heavy tasks', streak: 2, completedToday: false },
    { id: '4', name: 'Execute at least one 25-minute Pomodoro', streak: 4, completedToday: true, lastCompletedDate: new Date().toISOString().split('T')[0] }
  ]);
  const [newHabitName, setNewHabitName] = useState("");

  // Load habits from Firestore on start if user exists
  useEffect(() => {
    const fetchHabits = async () => {
      if (!userId) return;
      if (userId === "local-sandbox") {
        const stored = localStorage.getItem("local_sandbox_habits");
        if (stored) {
          setHabits(JSON.parse(stored));
        }
        return;
      }
      try {
        const docRef = doc(db, "userHabits", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().habits) {
          setHabits(docSnap.data().habits);
        }
      } catch (err) {
        console.error("Error fetching habits: ", err);
      }
    };
    fetchHabits();
  }, [userId]);

  // Persist habits
  const saveHabits = async (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    if (!userId) return;
    if (userId === "local-sandbox") {
      localStorage.setItem("local_sandbox_habits", JSON.stringify(updatedHabits));
      return;
    }
    try {
      await setDoc(doc(db, "userHabits", userId), { habits: updatedHabits });
    } catch (err) {
      console.error("Error saving habits: ", err);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      streak: 0,
      completedToday: false
    };

    saveHabits([...habits, newHabit]);
    setNewHabitName("");
  };

  const toggleHabit = (habitId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const completed = !h.completedToday;
        let streak = h.streak;
        if (completed) {
          streak += 1;
        } else {
          streak = Math.max(0, streak - 1);
        }
        return {
          ...h,
          completedToday: completed,
          streak,
          lastCompletedDate: completed ? todayStr : undefined
        };
      }
      return h;
    });

    saveHabits(updated);
  };

  const handleDeleteHabit = (habitId: string) => {
    saveHabits(habits.filter(h => h.id !== habitId));
  };

  return (
    <div id="habits-view-container" className="p-8 space-y-8 overflow-y-auto h-full flex-1 bg-[#0A0A0A] text-white">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-white tracking-tight font-sans uppercase">
          Procrastination <span className="font-extrabold text-orange-500">Shields & Routine Sprints</span>
        </h2>
        <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
          Lock in protective ritual behaviors that destroy daily friction and guard your commitments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Habits List */}
        <div className="lg:col-span-2 bg-[#0A0A0A] p-6 rounded border border-white/10 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Active Anti-Procrastination Shields</h3>
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{habits.filter(h => h.completedToday).length} / {habits.length} Locked</span>
          </div>

          <div className="space-y-3">
            {habits.map((habit) => (
              <div 
                key={habit.id}
                className={`p-4 rounded border flex items-center justify-between gap-4 transition-all duration-200 ${
                  habit.completedToday 
                    ? 'bg-emerald-950/15 border-emerald-500/25' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center border transition-all cursor-pointer ${
                      habit.completedToday 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                        : 'border-white/10 hover:border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div>
                    <span className={`text-xs font-medium font-sans ${habit.completedToday ? 'line-through text-white/40' : 'text-white'}`}>
                      {habit.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-black px-2.5 py-1 rounded border border-white/5">
                    <Flame className={`w-4 h-4 ${habit.streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-white/30'}`} />
                    <span className="text-[10px] font-mono font-bold text-white/70">{habit.streak}d streak</span>
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="text-white/40 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* New Habit Inline Form */}
          <form onSubmit={handleAddHabit} className="flex gap-2 pt-4 border-t border-white/10">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Design a custom anti-procrastination ritual (e.g., Read morning priorities)..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-orange-600 outline-none rounded px-4 py-2.5 text-xs text-white placeholder-white/20"
            />
            <button
              type="submit"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Shield</span>
            </button>
          </form>

        </div>

        {/* Informative Goal & Ritual Assistant */}
        <div className="bg-[#0A0A0A] p-6 rounded border border-white/10 space-y-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Ritual Psychology</h3>
          </div>

          <div className="space-y-4 text-xs text-white/60 leading-relaxed font-sans">
            <div className="p-4 bg-white/5 rounded border border-white/5">
              <h5 className="font-bold text-white mb-1.5">⚡ The 5-Minute Inertia Rule</h5>
              <p>Procrastination isn&apos;t laziness; it&apos;s a psychological freeze response to negative emotion (boredom, fear of failure, confusion). Lock in small 5-minute starts to melt this freeze state instantly.</p>
            </div>

            <div className="p-4 bg-white/5 rounded border border-white/5">
              <h5 className="font-bold text-white mb-1.5">🛡️ Shield Streaks</h5>
              <p>Your anti-procrastination routine builds streak multipliers. Build a 7-day shield streak to experience a significant reduction in schedule stress.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
