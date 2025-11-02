import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cleanbuz - Task Management for Property Managers',
  description:
    'Comprehensive task management application with Airbnb booking integration and SMS notifications',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
