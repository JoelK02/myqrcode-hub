import React from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

// Define metadata directly in the layout file
export const metadata: Metadata = {
  title: 'myQRcode Hub',
  description: 'Streamline your property management with our QR code system',
};

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