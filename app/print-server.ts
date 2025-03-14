// print-server.ts
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { print } from 'printer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define types
interface OrderData {
  id: string;
  unit_id: string;
  unit_number: string;
  building_id: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PrintMessage {
  type: 'print_order';
  order: OrderData;
}

interface PrintResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

// Set up Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// REST API endpoint for polling new orders
app.post('/api/print', (req: Request, res: Response) => {
  const orderData = req.body as OrderData;
  
  try {
    // Format the order for printing
    const formattedOrder = formatOrder(orderData);
    
    // Send to printer
    print(formattedOrder, { printer: process.env.PRINTER_NAME || 'default' });
    
    console.log('Order printed successfully:', orderData.id);
    res.status(200).json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Print error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket connection for real-time printing
wss.on('connection', (ws: WebSocket) => {
  console.log('Print server client connected');
  
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message) as PrintMessage;
      
      if (data.type === 'print_order') {
        // Format the order
        const formattedOrder = formatOrder(data.order);
        
        // Send to printer
        print(formattedOrder, { printer: process.env.PRINTER_NAME || 'default' });
        
        console.log('Order printed via WebSocket:', data.order.id);
        const response: PrintResponse = { success: true, orderId: data.order.id };
        ws.send(JSON.stringify(response));
      }
    } catch (error) {
      const err = error as Error;
      console.error('WebSocket print error:', err);
      const response: PrintResponse = { success: false, error: err.message };
      ws.send(JSON.stringify(response));
    }
  });
});

// Helper function to format orders for printing
function formatOrder(order: OrderData): string {
  // Create a formatted string for printing
  let printContent = '';
  
  printContent += '===== NEW ORDER =====\n\n';
  printContent += `Order ID: ${order.id}\n`;
  printContent += `Unit: ${order.unit_number}\n`;
  printContent += `Time: ${new Date(order.created_at).toLocaleString()}\n`;
  printContent += `Amount: $${order.total_amount.toFixed(2)}\n\n`;
  
  if (order.notes) {
    printContent += `Notes: ${order.notes}\n\n`;
  }
  
  printContent += '===================\n';
  
  return printContent;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Print server running on port ${PORT}`);
});