const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupGoogleDriveConfig() {
  try {
    // Google Drive 설정 추가
    await prisma.appConfig.createMany({
      data: [
        {
          key: 'GOOGLE_DRIVE_CLIENT_ID',
          value: process.env.GOOGLE_DRIVE_CLIENT_ID || ''
        },
        {
          key: 'GOOGLE_DRIVE_CLIENT_SECRET',
          value: process.env.GOOGLE_DRIVE_CLIENT_SECRET || ''
        },
        {
          key: 'GOOGLE_DRIVE_REFRESH_TOKEN',
          value: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || ''
        }
      ],
      skipDuplicates: true
    });

    console.log('Google Drive configuration has been set up successfully!');
  } catch (error) {
    console.error('Error setting up Google Drive configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupGoogleDriveConfig();
