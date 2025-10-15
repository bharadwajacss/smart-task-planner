import React from 'react';

export const LogoA = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <div className={`${className} rounded-lg bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center`} aria-hidden>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Smart Task Planner logo">
      <defs>
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="rgba(0,0,0,0.06)" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
      <g filter="url(#innerShadow)">
        <path d="M20 7L10 18l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  </div>
);

export default LogoA;