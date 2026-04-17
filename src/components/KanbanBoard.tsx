import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createPortal } from 'react-dom';
import { type Task, type TaskWorkflowStatus, TASK_WORKFLOW_STATUS_OPTIONS } from '@/types/task';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: TaskWorkflowStatus) => Promise<void>;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

const COLUMNS: TaskWorkflowStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];

function KanbanBoard({
  tasks,
  onUpdateStatus,
  onSelectTask,
  onDeleteTask,
  onEditTask
}: KanbanBoardProps): JSX.Element {
  
  const getTasksByStatus = (status: TaskWorkflowStatus) => {
    return tasks.filter((task) => task.status === status)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskWorkflowStatus;
    // For now, we only handle status changes. Order within column would need more backend support.
    await onUpdateStatus(draggableId, newStatus);
  };

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full min-h-[600px]">
          {COLUMNS.map((status) => {
            const columnTasks = getTasksByStatus(status);
            const label = TASK_WORKFLOW_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
            
            return (
              <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {label}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[0.7rem] font-bold">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-2 space-y-3 overflow-y-auto transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => {
                            const content = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-[9999]' : ''}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  // Avoid potential position jumps during portal creation
                                  cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                }}
                              >
                                <TaskCard
                                  task={task}
                                  onDelete={onDeleteTask}
                                  onEditTask={onEditTask}
                                  onSelect={onSelectTask}
                                />
                              </div>
                            );

                            return snapshot.isDragging 
                              ? createPortal(content, document.body) 
                              : content;
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanBoard;
