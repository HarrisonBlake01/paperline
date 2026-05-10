import type { SVGProps } from "react";

export function PaperlineMark({
  className,
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Paperline"
      className={className}
      {...rest}
    >
      {/* Document body */}
      <path
        d="M9 4h11l5 5v17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path
        d="M20 4v4a2 2 0 0 0 2 2h3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stacked lines (the "line" in paperline) */}
      <path
        d="M11 16h10M11 20h10M11 24h6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}
