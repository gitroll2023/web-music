/**
 * Environment variable validation for SH Music App.
 * This module checks that all required environment variables are set at startup.
 * It only runs on the server side (Node.js).
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  /** If true, the variable is required only in production (NODE_ENV=production) */
  requiredInProduction?: boolean;
  description: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string for Prisma ORM',
  },
  // Google Service Account
  {
    name: 'GOOGLE_CLIENT_EMAIL',
    required: false,
    description: 'Google service account email for Drive/Sheets API',
  },
  {
    name: 'GOOGLE_PRIVATE_KEY',
    required: false,
    description: 'Google service account private key',
  },
  // Google Sheets
  {
    name: 'GOOGLE_SHEET_ID',
    required: false,
    description: 'Google Spreadsheet ID for legacy song data',
  },
  // Gemini AI
  {
    name: 'GEMINI_API_KEY',
    required: false,
    description: 'Google Generative AI (Gemini) API key for lyrics generation',
  },
  // Local files
  {
    name: 'AI_MUSIC_DIR',
    required: false,
    description: 'Local music files directory path (defaults to C:\\AI_MUSIC)',
  },
  // App config
  {
    name: 'NEXT_PUBLIC_BASE_URL',
    required: false,
    description: 'Base URL of the application (defaults to http://localhost:3000)',
  },
];

export function validateEnv(): void {
  // Only run on the server
  if (typeof window !== 'undefined') {
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const missing: EnvVarConfig[] = [];
  const warnings: EnvVarConfig[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      // A var is effectively required if marked required globally,
      // OR if marked requiredInProduction and we are in production.
      const isEffectivelyRequired =
        envVar.required || (envVar.requiredInProduction && isProduction);

      if (isEffectivelyRequired) {
        missing.push(envVar);
      } else {
        warnings.push(envVar);
      }
    }
  }

  // Log warnings for optional missing vars
  if (warnings.length > 0) {
    console.warn(
      '\n⚠️  [ENV CHECK] Optional environment variables not set:\n' +
        warnings
          .map((v) => `   - ${v.name}: ${v.description}`)
          .join('\n') +
        '\n'
    );
  }

  // Error for required missing vars
  if (missing.length > 0) {
    const message =
      '\n❌ [ENV CHECK] Required environment variables are missing!\n' +
      missing
        .map((v) => `   - ${v.name}: ${v.description}`)
        .join('\n') +
      '\n\n' +
      '   Please copy .env.example to .env and fill in the required values:\n' +
      '   cp .env.example .env\n';

    console.error(message);

    // In production, throw to prevent app from starting with broken config
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing required environment variables: ${missing.map((v) => v.name).join(', ')}`
      );
    }
  }

  if (missing.length === 0) {
    console.log('✅ [ENV CHECK] All required environment variables are set.');
  }
}
