/**
 * Classroom scene behind the hero: blackboard with a chalk timetable, wall clock at 8:20,
 * pinned notices, a window, bunting and a row of desks. Original illustration drawn for
 * ClassSync as inline SVG (no third-party image, no licence needed). Purely decorative.
 */
export function HeroScene({ className }: { className?: string }) {
  const ink = "rgb(var(--ink) / 0.22)";
  const thin = { stroke: ink, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const pennants = Array.from({ length: 19 }, (_, index) => index);
  const fills = ["rgb(var(--peach-200))", "rgb(var(--blush-200))", "rgb(var(--plum-100))", "rgb(var(--coral-soft))"];

  return (
    <svg viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={className}>
      {/* bunting */}
      <path d="M-10 54 Q 720 140 1450 54" {...thin} />
      {pennants.map((index) => {
        const x = 20 + index * 76;
        const t = (x + 10) / 1460;
        const y = 54 + 172 * t * (1 - t);
        return <path key={index} d={`M${x} ${y} l30 2 l-13 34 z`} fill={fills[index % fills.length]} opacity="0.75" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />;
      })}

      {/* blackboard with a chalk timetable */}
      <rect x="150" y="170" width="600" height="320" rx="14" fill="rgb(var(--sage-bg))" opacity="0.75" />
      <rect x="150" y="170" width="600" height="320" rx="14" {...thin} strokeWidth="3" />
      <rect x="166" y="186" width="568" height="288" rx="8" {...thin} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map((column) => (
        <path key={`c${column}`} d={`M${250 + column * 82} 214 v232`} {...thin} strokeWidth="1.4" strokeDasharray="2 7" />
      ))}
      {[0, 1, 2, 3].map((row) => (
        <path key={`r${row}`} d={`M196 ${262 + row * 46} h510`} {...thin} strokeWidth="1.4" strokeDasharray="2 7" />
      ))}
      {["M262 232 q10-12 20 0 t20 0", "M344 232 q10-12 20 0 t20 0", "M426 232 q10-12 20 0", "M508 232 q10-12 20 0 t20 0", "M590 232 q10-12 20 0"].map((d) => (
        <path key={d} d={d} {...thin} strokeWidth="2.2" />
      ))}
      <rect x="258" y="272" width="64" height="28" rx="6" fill="rgb(var(--peach-200))" opacity="0.9" />
      <rect x="422" y="318" width="64" height="28" rx="6" fill="rgb(var(--blush-200))" opacity="0.9" />
      <rect x="504" y="364" width="64" height="28" rx="6" fill="rgb(var(--plum-100))" opacity="0.9" />
      <rect x="340" y="410" width="64" height="28" rx="6" fill="rgb(var(--coral-soft))" opacity="0.9" />
      <path d="M600 410 l12 12 l22 -26" {...thin} strokeWidth="3" />
      <path d="M150 498 h600" {...thin} strokeWidth="5" />
      <path d="M210 494 h26 M640 494 h14" {...thin} strokeWidth="6" stroke="rgb(var(--cream))" />

      {/* wall clock at 8:20 */}
      <circle cx="880" cy="215" r="50" fill="rgb(var(--paper))" opacity="0.7" />
      <circle cx="880" cy="215" r="50" {...thin} strokeWidth="3" />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return <path key={index} d={`M${880 + Math.sin(angle) * 40} ${215 - Math.cos(angle) * 40} L${880 + Math.sin(angle) * 44} ${215 - Math.cos(angle) * 44}`} {...thin} />;
      })}
      <path d="M880 215 L861 226" {...thin} strokeWidth="3.5" />
      <path d="M880 215 L896 245" {...thin} strokeWidth="2.5" />

      {/* pinned notices */}
      <rect x="822" y="310" width="120" height="150" rx="6" fill="rgb(var(--peach-100))" opacity="0.85" transform="rotate(-3 882 385)" />
      <rect x="822" y="310" width="120" height="150" rx="6" {...thin} transform="rotate(-3 882 385)" />
      <path d="M842 340 h70 M842 362 h56 M842 384 h76 M842 406 h48" {...thin} strokeWidth="1.6" transform="rotate(-3 882 385)" />
      <circle cx="880" cy="314" r="5" fill="rgb(var(--coral))" opacity="0.7" />
      <rect x="958" y="340" width="74" height="96" rx="5" fill="rgb(var(--blush-100))" opacity="0.9" transform="rotate(4 995 388)" />
      <rect x="958" y="340" width="74" height="96" rx="5" {...thin} transform="rotate(4 995 388)" />
      <circle cx="995" cy="344" r="4.5" fill="rgb(var(--plum))" opacity="0.45" />

      {/* window with a tree */}
      <rect x="1080" y="150" width="270" height="340" rx="10" fill="rgb(var(--paper))" opacity="0.6" />
      <circle cx="1290" cy="215" r="28" fill="rgb(var(--peach-200))" opacity="0.8" />
      <circle cx="1160" cy="360" r="62" fill="rgb(var(--sage-bg))" />
      <circle cx="1220" cy="330" r="48" fill="rgb(var(--sage-bg))" />
      <path d="M1185 480 v-90" {...thin} strokeWidth="5" />
      <rect x="1080" y="150" width="270" height="340" rx="10" {...thin} strokeWidth="3" />
      <path d="M1215 150 v340 M1080 320 h270" {...thin} strokeWidth="3" />
      <path d="M1066 498 h298" {...thin} strokeWidth="5" />

      {/* plant */}
      <path d="M86 560 h64 l-8 70 h-48 z" fill="rgb(var(--coral-soft))" opacity="0.9" />
      <path d="M86 560 h64 l-8 70 h-48 z" {...thin} />
      <path d="M118 558 C 100 520 70 510 60 470 M118 558 C 120 510 140 490 150 450 M118 558 C 130 530 170 520 180 500" {...thin} strokeWidth="2.4" />
      <path d="M60 470 q22 6 26 30 q-24 -4 -26 -30z M150 450 q8 24 -8 40 q-10 -22 8 -40z M180 500 q-6 22 -32 22 q8 -20 32 -22z" fill="rgb(var(--sage-bg))" stroke={ink} strokeWidth="1.6" />

      {/* floor and desks */}
      <path d="M0 640 H1440" {...thin} strokeWidth="2" />
      {[260, 620, 980].map((x) => (
        <g key={x}>
          <path d={`M${x} 690 h230 l-14 18 h-202 z`} fill="rgb(var(--peach-100))" opacity="0.9" />
          <path d={`M${x} 690 h230 l-14 18 h-202 z`} {...thin} strokeWidth="2.4" />
          <path d={`M${x + 30} 708 v92 M${x + 200} 708 v92`} {...thin} strokeWidth="2.4" />
          <rect x={x + 70} y="664" width="54" height="26" rx="4" fill="rgb(var(--blush-200))" opacity="0.9" stroke={ink} strokeWidth="1.6" />
          <path d={`M${x + 150} 690 l10 -30 l8 3 l-8 27`} {...thin} strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}
