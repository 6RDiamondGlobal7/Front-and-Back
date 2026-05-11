import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from './CustomSelect';
import './DatePicker.css';

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseValueToDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatPrettyDate = (value) => {
  const date = parseValueToDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const DatePicker = ({ value, onChange, placeholder = 'Select date', disabled = false, minDate }) => {
  const selectedDate = parseValueToDate(value);
  const minSelectableDate = useMemo(() => {
    if (minDate) {
      const parsed = minDate instanceof Date
        ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
        : parseValueToDate(minDate);
      if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
    }

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [minDate]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const days = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startWeekday = start.getDay();
    const totalDays = end.getDate();
    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const selectedValue = selectedDate ? formatDateValue(selectedDate) : null;
  const minValue = formatDateValue(minSelectableDate);
  const currentMonthStart = new Date(minSelectableDate.getFullYear(), minSelectableDate.getMonth(), 1);
  const canGoToPreviousMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) > currentMonthStart;
  const yearOptions = useMemo(() => (
    Array.from({ length: 16 }, (_, index) => minSelectableDate.getFullYear() + index).map((year) => ({
      value: year,
      label: String(year)
    }))
  ), [minSelectableDate]);
  const monthOptions = monthNames.map((name, index) => ({ value: index, label: name }));

  return (
    <div ref={rootRef} className={`date-picker ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className="date-picker-trigger"
        onClick={() => !disabled && setIsOpen((current) => !current)}
        disabled={disabled}
      >
        <CalendarDays size={18} />
        <span className={`date-picker-label ${selectedDate ? 'filled' : ''}`}>
          {selectedDate ? formatPrettyDate(value) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="date-picker-popover">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={!canGoToPreviousMonth}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-picker-controls">
              <CustomSelect
                className="date-picker-select date-picker-month-select"
                value={viewDate.getMonth()}
                onChange={(nextMonth) => setViewDate(new Date(viewDate.getFullYear(), Number(nextMonth), 1))}
                options={monthOptions}
              />
              <CustomSelect
                className="date-picker-select date-picker-year-select"
                value={viewDate.getFullYear()}
                onChange={(nextYear) => setViewDate(new Date(Number(nextYear), viewDate.getMonth(), 1))}
                options={yearOptions}
              />
            </div>
            <button type="button" className="date-picker-nav" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-picker-weekdays">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="date-picker-grid">
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="date-picker-empty"></span>;

              const currentValue = formatDateValue(day);
              const isSelected = currentValue === selectedValue;
              const isMinDate = currentValue === minValue;
              const isPast = day < minSelectableDate;

              return (
                <button
                  key={currentValue}
                  type="button"
                  className={`date-picker-day ${isSelected ? 'selected' : ''} ${isMinDate ? 'today' : ''} ${isPast ? 'disabled' : ''}`}
                  disabled={isPast}
                  onClick={() => {
                    if (isPast) return;
                    onChange?.(currentValue);
                    setIsOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
