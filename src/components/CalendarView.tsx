import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Grid3X3, 
  ListOrdered
} from "lucide-react";
import { Task } from "../types";

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [viewType, setViewType] = useState<'grid' | 'agenda'>('agenda');

  // Generate .ics calendar download
  const downloadICS = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      alert("No active deadlines to export.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LastMinuteLifeSaver//EN\n";
    
    activeTasks.forEach(t => {
      const date = new Date(t.deadline);
      const year = date.getUTCFullYear();
      const month = String((date.getUTCMonth ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
      const day = String(date.getUTCDate ? date.getUTCDate() : date.getDate()).padStart(2, '0');
      const hours = String(date.getUTCHours ? date.getUTCHours() : date.getHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes ? date.getUTCMinutes() : date.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}${month}${day}T${hours}${minutes}00Z`;
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:[LMLS Rescue] ${t.title.replace(/[,;]/g, '\\$&')}\n`;
      icsContent += `DESCRIPTION:${(t.description || 'No details').replace(/[,;]/g, '\\$&')}\\nEstimated duration: ${t.estimatedHours}h\n`;
      icsContent += `DTSTART:${formattedDate}\n`;
      icsContent += `DTEND:${formattedDate}\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'last_minute_life_saver_deadlines.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-generate Google Calendar Single Event URL
  const getGoogleCalendarUrl = (task: Task) => {
    const date = new Date(task.deadline);
    const startStr = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    // Add 1 hour for end
    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("[LMLS Rescue] " + task.title)}&details=${encodeURIComponent(task.description || '')}&dates=${startStr}/${endStr}`;
  };

  return (
    <div id="calendar-view-container" className="p-8 space-y-8 overflow-y-auto h-full flex-1 bg-[#0A0A0A] text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight font-sans uppercase">
            Commitments <span className="font-extrabold text-orange-500">Calendar Sync</span>
          </h2>
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
            Export schedules directly to Google Calendar or download secure `.ics` configurations.
          </p>
        </div>

        <button
          id="export-ics-file-btn"
          onClick={downloadICS}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-widest uppercase px-4 py-2.5 rounded transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-orange-500" />
          <span>Download `.ics` Export</span>
        </button>
      </div>

      {/* Selector and Helper banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0A0A0A] p-6 rounded border border-white/10 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Deadlines Agenda</h3>
            
            <div className="flex gap-1.5 bg-black p-1 rounded border border-white/10">
              <button
                onClick={() => setViewType('agenda')}
                className={`p-1.5 rounded text-xs cursor-pointer ${viewType === 'agenda' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                title="Agenda List View"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('grid')}
                className={`p-1.5 rounded text-xs cursor-pointer ${viewType === 'grid' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                title="Grid Timeline"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agenda view */}
          {viewType === 'agenda' ? (
            <div className="space-y-3">
              {tasks.filter(t => !t.completed).length > 0 ? (
                [...tasks].filter(t => !t.completed).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map(t => (
                  <div key={t.id} className="p-4 bg-white/5 rounded border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded">
                        <CalendarIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-orange-400">
                            {new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={getGoogleCalendarUrl(t)}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex items-center gap-1.5 bg-black hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold text-white/80 hover:text-orange-400 transition-colors"
                    >
                      <span>Sync Calendar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No active deadlines to map. Enjoy the free schedule!
                </div>
              )}
            </div>
          ) : (
            /* Grid timeline view */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.filter(t => !t.completed).length > 0 ? (
                [...tasks].filter(t => !t.completed).map(t => (
                  <div key={t.id} className="p-5 bg-slate-900 rounded-2xl border border-slate-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Target Hours: {t.estimatedHours}h</span>
                      <h4 className="text-md font-bold text-white line-clamp-1">{t.title}</h4>
                      <p className="text-slate-400 text-xs mt-2 line-clamp-2">{t.description || 'No description provided'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-rose-400">
                        {new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <a
                        href={getGoogleCalendarUrl(t)}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-[11px] font-mono font-bold text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        <span>Add to Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center col-span-2 py-12 text-slate-500 text-xs font-mono">
                  No active deadlines.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync guidelines / tips */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Interactive Sync Tips</h4>
          </div>

          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-sans">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-850">
              <h5 className="font-bold text-white mb-1">📅 One-Click Quick Google Sync</h5>
              <p>Click &quot;Sync Calendar&quot; next to any item to instantly open a Google Calendar template with pre-filled title, times, and AI instructions.</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-850">
              <h5 className="font-bold text-white mb-1">💾 Bulk .ICS Import</h5>
              <p>Click &quot;Download .ics Export&quot; above to download a standard format file. Import this file into Google Calendar, Outlook, or Apple Calendar to sync your entire rescue plan at once.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
