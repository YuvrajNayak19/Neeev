/**
 * ClassSync design tokens.
 * Every colour resolves to a CSS variable defined once in src/index.css (:root),
 * so components never hard-code hex values.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1200px" } },
    extend: {
      screens: { xs: "400px" },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      fontSize: {
        // Fluid display sizes for marketing headings.
        "display-xl": ["clamp(2.5rem, 5.6vw + 0.5rem, 4.75rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2rem, 3.4vw + 0.6rem, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.6rem, 1.8vw + 0.8rem, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      colors: {
        // shadcn semantic tokens
        border: token("line"),
        input: token("line-strong"),
        ring: token("plum"),
        background: token("cream"),
        foreground: token("ink"),
        primary: { DEFAULT: token("plum"), foreground: token("cream") },
        secondary: { DEFAULT: token("peach-100"), foreground: token("ink") },
        muted: { DEFAULT: token("sand"), foreground: token("ink-muted") },
        accent: { DEFAULT: token("blush-100"), foreground: token("ink") },
        destructive: { DEFAULT: token("brick"), foreground: token("cream") },
        popover: { DEFAULT: token("paper"), foreground: token("ink") },
        card: { DEFAULT: token("paper"), foreground: token("ink") },

        // Brand palette
        cream: token("cream"),
        paper: token("paper"),
        sand: token("sand"),
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        ink: { DEFAULT: token("ink"), muted: token("ink-muted"), soft: token("ink-soft") },
        peach: { 50: token("peach-50"), 100: token("peach-100"), 200: token("peach-200"), 300: token("peach-300") },
        blush: { 100: token("blush-100"), 200: token("blush-200"), 300: token("blush-300") },
        plum: { 50: token("plum-50"), 100: token("plum-100"), DEFAULT: token("plum"), dark: token("plum-dark") },
        coral: { DEFAULT: token("coral"), soft: token("coral-soft") },
        sage: { bg: token("sage-bg"), DEFAULT: token("sage") },
        honey: { bg: token("honey-bg"), DEFAULT: token("honey") },
        brick: { bg: token("brick-bg"), DEFAULT: token("brick") },

        // Subject families for timetable cells (background + text pair)
        subject: {
          "math-bg": token("subj-math-bg"), math: token("subj-math"),
          "sci-bg": token("subj-sci-bg"), sci: token("subj-sci"),
          "eng-bg": token("subj-eng-bg"), eng: token("subj-eng"),
          "hin-bg": token("subj-hin-bg"), hin: token("subj-hin"),
          "sst-bg": token("subj-sst-bg"), sst: token("subj-sst"),
          "comp-bg": token("subj-comp-bg"), comp: token("subj-comp"),
          "art-bg": token("subj-art-bg"), art: token("subj-art"),
          "pe-bg": token("subj-pe-bg"), pe: token("subj-pe"),
          "other-bg": token("subj-other-bg"), other: token("subj-other"),
        },
      },
      borderRadius: {
        xs: "calc(var(--radius) - 8px)",
        sm: "calc(var(--radius) - 6px)",
        md: "calc(var(--radius) - 4px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
        "3xl": "calc(var(--radius) + 18px)",
      },
      boxShadow: {
        xs: "0 1px 2px rgb(var(--ink) / 0.05)",
        soft: "0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px -12px rgb(var(--ink) / 0.14)",
        lift: "0 2px 4px rgb(var(--ink) / 0.04), 0 24px 48px -20px rgb(var(--plum) / 0.28)",
        card: "0 1px 0 rgb(var(--paper)) inset, 0 1px 2px rgb(var(--ink) / 0.05), 0 12px 32px -18px rgb(var(--ink) / 0.18)",
        focus: "0 0 0 3px rgb(var(--cream)), 0 0 0 5px rgb(var(--plum) / 0.55)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": { from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.97)" }, to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "rise-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        caret: { "0%, 45%": { opacity: "1" }, "55%, 100%": { opacity: "0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        "pop-in": "pop-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-in-left": "slide-in-left 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "rise-in": "rise-in 200ms ease-out",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
        caret: "caret 1s steps(1) infinite",
        "spin-slow": "spin-slow 14s linear infinite",
      },
    },
  },
};
