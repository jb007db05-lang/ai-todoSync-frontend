import api from '@/services/api';
import type { TaskPriority } from '@/types/task';

export interface PriorityEvaluation {
  taskId: string;
  basePriority: TaskPriority;
  dynamicPriority: TaskPriority;
  urgencyScore: number;
  impactScore: number;
  dependencyWeight: number;
  dynamicPriorityScore: number;
  downstreamTaskCount: number;
  reason: string;
}

interface PriorityEvaluationResponse {
  message: string;
  data: {
    evaluation: PriorityEvaluation;
  };
}

interface PriorityRecalculateResponse {
  message: string;
  data: {
    count: number;
    evaluations: PriorityEvaluation[];
  };
}

const evaluateTaskPriority = async (taskId: string): Promise<PriorityEvaluation> => {
  const response = await api.post<PriorityEvaluationResponse>(`/priority-engine/tasks/${taskId}/evaluate`);
  return response.data.data.evaluation;
};

const recalculateDynamicPriorities = async (): Promise<PriorityRecalculateResponse['data']> => {
  const response = await api.post<PriorityRecalculateResponse>('/priority-engine/recalculate');
  return response.data.data;
};

export { evaluateTaskPriority, recalculateDynamicPriorities };
