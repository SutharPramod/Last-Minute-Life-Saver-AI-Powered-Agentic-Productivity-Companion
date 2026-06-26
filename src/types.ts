export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  estimatedHours: number;
  actualHoursSpent?: number;
  completed: boolean;
  completedAt?: string; // ISO string
  category: 'work' | 'study' | 'personal' | 'bills' | 'meetings' | 'interviews' | 'commitments';
  priority: 'low' | 'medium' | 'high' | 'critical';
  procrastinationRisk?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number; // 0-100
  riskAnalysis?: string;
  subTasks?: SubTask[];
  recoveryPlan?: RecoveryPlan;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
  dueDate?: string;
}

export interface RecoveryPlan {
  activatedAt: string;
  steps: RecoveryStep[];
  strategistAdvice: string;
  sentinelIntervention: string;
}

export interface RecoveryStep {
  title: string;
  durationMinutes: number;
  completed: boolean;
}

export interface AgentSpeaker {
  name: 'Deadline Strategist' | 'Procrastination Sentinel' | 'Recovery Officer' | 'Executive Coach';
  avatar: string;
  role: string;
  message: string;
  tone: 'analytical' | 'vigilant' | 'emergency' | 'motivational';
}

export interface BoardroomAnalysis {
  overallRiskScore: number; // 0-100
  discussion: AgentSpeaker[];
  consolidatedPlan: string[];
}
