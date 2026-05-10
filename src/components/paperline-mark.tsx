import type { SVGProps } from "react";

/**
 * Paperline mark.
 *
 * Updated to match the submitted logo: a minimal document outline with a
 * folded corner and a single blue paperline wave through the center.
 */
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
      {/* Sheet of paper */}
      <path
        d="M8.5 3.5h10.9L25.5 9.6v16.1a2.8 2.8 0 0 1-2.8 2.8H8.5a2.8 2.8 0 0 1-2.8-2.8V6.3a2.8 2.8 0 0 1 2.8-2.8z"
        fill="none"
        stroke="color-mix(in srgb, currentColor 72%, white)"
        strokeWidth={2.1}
        strokeLinejoin="round"
      />

      {/* Folded corner */}
      <path
        d="M19.4 3.8v4.1a2.1 2.1 0 0 0 2.1 2.1h3.8"
        fill="none"
        stroke="color-mix(in srgb, currentColor 72%, white)"
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The paperline */}
      <path
        d="M6.9 16.2h7.2c2.1 0 2.9 3.8 5.1 3.8 2.4 0 3.2-3.8 5.4-3.8h4.5"
        fill="none"
        stroke="var(--pl-accent)"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
