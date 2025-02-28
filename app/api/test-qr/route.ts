import { NextResponse } from 'next/server';
import { generateAndUploadQRCode } from '../../services/qrcode';

// This is a test endpoint to check if QR code generation works
export async function GET(request: Request) {
  try {
    // Get parameters from URL
    const url = new URL(request.url);
    const unitId = url.searchParams.get('unitId') || 'test-unit-id';
    const unitNumber = url.searchParams.get('unitNumber') || 'test-unit';
    const buildingId = url.searchParams.get('buildingId') || 'test-building-id';
    
    console.log(`Testing QR code generation for unit: ${unitId}`);
    
    // Try to generate QR code
    const qrCodeUrl = await generateAndUploadQRCode(
      unitId,
      unitNumber,
      buildingId
    );
    
    return NextResponse.json({
      success: true,
      message: 'QR code generated successfully',
      qrCodeUrl,
      params: { unitId, unitNumber, buildingId }
    });
  } catch (error) {
    console.error('Error in test QR endpoint:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to generate QR code',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 