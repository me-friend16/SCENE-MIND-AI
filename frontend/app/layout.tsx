import type { Metadata } from 'next';
import { Cinzel, Outfit, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import CommandPalette from '@/components/CommandPalette';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SceneMind AI',
  description: 'AI-powered screenplay and filmmaking operating system for modern creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-void font-sans text-white antialiased selection:bg-accent selection:text-white">
        <Providers>
          <Navbar />
          <CommandPalette />
          {children}
        </Providers>
      </body>
    </html>
  );
}
