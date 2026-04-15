import { useRef, type ChangeEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface DateNavigatorProps {
  date: string;
  disabled?: boolean;
  onChange: (nextDate: string) => void;
}

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const shiftDate = (date: string, days: number): string => {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + days);

  const year = nextDate.getFullYear();
  const month = `${nextDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${nextDate.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/** Shared small secondary button used inside the date navigator */
const NavBtn = ({ children, disabled, onClick, title }: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}): JSX.Element => (
  <button
    className="flex items-center justify-center w-7 h-7 rounded bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
    disabled={disabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    {children}
  </button>
);

function DateNavigator({ date, disabled = false, onChange }: DateNavigatorProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  const handleContainerClick = (): void => {
    if (disabled) return;
    try {
      // Modern browsers support showPicker() on input[type="date"]
      inputRef.current?.showPicker();
    } catch {
      // Fallback for older browsers
      inputRef.current?.focus();
      inputRef.current?.click();
    }
  };

  const today = getTodayDate();

  return (
    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-slate-800 p-0.5 rounded-md border border-zinc-200 dark:border-slate-600">
      <NavBtn disabled={disabled} onClick={() => onChange(shiftDate(date, -1))} title="Previous Day">
        <ChevronLeft size={18} />
      </NavBtn>

      {/* Date pill */}
      <div
        className="relative flex items-center gap-2 px-2.5 h-7 bg-white dark:bg-slate-700 rounded border border-zinc-200 dark:border-slate-600 min-w-[140px] cursor-pointer"
        onClick={handleContainerClick}
      >
        <CalendarDays className="text-zinc-400 dark:text-slate-400 shrink-0" size={16} />
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          disabled={disabled}
          onChange={handleInputChange}
          type="date"
          value={date}
        />
        <span className="text-[0.75rem] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
          {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <NavBtn disabled={disabled} onClick={() => onChange(shiftDate(date, 1))} title="Next Day">
        <ChevronRight size={18} />
      </NavBtn>

      <NavBtn disabled={disabled || date === today} onClick={() => onChange(today)} title="Go to Today">
        <RotateCcw size={16} />
        {/* <span className="text-[0.8rem] ml-0.5">Today</span> */}
      </NavBtn>
    </div>
  );
}

export default DateNavigator;
