export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dependencies?: string[];
  status: 'pending' | 'in-progress' | 'completed';
}
