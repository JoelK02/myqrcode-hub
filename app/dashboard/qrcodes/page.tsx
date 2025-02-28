import React from 'react';

export default function QRCodesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">QR Code Management</h1>
        <p className="text-muted-foreground">Generate, view, and update QR codes.</p>
      </header>
      
      <div className="bg-card rounded-lg border p-10 flex items-center justify-center">
        <div className="text-center max-w-md py-10">
          <h2 className="text-xl font-semibold mb-2">QR Code Management Coming Soon</h2>
          <p className="text-muted-foreground">
            This section will allow you to generate, view, and manage QR codes for your properties.
            You'll be able to track scans and update linked information in real-time.
          </p>
        </div>
      </div>
    </div>
  );
} 