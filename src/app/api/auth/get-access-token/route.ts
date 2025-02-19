import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGoogleDriveConfig() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive configuration is missing');
  }

  return {
    clientId,
    clientSecret,
    refreshToken
  };
}

export async function GET() {
  try {
    const { clientId, clientSecret, refreshToken } = await getGoogleDriveConfig();

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // access token 가져오기
    const { token } = await oauth2Client.getAccessToken();
    
    if (!token) {
      throw new Error('Failed to get access token');
    }

    return NextResponse.json({ accessToken: token });
  } catch (error: any) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: 500 }
    );
  }
}
