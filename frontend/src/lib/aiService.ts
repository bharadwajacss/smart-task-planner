import { Task } from './types';

// Gemini API Configuration (read from Vite env variables)
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
const GEMINI_API_URL = (import.meta.env.VITE_GEMINI_API_URL as string) || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export const aiService = {
  setApiKey: (key: string) => {
    // No longer needed but keeping for compatibility
  },

  getApiKey: (): string | null => {
    return GEMINI_API_KEY;
  },

  hasApiKey: (): boolean => {
    return !!GEMINI_API_KEY;
  },

  clearApiKey: () => {
    // No longer needed but keeping for compatibility
  },

  async generateTaskPlan(userGoal: string): Promise<{ tasks: Task[]; goalTitle: string }> {
    const prompt = `You are a smart task planning assistant. When given a goal, break it down into actionable tasks with clear titles, deadlines (relative like "Week 1", "Day 3", etc.), priority levels (low, medium, high), categories, and dependencies between tasks.

User Goal: ${userGoal}

Respond ONLY with valid JSON in this exact format:
{
  "goalTitle": "Goal name here",
  "tasks": [
    {
      "title": "Task title",
      "description": "Brief description",
      "deadline": "Week 1",
      "priority": "high",
      "category": "Category name",
      "dependencies": ["Task 1", "Task 2"]
    }
  ]
}`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate tasks');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(content);

      // Add IDs and status to tasks
      const tasks: Task[] = parsed.tasks.map((task: any, index: number) => ({
        id: `task-${index + 1}`,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority || 'medium',
        category: task.category,
        dependencies: task.dependencies || [],
        status: 'pending' as const,
      }));

      return {
        goalTitle: parsed.goalTitle || 'Your Goal',
        tasks,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },

  async chat(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    context?: { tasks?: Task[]; goalTitle?: string }
  ): Promise<string> {
  // System prompt instructs the model to focus on the provided context (tasks/goal) when present.
  // IMPORTANT: For normal conversation, the assistant MUST NOT reproduce the stored task context
  // verbatim or output raw JSON. Use the context internally to inform responses, but do not
  // echo the JSON or the full task list in your reply unless the user explicitly asks for it
  // (for example, when performing a technical export or editing tasks in JSON).
  const systemMessage = 'You are a helpful task planning assistant. Help users by working with the current goal and task list when provided. If the user is asking about existing tasks, do NOT generate an entirely new plan — instead expand, explain, or modify the provided tasks. Only create a new plan when the user explicitly requests it. IMPORTANT: Do NOT repeat or output the previous task context or any JSON in your reply unless the user explicitly requests JSON or a technical export. Use the context only to inform your natural-language responses.';

    // Convert conversation history to Gemini format
    const history = conversationHistory.map(msg => ({
      parts: [{ text: msg.content }],
      role: msg.role === 'assistant' ? 'model' : 'user'
    }));

    // For this configuration the assistant must NOT remember or read prior task context.
    // We will send only the system prompt, the conversation history, and the current user message.
    const contents: any[] = [
      { parts: [{ text: systemMessage }], role: 'user' },
      ...history,
      { parts: [{ text: userMessage }], role: 'user' },
    ];

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Chat Error:', error);
      throw error;
    }
  },

  /**
   * Ask the model to modify the provided tasks according to the user's instruction.
   * The model is instructed to return ONLY valid JSON: an array of task objects.
   */
  async modifyTasks(instruction: string, tasks: Task[], goalTitle?: string): Promise<Task[]> {
    const system = 'You are a helpful assistant that edits a provided JSON array of tasks according to a user instruction. Return ONLY valid JSON: the full updated array of tasks.';

    const contents: any[] = [
      { parts: [{ text: system }], role: 'user' },
      { parts: [{ text: `Goal: ${goalTitle ?? ''}` }], role: 'user' },
      { parts: [{ text: `Current Tasks (JSON): ${JSON.stringify(tasks)}` }], role: 'user' },
      { parts: [{ text: `Instruction: ${instruction}` }], role: 'user' },
    ];

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to modify tasks');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error('Empty model response');
      const parsed = JSON.parse(content);
      // Expect parsed to be an array of tasks
      return parsed as Task[];
    } catch (err) {
      console.error('modifyTasks error', err);
      throw err;
    }
  },
};
