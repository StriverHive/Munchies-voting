// Stroke icons for public ballot UI (navy on light surfaces)
import React from "react";

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
};

export function IconShield({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <path
        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClock({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V7a4 4 0 018 0v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconIdCard({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M14 9h4M14 13h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUsers({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 19v-1a4 4 0 014-4h2a4 4 0 014 4v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M21 19v-0.5a3 3 0 00-3-3h-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Single verified voter (identity), not a group */
export function IconUserCircle({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.5 18.5c0-3.1 2.46-5.5 5.5-5.5s5.5 2.4 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAward({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheckCircle({ className, filled }) {
  if (filled) {
    return (
      <svg {...iconProps} className={className}>
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.12" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M8 12l2.5 2.5L16 9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
