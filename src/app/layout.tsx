import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { DinnerProvider } from '@/contexts/DinnerContext';

export const metadata: Metadata = {
  title: 'ForkFriends',
  description: 'Find your next dinner partner!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
          <AuthProvider>
            <DinnerProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
              </div>
              <Toaster />
            </DinnerProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
