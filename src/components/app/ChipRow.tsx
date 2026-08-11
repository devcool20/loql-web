import React from 'react';

const ChipRow = ({ options, value, onChange, ariaLabel = 'Filters' }: { options: string[]; value: string; onChange: (value: string) => void; ariaLabel?: string }) => (
  <div className="chip-row" role="group" aria-label={ariaLabel}>
    {options.map(option => <button type="button" key={option} className={`chip ${value === option ? 'active' : ''}`} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}
  </div>
);
export default ChipRow;
