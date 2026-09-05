import React from 'react';

interface CabinetIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

export function CabinetIcon({ 
  size = 24, 
  className = '', 
  strokeWidth = 2,
  ...props 
}: CabinetIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer Cabinet Frame */}
      <rect width="18" height="18" x="3" y="2" rx="2" />
      {/* Center Door Division */}
      <path d="M12 2v18" />
      {/* Left Door Handle */}
      <path d="M9 10v3" />
      {/* Right Door Handle */}
      <path d="M15 10v3" />
      {/* Left Cabinet Foot */}
      <path d="M6 20v2" />
      {/* Right Cabinet Foot */}
      <path d="M18 20v2" />
    </svg>
  );
}

export default CabinetIcon;
