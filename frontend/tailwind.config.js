/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Your original custom colors (unchanged)
        primary: "#0F3D3E",
        accent: "#D94F4F",
        teal: "#14B8A6",
        coral: "#F97316",
        ink: "#1E1E2F",
        cream: "#FDFBF7",
        faded: "#6B7280",
        ash: "#9CA3AF",
        rule: "#E5E7EB",
        card: "#FFFFFF",
        void: "#0D0D1A",
        parchment: "#FAF7F0",

        // Shadcn additions
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        heading: ["var(--font-geist-sans)", "system-ui"],
        body: ["var(--font-geist-sans)", "system-ui"],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};