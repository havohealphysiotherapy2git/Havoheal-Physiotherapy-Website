import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Original decorative SVG graphics.
 *
 * All of these are purely decorative: each carries aria-hidden and focusable
 * ="false" so screen readers and keyboard users skip them entirely. None of
 * them convey information that is not also present in text.
 */

const decorProps = {
  'aria-hidden': 'true' as const,
  focusable: 'false' as const,
  role: 'presentation' as const,
};

/** Abstract "range of movement" arcs — the core brand motif. */
export function MovementArcs({ className }: { className?: string }) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 400 400"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="arc-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dbfb5" />
          <stop offset="100%" stopColor="#1d62f1" />
        </linearGradient>
        <linearGradient id="arc-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8459f5" />
          <stop offset="100%" stopColor="#12a29b" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d="M60 340a180 180 0 0 1 280-150" stroke="url(#arc-a)" strokeWidth="14" opacity="0.9" />
        <path d="M100 340a140 140 0 0 1 196-118" stroke="url(#arc-b)" strokeWidth="10" opacity="0.65" />
        <path d="M140 340a100 100 0 0 1 122-86" stroke="#f95435" strokeWidth="7" opacity="0.5" />
        <path d="M180 340a60 60 0 0 1 60-53" stroke="#0f4545" strokeWidth="5" opacity="0.35" />
      </g>
      <circle cx="60" cy="340" r="10" fill="#07827e" />
    </svg>
  );
}

/** Soft blurred blob used behind hero content. */
export function GradientBlob({
  className,
  from = '#2dbfb5',
  to = '#8459f5',
}: {
  className?: string;
  from?: string;
  to?: string;
}) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      {...decorProps}
      viewBox="0 0 600 600"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`blob-${id}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={from} stopOpacity="0.85" />
          <stop offset="100%" stopColor={to} stopOpacity="0.15" />
        </radialGradient>
        <filter id={`soften-${id}`}>
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <path
        filter={`url(#soften-${id})`}
        fill={`url(#blob-${id})`}
        d="M448 118c46 42 74 112 62 176-12 65-64 123-126 152-63 29-135 28-183-8-49-35-73-106-64-172 8-66 49-127 108-152 59-24 157-38 203 4Z"
      />
    </svg>
  );
}

/** Fine dot grid used to add texture to light sections. */
export function DotGrid({ className }: { className?: string }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      {...decorProps}
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={`dots-${id}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dots-${id})`} />
    </svg>
  );
}

/** Curved section divider so bands of colour do not meet on a hard line. */
export function WaveDivider({
  className,
  flip = false,
  fill = '#ffffff',
}: {
  className?: string;
  flip?: boolean;
  fill?: string;
}) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn('decorative block w-full', flip && 'rotate-180', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={fill}
        d="M0 64c120-30 260-46 420-30 160 17 268 62 428 68 160 5 320-28 432-52 40-9 60-14 160-24v96H0Z"
      />
    </svg>
  );
}

/**
 * Abstract physiotherapy illustration: a stylised figure mid-movement with
 * motion arcs. Deliberately abstract — it depicts movement, not a clinical
 * outcome, and makes no claim about results.
 */
export function MovementFigure({ className }: { className?: string }) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 320 320"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="fig-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#12a29b" />
          <stop offset="100%" stopColor="#164cdd" />
        </linearGradient>
        <linearGradient id="fig-motion" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#8459f5" stopOpacity="0" />
          <stop offset="100%" stopColor="#8459f5" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* motion trails */}
      <g fill="none" strokeLinecap="round">
        <path d="M44 250c30-96 96-150 186-166" stroke="url(#fig-motion)" strokeWidth="9" />
        <path d="M62 268c28-84 88-132 168-150" stroke="#2dbfb5" strokeOpacity="0.35" strokeWidth="5" />
      </g>

      {/* figure */}
      <circle cx="196" cy="76" r="21" fill="url(#fig-body)" />
      <path
        d="M196 102c22 0 36 16 38 38l6 52c1 10-6 18-16 19-9 1-17-6-18-15l-5-38-14 44 26 44c5 9 2 20-7 25s-20 2-25-7l-31-53c-4-7-4-15-1-22l22-52c5-22 12-35 25-35Z"
        fill="url(#fig-body)"
      />
      <path
        d="M162 138c-14 6-27 15-38 27-7 8-19 8-26 1s-7-19 1-26c16-17 35-30 56-38Z"
        fill="#5cd8cd"
      />
      <circle cx="126" cy="242" r="9" fill="#f95435" />
    </svg>
  );
}

/** Stylised spine / alignment motif used on service pages. */
export function AlignmentMotif({ className }: { className?: string }) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 200 320"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spine-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cd8cd" />
          <stop offset="55%" stopColor="#3382fc" />
          <stop offset="100%" stopColor="#8459f5" />
        </linearGradient>
      </defs>
      <path
        d="M100 12c-18 40 18 62 0 100s18 62 0 100 14 62 0 96"
        fill="none"
        stroke="url(#spine-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.9"
      />
      {[36, 76, 116, 156, 196, 236, 276].map((y, index) => (
        <rect
          key={y}
          x={64 + (index % 2 === 0 ? 0 : 8)}
          y={y}
          width="72"
          height="14"
          rx="7"
          fill="#12a29b"
          opacity={0.18 + index * 0.06}
        />
      ))}
    </svg>
  );
}

/**
 * Home-visit motif: a house outline with a movement arc travelling into it, and
 * a route marker. Communicates "we come to you" without depicting a clinician
 * or a patient — no fake people, no implied outcome.
 */
export function HomeVisitMotif({ className }: { className?: string }) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 320 240"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hv-house" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#12a29b" />
          <stop offset="100%" stopColor="#164cdd" />
        </linearGradient>
        <linearGradient id="hv-route" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#8459f5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8459f5" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* the journey to the door */}
      <path
        d="M18 214c44 6 74-14 92-46 20-36 46-52 84-52"
        fill="none"
        stroke="url(#hv-route)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="2 16"
      />
      <circle cx="18" cy="214" r="9" fill="#f95435" />

      {/* house */}
      <path
        d="M196 60l86 58v96a10 10 0 0 1-10 10h-152a10 10 0 0 1-10-10v-96Z"
        fill="#ffffff"
        stroke="url(#hv-house)"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d="M104 122 196 56l92 66"
        fill="none"
        stroke="url(#hv-house)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* door */}
      <rect x="172" y="158" width="48" height="66" rx="6" fill="#c9f5ef" />
      <circle cx="210" cy="192" r="4" fill="#07827e" />

      {/* movement arcs inside the home */}
      <g fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M132 196a26 26 0 0 1 26-26" stroke="#2dbfb5" strokeWidth="7" />
        <path d="M132 214a44 44 0 0 1 44-44" stroke="#5cd8cd" strokeWidth="5" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Compact brand mark. Used in the header and footer alongside the wordmark. */
export function Logomark({ className }: { className?: string }) {
  return (
    <svg
      {...decorProps}
      viewBox="0 0 48 48"
      className={cn('decorative', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dbfb5" />
          <stop offset="55%" stopColor="#1d62f1" />
          <stop offset="100%" stopColor="#7337ea" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#logo-grad)" />
      {/* An "H" formed from two uprights and a movement arc. */}
      <path
        d="M16 13v22M32 13v22"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M16 24c6-7 10-7 16 0"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
    </svg>
  );
}
