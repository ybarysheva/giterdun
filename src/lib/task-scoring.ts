import { differenceInDays } from 'date-fns';
import { Task, Session, SortMode, Effort } from '@/lib/types';

export type ScoreDebugEntry = {
  id: string;
  title: string;
  score: number;
  reason: string;
};

export function getTaskScore(task: Task, energy: Session['energy']): { score: number; reason: string } {
  const effortEaseMap: Record<Effort, number> = { XS: 1, S: 0.75, M: 0.3, L: 0.1 };

  const flagScore = task.flagged ? 1 : 0;
  const effortEaseScore = task.effort ? effortEaseMap[task.effort] : 0.0;

  const stalenessDays = differenceInDays(new Date(), new Date(task.originDate || task.createdAt));
  const isStale = stalenessDays >= 2;
  const stalenessNudge = isStale ? 0.2 : 0;

  let energyFit = 0;
  let energyReason = '';
  if (task.effort) {
    if (energy === 'low') {
      if (task.effort === 'XS' || task.effort === 'S') { energyFit = 0.1; energyReason = 'Good for low energy. '; }
    } else if (energy === 'high') {
      if (task.effort === 'M' || task.effort === 'L') { energyFit = 0.1; energyReason = 'Good for high energy. '; }
      else { energyFit = -0.1; energyReason = 'Not a high-energy task. '; }
    }
  } else {
    energyReason = 'No effort set. ';
  }

  const totalScore = (0.45 * flagScore) + (0.35 * effortEaseScore) + (0.20 * stalenessNudge) + energyFit;
  const reason = `FLAG: ${task.flagged ? 'On' : 'Off'} (${(0.45 * flagScore).toFixed(2)}) / EASE: ${task.effort || 'None'} (${(0.35 * effortEaseScore).toFixed(2)}) / STALE: ${isStale ? 'Yes' : 'No'} (${(0.20 * stalenessNudge).toFixed(2)}) / ENERGY: ${energyReason}(${energyFit.toFixed(2)})`;

  return { score: totalScore, reason };
}

export function sortTasks(
  tasks: Task[],
  sortMode: SortMode,
  energy: Session['energy'],
): { sorted: Task[]; scores: ScoreDebugEntry[] } {
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doneTasks = tasks
    .filter(t => t.status === 'done')
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  let sortedTodoTasks: Task[];
  const scores: ScoreDebugEntry[] = [];

  switch (sortMode) {
    case 'easy': {
      const effortOrder: (Effort | null)[] = ['XS', 'S', 'M', 'L', null];
      sortedTodoTasks = [...todoTasks].sort((a, b) => {
        const effortA = effortOrder.indexOf(a.effort);
        const effortB = effortOrder.indexOf(b.effort);
        if (effortA !== effortB) return effortA - effortB;
        return a.createdAt - b.createdAt;
      });
      break;
    }
    case 'ai': {
      const scoredTasks = todoTasks.map(task => {
        const { score, reason } = getTaskScore(task, energy);
        scores.push({ id: task.id, title: task.title, score, reason });
        return { ...task, score };
      });
      sortedTodoTasks = scoredTasks.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.title.length !== b.title.length) return a.title.length - b.title.length;
        return a.title.localeCompare(b.title);
      });
      scores.sort((a, b) => b.score - a.score);
      break;
    }
    case 'custom':
    default:
      sortedTodoTasks = [...todoTasks].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      break;
  }

  return { sorted: [...sortedTodoTasks, ...doneTasks], scores };
}
