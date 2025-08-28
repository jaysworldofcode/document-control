import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 TEST ENDPOINT: /api/test-approvals reached!');
  console.log('🧪 TEST: Current time:', new Date().toISOString());
  
  return NextResponse.json({
    success: true,
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🧪 TEST ENDPOINT: POST /api/test-approvals reached!');
  
  try {
    const body = await request.json();
    console.log('🧪 TEST: Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test POST endpoint is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 TEST: Error parsing request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
