import { google } from 'googleapis';
import { getConfig, setConfig } from './configManager';

async function createOAuth2Client() {
  const clientId = await getConfig('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = await getConfig('GOOGLE_DRIVE_CLIENT_SECRET');
  const redirectUri = await getConfig('GOOGLE_DRIVE_REDIRECT_URI');

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing OAuth2 configuration');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function refreshAccessToken() {
  try {
    const oauth2Client = await createOAuth2Client();
    const refreshToken = await getConfig('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (credentials.refresh_token) {
      // 새로운 refresh token이 발급된 경우 DB 업데이트
      await setConfig('GOOGLE_DRIVE_REFRESH_TOKEN', credentials.refresh_token);
    }

    return oauth2Client;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

async function getOAuth2Client() {
  const oauth2Client = await createOAuth2Client();
  const refreshToken = await getConfig('GOOGLE_DRIVE_REFRESH_TOKEN');

  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  
  return oauth2Client;
}

export {
  refreshAccessToken,
  getOAuth2Client
};
