import type { SVGProps } from "react";

/**
 * Paperline mark.
 *
 * Concept: a sheet of paper with a single continuous line that exits the page
 * and becomes the underline of the wordmark. The "P" is suggested by the
 * folded corner of the sheet. The line itself = "the paperline".
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
      {/* Soft accent backdrop */}
      <rect
        x={5}
        y={3}
        width={22}
        height={26}
        rx={4}
        fill="currentColor"
        opacity={0.12}
      />

      {/* Sheet of paper */}
      <path
        d="M9 4h11l5 5v17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Folded corner — also forms the bowl of a stylized "P" */}
      <path
        d="M20 4v4a2 2 0 0 0 2 2h3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The "line" — a single continuous stroke that flows across the page,
          dips, exits the right edge, and underlines beyond the sheet. */}
      <path
        d="M10 16
           C 14 16, 14 21, 18 21
           S 22 16, 26 16
           L 30 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* A second, lighter line to suggest "lines on paper" */}
      <path
        d="M10 23h8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  );
}
