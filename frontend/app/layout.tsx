import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Registration & Academic Management Portal',
  description: 'Apply for admissions, track application status, and access results.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
