import { google } from 'googleapis';

// OAuth2 클라이언트 설정
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// 리프레시 토큰 설정
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

// 인증 객체 가져오기
export async function getAuth() {
  return oauth2Client;
}
