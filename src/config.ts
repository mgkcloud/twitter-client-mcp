import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Define types for configuration variables
interface Config {
  TWITTER_USERNAME?: string;
  TWITTER_PASSWORD?: string;
  TWITTER_EMAIL?: string;
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET_KEY?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_TOKEN_SECRET?: string;
  PROXY_URL?: string;
  DEBUG?: boolean;
  TWOFACTOR?: string;
}

// Custom logger implementation
export const logger = {
  error: (...args: unknown[]) =>
    process.stderr.write(`${chalk.red('[ERROR]')} ${args.join(' ')}\n`),
  warn: (...args: unknown[]) =>
    process.stderr.write(`${chalk.yellow('[WARN]')} ${args.join(' ')}\n`),
  info: (...args: unknown[]) => process.stderr.write(`${chalk.blue('[INFO]')} ${args.join(' ')}\n`),
};

// Determine file paths for .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_FILE_PATH: string = resolve(__dirname, '..', '.env');
let envLoaded: boolean = false;

// Load environment variables with external priority
const loadEnv = (): void => {
  if (envLoaded) return;

  // Check if required environment variables are already set externally
  const requiredExternalVars = [
    'TWITTER_USERNAME',
    'TWITTER_PASSWORD', 
    'TWITTER_EMAIL',
    'TWOFACTOR'
  ];

  const hasExternalConfig = requiredExternalVars.some(varName => process.env[varName]);
  
  if (hasExternalConfig) {
    logger.info('Using environment variables from external environment (system/container/CI).');
    envLoaded = true;
    return;
  }

  // Fallback to .env file if no external variables found
  try {
    const envContent: string = readFileSync(ENV_FILE_PATH, 'utf8');
    const envVars: Record<string, string> = envContent.split('\n').reduce((acc, line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('='); // Handle values with = in them
        if (key && value) {
          acc[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
      }
      return acc;
    }, {} as Record<string, string>);

    // Set environment variables if not already set
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });

    logger.info('Loaded environment variables from .env file');
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    logger.warn(`No valid .env file found: ${message}. Using external environment variables or defaults.`);
  }

  envLoaded = true;
};

// Initialize environment loading
loadEnv();

// Export configuration object
export const config: Config = {
  TWITTER_USERNAME: process.env.TWITTER_USERNAME,
  TWITTER_PASSWORD: process.env.TWITTER_PASSWORD,
  TWITTER_EMAIL: process.env.TWITTER_EMAIL,
  TWITTER_API_KEY: process.env.TWITTER_API_KEY,
  TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY,
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  PROXY_URL: process.env.PROXY_URL,
  DEBUG: process.env.DEBUG === 'true',
  TWOFACTOR: process.env.TWOFACTOR,
};

// Validate environment
export function validateEnv(): void {
  const requiredVars: (keyof Config)[] = ['TWITTER_USERNAME', 'TWITTER_PASSWORD', 'TWITTER_EMAIL', 'TWOFACTOR'];

  const recommendedVars: (keyof Config)[] = ['PROXY_URL', 'DEBUG'];

  const missingRequired = requiredVars.filter((v) => !config[v]);
  if (missingRequired.length > 0) {
    logger.error(
      `Missing required variables: ${missingRequired.join(', ')}. Some functionality may not work.`,
    );
  }

  const missingRecommended = recommendedVars.filter((v) => !config[v]);
  if (missingRecommended.length > 0) {
    logger.warn(`Missing recommended variables: ${missingRecommended.join(', ')}. Using defaults.`);
  }
}

// Debug startup message
if (config.DEBUG) {
  logger.info('Starting Twitter MCP with debug mode enabled');
}
