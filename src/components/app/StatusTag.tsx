import React from 'react';
import { CheckCircle2, Clock3, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';

type Tone = 'available' | 'active' | 'pending' | 'complete' | 'danger';
const icons = { available: ShieldCheck, active: Clock3, pending: AlertCircle, complete: CheckCircle2, danger: XCircle };

const StatusTag = ({ label, tone }: { label: string; tone: Tone }) => {
  const Icon = icons[tone];
  return <span className={`tag tone-${tone}`}><Icon size={11} aria-hidden="true" />{label}</span>;
};
export default StatusTag;
