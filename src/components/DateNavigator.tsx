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
    <div className="date-navigator">
      <button
        className="secondary-button date-nav-button"
        disabled={disabled}
        onClick={() => onChange(shiftDate(date, -1))}
        type="button"
      >
        <ChevronLeft size={16} />
        Prev
      </button>
      <div className="date-pill">
        <span className="date-pill-label">
          <CalendarDays size={13} />
          Date
        </span>
        <label className="field-inline date-picker-field">
          <input disabled={disabled} onChange={handleInputChange} type="date" value={date} />
        </label>
      </div>
      <button
        className="secondary-button date-nav-button"
        disabled={disabled}
        onClick={() => onChange(shiftDate(date, 1))}
        type="button"
      >
        Next
        <ChevronRight size={16} />
      </button>
      <button
        className="secondary-button date-nav-button"
        disabled={disabled || date === today}
        onClick={() => onChange(today)}
        type="button"
      >
        <RotateCcw size={16} />
        Today
      </button>
    </div>
  );
}

export default DateNavigator;
