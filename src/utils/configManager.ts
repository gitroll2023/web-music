import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ConfigKeys = [
  'DATABASE_URL',
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REDIRECT_URI',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'GEMINI_API_KEY'
] as const;

type ConfigKey = typeof ConfigKeys[number];

interface ConfigRow {
  key: string;
  value: string;
}

async function getConfig(key: ConfigKey): Promise<string | null> {
  const result = await prisma.$queryRaw<ConfigRow[]>`
    SELECT value FROM app_config WHERE key = ${key}
  `;
  return result[0]?.value ?? null;
}

async function setConfig(key: ConfigKey, value: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO app_config (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
}

async function getAllConfig(): Promise<Record<ConfigKey, string>> {
  const results = await prisma.$queryRaw<ConfigRow[]>`
    SELECT key, value FROM app_config
  `;
  
  return results.reduce((acc: Partial<Record<ConfigKey, string>>, row: ConfigRow) => {
    if (isValidConfigKey(row.key)) {
      acc[row.key] = row.value;
    }
    return acc;
  }, {}) as Record<ConfigKey, string>;
}

function isValidConfigKey(key: string): key is ConfigKey {
  return ConfigKeys.includes(key as ConfigKey);
}

async function initializeConfig(): Promise<void> {
  const configs = [
    { key: 'DATABASE_URL' as const, value: process.env.DATABASE_URL },
    { key: 'GOOGLE_DRIVE_CLIENT_ID' as const, value: process.env.GOOGLE_DRIVE_CLIENT_ID },
    { key: 'GOOGLE_DRIVE_CLIENT_SECRET' as const, value: process.env.GOOGLE_DRIVE_CLIENT_SECRET },
    { key: 'GOOGLE_DRIVE_REDIRECT_URI' as const, value: process.env.GOOGLE_DRIVE_REDIRECT_URI },
    { key: 'GOOGLE_DRIVE_REFRESH_TOKEN' as const, value: process.env.GOOGLE_DRIVE_REFRESH_TOKEN },
    { key: 'GEMINI_API_KEY' as const, value: process.env.GEMINI_API_KEY }
  ];

  for (const config of configs) {
    if (config.value) {
      await setConfig(config.key, config.value);
    }
  }
}

export {
  ConfigKeys,
  type ConfigKey,
  getConfig,
  setConfig,
  getAllConfig,
  initializeConfig
};
