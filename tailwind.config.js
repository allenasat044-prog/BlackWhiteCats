/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        grid: { "0%": { backgroundPosition: "0 0" }, "100%": { backgroundPosition: "60px 60px" } },
        floatA: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(90px,70px) scale(1.2)" } },
        floatB: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(-110px,-60px) scale(1.15)" } },
        scan: { "0%": { transform: "translateY(-20vh)" }, "100%": { transform: "translateY(120vh)" } },
        rise: { "0%": { transform: "translateY(0) rotate(0deg)", opacity: "0" }, "10%": { opacity: ".18" }, "90%": { opacity: ".18" }, "100%": { transform: "translateY(-120vh) rotate(25deg)", opacity: "0" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".3" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: {
        grid: "grid 6s linear infinite", "float-a": "floatA 16s ease-in-out infinite", "float-b": "floatB 20s ease-in-out infinite",
        scan: "scan 9s linear infinite", rise: "rise 22s linear infinite", dot: "pulseDot 1.6s ease-in-out infinite", "fade-up": "fadeUp .6s ease both",
      },
    },
  },
  plugins: [],
};
