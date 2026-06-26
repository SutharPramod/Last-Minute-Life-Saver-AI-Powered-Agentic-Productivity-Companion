import { 
  LayoutDashboard, 
  CheckSquare, 
  Users2, 
  Calendar, 
  TrendingUp, 
  Flame, 
  LogOut,
  User as UserIcon,
  Sparkles
} from "lucide-react";
import { User } from "../firebase";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  urgencyIndex: number;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, urgencyIndex }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Safety Command', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Execution', icon: CheckSquare },
    { id: 'boardroom', label: 'AI Boardroom', icon: Users2, badge: "Arena" },
    { id: 'calendar', label: 'Rescue Calendar', icon: Calendar },
    { id: 'habits', label: 'Procrastination Shield', icon: Flame },
    { id: 'analytics', label: 'Risk Analytics', icon: TrendingUp },
  ];

  return (
    <aside id="sidebar-container" className="w-64 bg-[#0A0A0A] border-r border-white/10 text-slate-100 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div id="sidebar-header" className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold text-xl italic text-white shadow-lg shadow-orange-600/20">
            L
          </div>
          <div>
            <h1 className="text-xs uppercase tracking-[0.3em] font-light text-white font-sans">
              Last-Minute
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-orange-500 font-mono">
              Life Saver
            </p>
          </div>
        </div>
      </div>

      {/* Urgency Status Bar */}
      <div id="urgency-score-widget" className="mx-4 mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Urgency Index</span>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
            urgencyIndex > 70 ? 'bg-orange-500/20 text-orange-400' :
            urgencyIndex > 40 ? 'bg-amber-500/20 text-amber-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {urgencyIndex}%
          </span>
        </div>
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              urgencyIndex > 70 ? 'bg-orange-600' :
              urgencyIndex > 40 ? 'bg-amber-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${urgencyIndex}%` }}
          />
        </div>
        <p className="text-[10px] text-white/50 mt-2 font-sans italic">
          {urgencyIndex > 70 ? "🚨 System Alert: High deadline risks!" :
           urgencyIndex > 40 ? "⚠️ Preemptive planning recommended." :
           "✅ Focus state is completely safe."}
        </p>
      </div>

      {/* Main Navigation */}
      <nav id="sidebar-nav" className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded text-xs uppercase tracking-widest font-mono transition-all duration-200 ${
                isActive 
                  ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/15' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div id="sidebar-footer" className="p-4 border-t border-white/10 bg-black/40 flex flex-col gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-1.5">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 font-bold uppercase text-xs">
                {user.email ? user.email[0] : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-white truncate">{user.email || 'Anonymous'}</p>
                <p className="text-[9px] text-white/40 font-mono tracking-widest uppercase">AUTHORIZED</p>
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/5 rounded text-[10px] uppercase tracking-widest text-white/50 hover:text-orange-400 font-mono transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </>
        ) : (
          <div className="text-center p-2 text-white/30 text-[10px] font-mono uppercase tracking-widest">
            SECURE SANDBOX
          </div>
        )}
      </div>
    </aside>
  );
}
