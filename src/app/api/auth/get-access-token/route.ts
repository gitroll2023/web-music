import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGoogleDriveConfig() {
  // DB에서 설정 가져오기
  const configs = await prisma.appConfig.findMany({
    where: {
      key: {
        in: [
          'GOOGLE_DRIVE_CLIENT_ID',
          'GOOGLE_DRIVE_CLIENT_SECRET',
          'GOOGLE_DRIVE_REFRESH_TOKEN'
        ]
      }
    }
  });

  const configMap = configs.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as Record<string, string>);

  const clientId = configMap['GOOGLE_DRIVE_CLIENT_ID'];
  const clientSecret = configMap['GOOGLE_DRIVE_CLIENT_SECRET'];
  const refreshToken = configMap['GOOGLE_DRIVE_REFRESH_TOKEN'];

  console.log('Checking DB configurations:');
  console.log('CLIENT_ID exists:', !!clientId);
  console.log('CLIENT_SECRET exists:', !!clientSecret);
  console.log('REFRESH_TOKEN exists:', !!refreshToken);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive configuration is missing in DB');
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

    try {
      // access token 가져오기
      const { token } = await oauth2Client.getAccessToken();
      
      if (!token) {
        throw new Error('Failed to get access token');
      }

      return NextResponse.json({ accessToken: token });
    } catch (error: any) {
      console.error('Error getting access token from Google:', error);
      return NextResponse.json(
        { error: 'Failed to get access token from Google: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in get-access-token API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: 500 }
    );
  }
}
