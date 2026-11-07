import React from 'react';

export function AuthDivider() {
  return (
    <div className="w-full flex items-center gap-2 my-5">
      <div className="flex-1 h-px bg-[#E6E6E6]" />
      <span className="text-[12px] font-medium text-black px-1">OR</span>
      <div className="flex-1 h-px bg-[#E6E6E6]" />
    </div>
  );
}
