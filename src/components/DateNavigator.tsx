import type { ChangeEvent } from 'react';
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

function DateNavigator({ date, disabled = false, onChange }: DateNavigatorProps): JSX.Element {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  const today = getTodayDate();

  return (
    <div className="date-navigator-group">
      <button
        className="secondary-button"
        disabled={disabled}
        onClick={() => onChange(shiftDate(date, -1))}
        title="Previous Day"
        type="button"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="date-display-pill">
        <CalendarDays className="muted-icon" size={16} />
        <input 
          disabled={disabled} 
          onChange={handleInputChange} 
          type="date" 
          value={date} 
          className="date-input-hidden"
        />
        <span className="date-text-display">
          {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <button
        className="secondary-button"
        disabled={disabled}
        onClick={() => onChange(shiftDate(date, 1))}
        title="Next Day"
        type="button"
      >
        <ChevronRight size={18} />
      </button>

      <button
        className="secondary-button"
        disabled={disabled || date === today}
        onClick={() => onChange(today)}
        title="Go to Today"
        type="button"
      >
        <RotateCcw size={16} />
        <span style={{ fontSize: '0.8rem' }}>Today</span>
      </button>
    </div>
  );
}

export default DateNavigator;
