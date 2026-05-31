import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authmatic',
  description: 'An autonomous agent that files prior authorizations in 90 seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
