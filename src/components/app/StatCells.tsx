import React from 'react';

const StatCells = ({ cells, className = '' }: { cells: { value: string; label: string }[]; className?: string }) => (
  <div className={`stat-cells ${className}`.trim()}>{cells.map(cell => <div key={cell.label}><strong>{cell.value}</strong><span>{cell.label}</span></div>)}</div>
);
export default StatCells;
