import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import DaySummary from '@/components/DaySummary';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import TaskList from '@/components/TaskList';
import { useAuth } from '@/context/AuthContext';
import { createTask, deleteTask, getTaskSummary, getTasks, updateTask } from '@/services/tasks';
import type { Task, TaskSummary } from '@/types/task';

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [taskMutationSuccess, setTaskMutationSuccess] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [taskList, taskSummary] = await Promise.all([getTasks(selectedDate), getTaskSummary(selectedDate)]);
      setTasks(taskList);
      setSummary(taskSummary);
    } catch {
      setError('Unable to load tasks for the selected day.');
      setTasks([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleCreateTask = async (payload: { title: string; description?: string }): Promise<void> => {
    await createTask({
      title: payload.title,
      description: payload.description,
      date: selectedDate,
      source: 'manual'
    });
    await loadDashboard();
  };

  const handleToggleTaskStatus = async (task: Task): Promise<void> => {
    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const nextStatus = task.status === 'done' ? 'pending' : 'done';
      await updateTask(task.id, { status: nextStatus });
      await loadDashboard();
      setTaskMutationSuccess(
        nextStatus === 'done' ? 'Task marked as done.' : 'Task moved back to pending.'
      );
    } catch {
      setTaskMutationError('Unable to update the task status.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setActionTaskId(taskId);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      await deleteTask(taskId);
      await loadDashboard();
      setTaskMutationSuccess('Task deleted.');
    } catch {
      setTaskMutationError('Unable to delete the task.');
    } finally {
      setActionTaskId(null);
    }
  };

  const hasTasks = tasks.length > 0;
  const tasksHeading = useMemo(() => `Tasks for ${selectedDate}`, [selectedDate]);

  return (
    <main className="stack">
      <Navbar />
      <SectionCard>
        <DaySummary date={selectedDate} error={error} loading={loading} summary={summary} />
        <DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />
      </SectionCard>
      <SectionCard>
        <div className="card-header">
          <div>
            <h2>{tasksHeading}</h2>
            <p className="muted-text">Create tasks for the selected day and manage their status inline.</p>
          </div>
        </div>
        <div className='tasks'>
          <AddTaskForm date={selectedDate} onCreateTask={handleCreateTask} />
          {taskMutationSuccess ? <p className="success-text">{taskMutationSuccess}</p> : null}
          {taskMutationError ? <p className="error-text">{taskMutationError}</p> : null}
          {loading ? <p className="muted-text">Refreshing tasks for {selectedDate}...</p> : null}
          {!loading && !hasTasks ? (
            <p className="empty-state">No tasks for this day yet. Use the form above to create the first one.</p>
          ) : 
          <TaskList
            actionTaskId={actionTaskId}
            onDelete={(taskId) => void handleDeleteTask(taskId)}
            onToggleStatus={(task) => void handleToggleTaskStatus(task)}
            tasks={tasks}
          />
          }

        </div>
      </SectionCard>
    </main>
  );
}

export default DashboardPage;
