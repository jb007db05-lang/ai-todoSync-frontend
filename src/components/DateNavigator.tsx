import type { ChangeEvent } from 'react';

interface DateNavigatorProps {
  date: string;
  disabled?: boolean;
  onChange: (nextDate: string) => void;
}

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

  return (
    <div className="date-navigator">
      <button disabled={disabled} onClick={() => onChange(shiftDate(date, -1))} type="button">
        Previous day
      </button>
      <label className="field-inline">
        <input disabled={disabled} onChange={handleInputChange} type="date" value={date} />
      </label>
      <button disabled={disabled} onClick={() => onChange(shiftDate(date, 1))} type="button">
        Next day
      </button>
    </div>
  );
}

export default DateNavigator;
