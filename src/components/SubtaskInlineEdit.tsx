import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Subtask } from '@/types/task';

interface SubtaskInlineEditProps {
  subtask: Subtask;
  onSave: (patch: { title: string; description?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const inputCls = 'w-full bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all';

export default function SubtaskInlineEdit({ subtask, onSave, onCancel, isSaving }: SubtaskInlineEditProps) {
  const [title, setTitle] = useState(subtask.title);
  const [description, setDescription] = useState(subtask.description ?? '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="mt-3 grid gap-3 p-3 bg-zinc-50 dark:bg-slate-900/50 rounded-lg border border-zinc-200 dark:border-slate-700">
      <div className="grid gap-1.5">
        <span className="text-[0.7rem] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-wider">Subtask Title</span>
        <input
          autoFocus
          className={inputCls}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="What needs to be done?"
          type="text"
          value={title}
        />
      </div>

      <div className="grid gap-1.5">
        <span className="text-[0.7rem] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-wider">Description (optional)</span>
        <textarea
          className={`${inputCls} min-h-[60px] resize-none`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some details..."
          rows={2}
          value={description}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          onClick={onCancel}
          title="Cancel"
          type="button"
        >
          <X size={16} />
        </button>
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
          disabled={isSaving || !title.trim()}
          onClick={handleSave}
          type="button"
        >
          <Check size={14} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
