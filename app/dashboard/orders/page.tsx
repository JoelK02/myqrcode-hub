import React from 'react';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Orders & Requests</h1>
        <p className="text-muted-foreground">Track service requests in real-time.</p>
      </header>
      
      <div className="bg-card rounded-lg border p-10 flex items-center justify-center">
        <div className="text-center max-w-md py-10">
          <h2 className="text-xl font-semibold mb-2">Orders & Requests Coming Soon</h2>
          <p className="text-muted-foreground">
            This section will allow you to track and manage service requests from your properties.
            You'll be able to see real-time updates and communicate with your staff.
          </p>
        </div>
      </div>
    </div>
  );
} 