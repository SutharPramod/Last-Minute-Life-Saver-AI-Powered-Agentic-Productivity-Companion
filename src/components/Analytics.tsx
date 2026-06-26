import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Task } from "../types";
import { TrendingUp, Award, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

interface AnalyticsProps {
  tasks: Task[];
}

export default function Analytics({ tasks }: AnalyticsProps) {
  
  // 1. Chart Data: Tasks by category & average risk
  const getCategoryData = () => {
    const categories = ['work', 'study', 'personal', 'bills', 'meetings', 'interviews', 'commitments'];
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.completed).length;
      const avgRisk = catTasks.length > 0 
        ? Math.round(catTasks.reduce((acc, t) => acc + (t.riskScore || 50), 0) / catTasks.length) 
        : 0;
      
      return {
        name: cat.toUpperCase(),
        Tasks: total,
        Resolved: completed,
        'Risk Score': avgRisk
      };
    }).filter(d => d.Tasks > 0);
  };

  // 2. Chart Data: Priority counts
  const getPriorityData = () => {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
    
    return priorities.map((p, idx) => {
      const count = tasks.filter(t => t.priority === p).length;
      return {
        name: p.toUpperCase(),
        value: count,
        color: COLORS[idx]
      };
    }).filter(d => d.value > 0);
  };

  const categoryData = getCategoryData();
  const priorityData = getPriorityData();

  // Score statistics
  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.filter(t => !t.completed).length;
  const criticalCount = tasks.filter(t => !t.completed && t.priority === 'critical').length;
  const avgRiskScore = tasks.filter(t => !t.completed).length > 0
    ? Math.round(tasks.filter(t => !t.completed).reduce((acc, t) => acc + (t.riskScore || 50), 0) / tasks.filter(t => !t.completed).length)
    : 0;

  return (
    <div id="analytics-view-container" className="p-8 space-y-8 overflow-y-auto h-full flex-1 bg-[#0A0A0A] text-white">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-white tracking-tight font-sans uppercase">
          Resilience & <span className="font-extrabold text-orange-500">Risk Analytics</span>
        </h2>
        <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
          Detailed metrics mapping your task execution efficiency and deadline survival index.
        </p>
      </div>

      {/* Grid statistics boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white/5 p-5 rounded border border-white/10 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Active Urgency Mean</span>
            <span className="text-2xl font-bold text-white font-sans">{avgRiskScore}%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/5 p-5 rounded border border-white/10 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Resolved Ratio</span>
            <span className="text-2xl font-bold text-white font-sans">
              {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/5 p-5 rounded border border-white/10 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Total Commitments</span>
            <span className="text-2xl font-bold text-white font-sans">{tasks.length} total</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white/5 p-5 rounded border border-white/10 flex items-center gap-4">
          <div className="p-3 bg-orange-500/15 text-orange-500 rounded animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Active Crises</span>
            <span className="text-2xl font-bold text-orange-400 font-sans">{criticalCount} urgent</span>
          </div>
        </div>

      </div>

      {/* Recharts panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white/5 p-6 rounded border border-white/10">
          <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-6">
            Urgency & Scale by Category
          </h3>

          {categoryData.length > 0 ? (
            <div className="h-80 w-full text-[10px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '4px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Tasks" fill="#ea580c" name="Total scheduled" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Risk Score" fill="#f59e0b" name="Avg Risk (%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-20 text-white/30 text-xs font-mono">
              Add task logs and complete deadlines to populate risk indexes.
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white/5 p-6 rounded border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-6">
              Priority Breakdowns
            </h3>

            {priorityData.length > 0 ? (
              <div className="h-64 w-full flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '4px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20 text-white/30 text-xs font-mono">
                No active priorities mapped.
              </div>
            )}
          </div>

          {/* Legend */}
          {priorityData.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center text-[9px] font-mono pt-4 border-t border-white/10">
              {priorityData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-white/40">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
