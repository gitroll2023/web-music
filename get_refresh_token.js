const https = require('https');
const querystring = require('querystring');

// 여기에 값들을 입력하세요
const client_id = process.env.GOOGLE_DRIVE_CLIENT_ID;
const client_secret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
const code = ''; // 브라우저에서 받은 인증 코드를 여기에 입력

const data = querystring.stringify({
  client_id: client_id,
  client_secret: client_secret,
  redirect_uri: redirect_uri,
  grant_type: 'authorization_code',
  code: code
});

const options = {
  hostname: 'oauth2.googleapis.com',
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const response = JSON.parse(body);
    console.log('Refresh Token:', response.refresh_token);
    console.log('Access Token:', response.access_token);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
