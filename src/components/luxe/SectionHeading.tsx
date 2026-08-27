import React from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
  align?: 'center' | 'left';
  dark?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  sub,
  action,
  align = 'center',
  dark,
}) => (
  <div
    className={`flex flex-col ${
      align === 'center' ? 'items-center text-center' : 'items-start text-left'
    } ${action ? 'md:flex-row md:items-end md:justify-between md:text-left' : ''} gap-4 mb-9`}
  >
    <div className={align === 'center' && !action ? 'max-w-[620px]' : ''}>
      <p className={`text-[11px] font-bold tracking-[0.24em] uppercase mb-2.5 flex items-center gap-2 ${dark ? 'text-[#EFD9A0]' : 'text-[#B08D45]'}`}>
        <span className={`inline-block w-6 h-px ${dark ? 'bg-[#EFD9A0]/60' : 'bg-[#C9A961]/70'}`} />
        {eyebrow}
        {align === 'center' && !action && <span className={`inline-block w-6 h-px ${dark ? 'bg-[#EFD9A0]/60' : 'bg-[#C9A961]/70'}`} />}
      </p>
      <h2 className={`font-display text-[26px] md:text-[34px] font-semibold leading-tight ${dark ? 'text-white' : 'text-[#2A0E3F]'}`}>
        {title}
      </h2>
      {sub && (
        <p className={`mt-2.5 text-[14px] leading-relaxed ${dark ? 'text-white/70' : 'text-[#6E5A7E]'}`}>{sub}</p>
      )}
    </div>
    {action}
  </div>
);
