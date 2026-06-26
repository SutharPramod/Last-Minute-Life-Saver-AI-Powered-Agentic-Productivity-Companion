import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets inside Google AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Error handling middleware helper for Gemini API
function handleGeminiError(error: any, res: express.Response) {
  console.error("Gemini API Error:", error);
  res.status(500).json({
    error: error.message || "An error occurred with the Gemini API",
    isConfigError: !process.env.GEMINI_API_KEY
  });
}

// 1. Analyze Task Schedule and Predict Risks
app.post("/api/ai/analyze-schedule", async (req, res) => {
  try {
    const { tasks, currentTime } = req.body;
    const ai = getGemini();

    const prompt = `
      You are the "Deadline Strategist" and "Procrastination Sentinel" agents in Last-Minute Life Saver.
      Analyze the following task list and the current local time (${currentTime || new Date().toISOString()}).
      Tasks:
      ${JSON.stringify(tasks, null, 2)}

      For each task:
      1. Calculate a risk score (0 to 100) based on hours remaining versus estimatedHours required, taking sleep, typical work delays, and procrastination risks into account.
      2. Identify the procrastination risk (low, medium, high, critical) and give a specific psychological reason (e.g., intimidating scope, vague starting point, low interest).
      3. Provide a brief actionable, tactical advice (1-2 sentences) to prevent delayed start or missing the deadline.
      
      Also provide an overall schedule risk score (0-100) and 3-4 high-level executive insights.

      Ensure your output conforms strictly to the requested JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER, description: "Composite schedule risk score from 0 to 100" },
            stressLevel: { type: Type.STRING, description: "Overall stress status: Calm, Moderate, High, or Critical Crisis" },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "High-level recommendations and executive schedule warnings"
            },
            tasksAnalysis: {
              type: Type.ARRAY,
              description: "Detailed risk prediction for each task",
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  riskScore: { type: Type.INTEGER },
                  procrastinationRisk: { type: Type.STRING },
                  riskAnalysis: { type: Type.STRING },
                  suggestedPriority: { type: Type.STRING }
                },
                required: ["taskId", "riskScore", "procrastinationRisk", "riskAnalysis", "suggestedPriority"]
              }
            }
          },
          required: ["overallRiskScore", "stressLevel", "insights", "tasksAnalysis"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 2. Breakdown Large Goal or Objective into Actionable Micro-Tasks
app.post("/api/ai/breakdown", async (req, res) => {
  try {
    const { title, description, category, deadline } = req.body;
    const ai = getGemini();

    const prompt = `
      You are the "Executive Coach" and "Deadline Strategist" agents.
      The user wants to complete this large goal/objective:
      Title: "${title}"
      Description: "${description || 'No description provided'}"
      Category: "${category}"
      Deadline: "${deadline}"

      Break this goal into 4 to 7 highly specific, ultra-actionable micro-tasks.
      For each micro-task:
      - Assign a clear name that leaves no ambiguity about how to start (e.g. "Draft outline of Section 1" instead of "Start writing").
      - Estimate realistic duration in minutes (e.g., 30, 45, 60, 90).
      - Analyze the typical procrastination trigger for this step and how to bypass it.
      
      Provide a motivational coaching summary framing this breakdown positively to reduce overwhelm.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coachingQuote: { type: Type.STRING, description: "A high-impact encouraging and framing quote from the Executive Coach" },
            microTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The ultra-specific action step" },
                  estimatedMinutes: { type: Type.INTEGER, description: "Time to complete in minutes" },
                  procrastinationTrigger: { type: Type.STRING, description: "Why the user might procrastinate on this step" },
                  bypassStrategy: { type: Type.STRING, description: "How to instantly defeat the friction to start this task" }
                },
                required: ["title", "estimatedMinutes", "procrastinationTrigger", "bypassStrategy"]
              }
            }
          },
          required: ["coachingQuote", "microTasks"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 3. Generate Emergency Recovery Plan when task is slipping
app.post("/api/ai/recovery-plan", async (req, res) => {
  try {
    const { task } = req.body;
    const ai = getGemini();

    const prompt = `
      You are the "Recovery Officer" in Last-Minute Life Saver.
      The following critical task is overdue, slipping, or has high risk of failure:
      Task: ${JSON.stringify(task, null, 2)}

      Create an emergency recovery schedule to save this task and avoid a missed commitment.
      Your plan must break down the immediate hours ahead into intense, actionable, focused sprints (e.g. Pomodoro intervals or 30-min hyper-focus blocks).
      Provide:
      1. An intense sequence of 3 to 5 micro-steps with durations (minutes) to establish immediate inertia.
      2. Strict tactical advice from the "Deadline Strategist" on what to cut or compromise (e.g., MVP version, rough-draft mode) to make the deadline.
      3. A vigilant verbal slap-in-the-face or supportive nudge from the "Procrastination Sentinel" to destroy current procrastination friction.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategistAdvice: { type: Type.STRING, description: "What content, scope, or quality elements can be trimmed to ensure survival" },
            sentinelIntervention: { type: Type.STRING, description: "Powerful anti-procrastination intervention" },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The hyper-focused immediate recovery step" },
                  durationMinutes: { type: Type.INTEGER, description: "Duration in minutes" }
                },
                required: ["title", "durationMinutes"]
              }
            }
          },
          required: ["strategistAdvice", "sentinelIntervention", "steps"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 4. Multi-Agent Boardroom Debating Arena / Interactive Chat Companion
app.post("/api/ai/boardroom", async (req, res) => {
  try {
    const { tasks, userMessage, currentConversation } = req.body;
    const ai = getGemini();

    const prompt = `
      You are running the "AI Boardroom" in Last-Minute Life Saver.
      Four highly-specialized productivity agents are reviewing the user's workload and their direct query:

      User Query/Update: "${userMessage || 'Provide a comprehensive boardroom analysis of my current schedule.'}"
      
      User's Current Task Board:
      ${JSON.stringify(tasks, null, 2)}

      Previous Boardroom chat logs:
      ${JSON.stringify(currentConversation || [], null, 2)}

      Conduct a debate/discussion among the 4 agents regarding how to save this user from missing deadlines and overcome procrastination.
      Each agent should speak in character:
      1. "Deadline Strategist": Deeply analytical, mathematically calculates hours left vs hours needed, points out schedule conflicts, suggests cutting non-essential tasks.
      2. "Procrastination Sentinel": Highly vigilant, identifies psychological traps, calls out delayed progress, recommends Pomodoros or 5-minute rules.
      3. "Recovery Officer": Focused entirely on rescue mode and fallback plans. Speaks with active speed, triage vocabulary, and outlines immediate emergency steps.
      4. "Executive Coach": Highly encouraging, focuses on clarity and positive framing, reduces panic, answers "What should I work on next?".

      Let them deliberate and debate, responding directly to the user's message.
      Generate 3 to 4 dialogue blocks. One agent can speak first, then another can respond or build upon it, but make sure the dialogue directly addresses the user's specific tasks or questions.
      Also formulate 3 consolidated bullet-point action items that all agents agree upon as immediate next steps.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER, description: "A consolidated schedule risk rating from 0 to 100" },
            discussion: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "One of: Deadline Strategist, Procrastination Sentinel, Recovery Officer, Executive Coach" },
                  avatar: { type: Type.STRING, description: "A simple representative emoji character (e.g. 📊, 🛡️, 🚨, 🧠)" },
                  role: { type: Type.STRING, description: "Short description of their role" },
                  message: { type: Type.STRING, description: "Their spoken line in the debate" },
                  tone: { type: Type.STRING, description: "Their emotional stance: analytical, vigilant, emergency, or motivational" }
                },
                required: ["name", "avatar", "role", "message", "tone"]
              }
            },
            consolidatedPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Unified action steps decided by the boardroom"
            }
          },
          required: ["overallRiskScore", "discussion", "consolidatedPlan"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// 5. Parse Natural Language Voice Commands into Structured Task Form
app.post("/api/ai/parse-voice", async (req, res) => {
  try {
    const { spokenText } = req.body;
    const ai = getGemini();

    const prompt = `
      You are the natural language parsing engine inside Last-Minute Life Saver.
      Translate the following raw transcribed voice command into a structured JSON object representing a task commitment.
      Spoken command: "${spokenText}"

      Rules:
      1. Extract a clear title.
      2. Set estimatedHours (if not mentioned, default to 2).
      3. Map to one of the allowed categories: 'work', 'study', 'personal', 'bills', 'meetings', 'interviews', 'commitments'.
      4. Map to one of the allowed priorities: 'low', 'medium', 'high', 'critical'.
      5. Infer a correct ISO deadline date string based on speech (e.g. "tomorrow at 5 PM", "by Friday night"). Assume the current reference time is: ${new Date().toISOString()}. If no time is specified, default to 24 hours from now.

      Your output must conform strictly to the requested JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            estimatedHours: { type: Type.INTEGER },
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            deadline: { type: Type.STRING, description: "ISO formatted deadline date string" },
            description: { type: Type.STRING, description: "A summary of what was spoken and details parsed" }
          },
          required: ["title", "estimatedHours", "category", "priority", "deadline", "description"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// Configure Vite integration for SPA fallback / serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Last-Minute Life Saver server running on http://localhost:${PORT}`);
  });
}

startServer();
