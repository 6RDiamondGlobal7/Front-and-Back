import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './CustomSelect.css';

const normalizeOptions = (options) => options.map((option) => (
  typeof option === 'string' || typeof option === 'number'
    ? { value: option, label: String(option), disabled: false }
    : option
));

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  icon = null,
  disabled = false,
  className = '',
  menuClassName = '',
  optionClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const selectedOption = normalizedOptions.find((option) => option.value === value) || null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={`custom-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen((current) => !current)}
        disabled={disabled}
      >
        {icon && <span className="custom-select-icon">{icon}</span>}
        <span className={`custom-select-value ${selectedOption ? 'filled' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="custom-select-arrow" />
      </button>

      {isOpen && (
        <div className={`custom-select-menu ${menuClassName}`}>
          {normalizedOptions.map((option) => {
            const isSelected = option.value === value;
            const isDisabled = Boolean(option.disabled) && !isSelected;
            return (
              <button
                key={String(option.value)}
                type="button"
                className={`custom-select-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${optionClassName}`}
                onClick={() => !isDisabled && handleSelect(option.value)}
                disabled={isDisabled}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
