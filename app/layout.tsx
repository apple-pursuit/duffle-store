import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Duffle Store API',
  description: 'File storage API for The Duffle Network',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
