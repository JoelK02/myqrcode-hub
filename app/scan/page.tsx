'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, AlertTriangle, Info } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Initialize camera when component mounts
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Set video source to camera stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions and try again.');
      }
    };
    
    startCamera();
    
    // Cleanup function to stop camera stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const handleScanClick = () => {
    // In a real implementation, you'd integrate with a QR code scanning library
    // For now, we'll just simulate a successful scan and redirect to the order page
    const mockUnitId = '123e4567-e89b-12d3-a456-426614174000'; // Replace with an actual unit ID
    router.push(`/order?unit=${mockUnitId}`);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            <h1 className="text-xl font-bold">QR Code Scanner</h1>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg max-w-md w-full flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        <div className="w-full max-w-md mx-auto">
          <div className="border-4 border-primary rounded-lg overflow-hidden shadow-lg bg-black">
            {isCameraReady ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-card">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleScanClick}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center gap-2"
            >
              <QrCode className="h-5 w-5" />
              <span>Scan QR Code</span>
            </button>
            
            <div className="p-3 bg-primary/10 rounded-md flex gap-2">
              <Info className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-xs">
                For real QR code scanning, you would need to use a dedicated QR code scanning library.
                This example shows just the camera feed and navigation flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 