import React from 'react';

export interface AnimatedBrandTitleProps {
  text?: string;
  className?: string;
}

export default function AnimatedBrandTitle({ text = "FileMarket", className = "" }: AnimatedBrandTitleProps) {
  // Logic to split compound names or multi-word names
  let part1 = text;
  let part2 = "";

  if (text.includes(" ")) {
    const parts = text.split(" ");
    part1 = parts[0];
    part2 = parts.slice(1).join(" ");
  } else if (text.length > 4) {
    // Try to split on camel case first
    const match = text.match(/^([A-Z]?[a-z]+)([A-Z].*)$/);
    if (match) {
      part1 = match[1];
      part2 = match[2];
    } else {
      // Fallback: split near the middle
      const mid = Math.ceil(text.length / 2);
      part1 = text.slice(0, mid);
      part2 = text.slice(mid);
    }
  }

  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span className="transition-colors duration-200">
        {part1}
      </span>
      {part2 && (
        <span className="text-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent ml-[1px] drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          {part2}
        </span>
      )}
    </span>
  );
}
