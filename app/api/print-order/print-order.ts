import { NextApiRequest, NextApiResponse } from 'next';

// Configuration for your print server
const PRINT_SERVER_URL = process.env.PRINT_SERVER_URL || 'http://localhost:3001/api/print';

interface PrintApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<PrintApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Forward the order data to the print server
    const response = await fetch(PRINT_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json() as PrintApiResponse;
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to print order');
    }

    return res.status(200).json(data);
  } catch (error) {
    const err = error as Error;
    console.error('Print API error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to print order', 
      error: err.message 
    });
  }
}