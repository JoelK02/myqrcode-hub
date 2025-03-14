import { OrderPayload } from '../components/TopNav';

interface PrintResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

// Type for the global Window interface to include printServerSocket
declare global {
  interface Window {
    printServerSocket?: WebSocket;
  }
}

/**
 * Sends order data to printer using either WebSocket or API endpoint
 */
export async function sendOrderToPrinter(orderData: OrderPayload): Promise<boolean> {
  try {
    // Option 1: Send to a print server via WebSocket if available
    if (typeof window !== 'undefined' && window.printServerSocket && 
        window.printServerSocket.readyState === WebSocket.OPEN) {
      
      window.printServerSocket.send(JSON.stringify({
        type: 'print_order',
        order: orderData
      }));
      
      return true;
    }
    
    // Option 2: Send to an API endpoint
    const response = await fetch('/api/print-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send order to printer');
    }
    
    const result = await response.json() as PrintResponse;
    return result.success;
  } catch (error) {
    console.error('Print service error:', error);
    // Consider implementing a retry mechanism
    return false;
  }
}