import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#02020A',
        abyss: '#06061A',
        deep: '#0A0A1E',
        card: '#14142E',
        surface: '#02020A',
        panel: '#0A0A1E',
        accent: '#9B6DFF',
        glow: '#7B4FFF',
        cyan: { DEFAULT: '#22DDCC', dark: '#1AB8A8' },
        amber: { DEFAULT: '#FFAA44', dark: '#E09030' },
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'serif'],
        sans: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'Courier New', 'monospace'],
      },
      boxShadow: {
        cinematic: '0 20px 80px rgba(15, 23, 42, 0.35)',
        glow: '0 0 40px rgba(155, 109, 255, 0.2)',
        'glow-cyan': '0 0 30px rgba(34, 221, 204, 0.15)',
        'glow-sm': '0 0 20px rgba(155, 109, 255, 0.15)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(circle at top left, rgba(155,109,255,0.35), transparent 30%), radial-gradient(circle at bottom right, rgba(34,221,204,0.12), transparent 25%)',
        'void-gradient':
          'radial-gradient(circle at 20% 20%, rgba(155,109,255,0.10), transparent 35%), radial-gradient(circle at 80% 80%, rgba(34,221,204,0.07), transparent 30%)',
      },
      borderColor: {
        DEFAULT: 'rgba(140,120,255,0.16)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
