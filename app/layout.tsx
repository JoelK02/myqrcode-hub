import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'react-hot-toast';
// Import metadata from the separate file
import { metadata } from './metadata';

const inter = Inter({ subsets: ['latin'] });

// No re-exporting of metadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
} 