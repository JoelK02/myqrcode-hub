
export function setupPrintServerConnection(): WebSocket | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // Configuration
    const PRINT_SERVER_WS_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_WS_URL || 'ws://localhost:3001';
    
    // Create WebSocket connection
    const socket = new WebSocket(PRINT_SERVER_WS_URL);
    
    socket.onopen = () => {
      console.log('Connected to print server');
      // Store the socket globally for access from other components
      window.printServerSocket = socket;
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { success: boolean; orderId?: string; error?: string };
        console.log('Print server response:', data);
      } catch (error) {
        console.error('Error parsing print server message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('Disconnected from print server');
      window.printServerSocket = null;
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        setupPrintServerConnection();
      }, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('Print server connection error:', error);
    };
    
    return socket;
  }