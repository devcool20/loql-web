import React from 'react';
import { ShieldCheck } from 'lucide-react';
import SmartImage from './SmartImage';

const TrustRow = ({ avatars = [], label, verified = true }: { avatars?: string[]; label: string; verified?: boolean }) => (
  <div className="trust-row">
    {avatars.length > 0 && <div className="trust-avatars">{avatars.slice(0, 3).map((src, index) => <SmartImage key={`${src}-${index}`} src={src} alt="" rounded="50%" />)}</div>}
    {verified && <ShieldCheck size={14} aria-hidden="true" />}
    <span>{label}</span>
  </div>
);
export default TrustRow;
