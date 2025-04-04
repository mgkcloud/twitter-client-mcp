import sodium from 'sodium-native';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { createHash } from 'crypto';
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
}

// Define logger interface
interface Logger {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
}

// Redaction function with type safety
const redactSensitive = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[0-9a-fA-F]{64}/g, '[REDACTED_KEY]')
      .replace(/[^=&\s]{32,}/g, '[REDACTED_LONG_VALUE]')
      .replace(/(private_key|secret|key|token|password)=([^&\s]+)/gi, '$1=[REDACTED]');
  }
  if (input && typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
        ? '[REDACTED]'
        : redactSensitive(value);
    }
    return sanitized;
  }
  return input;
};

// Custom logger implementation
export const logger: Logger = {
  error: (...args: any[]) => process.stderr.write(`${chalk.red('[ERROR]')} ${args.map(redactSensitive).join(' ')}\n`),
  warn: (...args: any[]) => process.stderr.write(`${chalk.yellow('[WARN]')} ${args.map(redactSensitive).join(' ')}\n`),
  info: (...args: any[]) => process.stderr.write(`${chalk.blue('[INFO]')} ${args.map(redactSensitive).join(' ')}\n`),
};

// Secure secret storage
let secretBuffer: sodium.SecureBuffer | null = null;
let secretLoaded: boolean = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_FILE_PATH: string = resolve(__dirname, '..', '.env');
const EXPECTED_ENV_HASH: string | null = process.env.ENV_FILE_HASH || null;

// Define types for Twitter credentials
interface TwitterCredentials {
  username: string;
  password: string;
  email: string;
  apiKey?: string;
  apiSecretKey?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  proxyUrl?: string;
}

// Load secrets with priority: external env > .env file
const loadSecrets = (): void => {
  if (secretLoaded) return;

  const externalUsername: string | undefined = process.env.TWITTER_USERNAME;
  const externalPassword: string | undefined = process.env.TWITTER_PASSWORD;
  const externalEmail: string | undefined = process.env.TWITTER_EMAIL;

  if (externalUsername && externalPassword && externalEmail) {
    const credentials: TwitterCredentials = {
      username: externalUsername,
      password: externalPassword,
      email: externalEmail,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecretKey: process.env.TWITTER_API_SECRET_KEY,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      proxyUrl: process.env.PROXY_URL,
    };

    const credentialsJson = JSON.stringify(credentials);
    secretBuffer = sodium.sodium_malloc(credentialsJson.length) as sodium.SecureBuffer;
    secretBuffer.write(credentialsJson);
    sodium.sodium_mlock(secretBuffer);

    process.env.TWITTER_USERNAME = '[REDACTED]';
    process.env.TWITTER_PASSWORD = '[REDACTED]';
    process.env.TWITTER_EMAIL = '[REDACTED]';
    if (process.env.TWITTER_API_KEY) process.env.TWITTER_API_KEY = '[REDACTED]';
    if (process.env.TWITTER_API_SECRET_KEY) process.env.TWITTER_API_SECRET_KEY = '[REDACTED]';
    if (process.env.TWITTER_ACCESS_TOKEN) process.env.TWITTER_ACCESS_TOKEN = '[REDACTED]';
    if (process.env.TWITTER_ACCESS_TOKEN_SECRET) process.env.TWITTER_ACCESS_TOKEN_SECRET = '[REDACTED]';

    logger.info('Using Twitter credentials from external environment variables.');
    secretLoaded = true;
    return;
  }

  try {
    const envContent: string = readFileSync(ENV_FILE_PATH, 'utf8');
    if (EXPECTED_ENV_HASH) {
      const computedHash: string = createHash('sha256').update(envContent).digest('hex');
      if (computedHash !== EXPECTED_ENV_HASH) {
        throw new Error('Integrity check failed: .env file hash does not match expected value.');
      }
    }

    const envVars: Record<string, string> = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);

    const username: string | undefined = envVars.TWITTER_USERNAME;
    const password: string | undefined = envVars.TWITTER_PASSWORD;
    const email: string | undefined = envVars.TWITTER_EMAIL;
    if (!username || !password || !email) {
      throw new Error('TWITTER_USERNAME, TWITTER_PASSWORD, and TWITTER_EMAIL are required in the .env file.');
    }

    const credentials: TwitterCredentials = {
      username,
      password,
      email,
      apiKey: envVars.TWITTER_API_KEY,
      apiSecretKey: envVars.TWITTER_API_SECRET_KEY,
      accessToken: envVars.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: envVars.TWITTER_ACCESS_TOKEN_SECRET,
      proxyUrl: envVars.PROXY_URL,
    };

    const credentialsJson = JSON.stringify(credentials);
    secretBuffer = sodium.sodium_malloc(credentialsJson.length) as sodium.SecureBuffer;
    secretBuffer.write(credentialsJson);
    sodium.sodium_mlock(secretBuffer);

    process.env.TWITTER_USERNAME = '[REDACTED]';
    process.env.TWITTER_PASSWORD = '[REDACTED]';
    process.env.TWITTER_EMAIL = '[REDACTED]';
    if (envVars.TWITTER_API_KEY) process.env.TWITTER_API_KEY = '[REDACTED]';
    if (envVars.TWITTER_API_SECRET_KEY) process.env.TWITTER_API_SECRET_KEY = '[REDACTED]';
    if (envVars.TWITTER_ACCESS_TOKEN) process.env.TWITTER_ACCESS_TOKEN = '[REDACTED]';
    if (envVars.TWITTER_ACCESS_TOKEN_SECRET) process.env.TWITTER_ACCESS_TOKEN_SECRET = '[REDACTED]';

    logger.info(`Loaded Twitter credentials from .env file at: ${ENV_FILE_PATH}`);
    secretLoaded = true;
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load .env: ${message}`);
    throw new Error(`Cannot proceed without Twitter credentials: ${message}`);
  }
};

// Initialize secrets
loadSecrets();

// Export configuration object
export const config: Config = {
  TWITTER_USERNAME: '[REDACTED]',
  TWITTER_PASSWORD: '[REDACTED]',
  TWITTER_EMAIL: '[REDACTED]',
  TWITTER_API_KEY: process.env.TWITTER_API_KEY ? '[REDACTED]' : undefined,
  TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY ? '[REDACTED]' : undefined,
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ? '[REDACTED]' : undefined,
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET ? '[REDACTED]' : undefined,
  PROXY_URL: process.env.PROXY_URL,
};

// Secure credentials access
export function getCredentials(): TwitterCredentials {
  if (!secretBuffer) {
    throw new Error('Twitter credentials are required but not available.');
  }

  const credentialsJson = secretBuffer.toString('utf8');
  sodium.sodium_memzero(secretBuffer);
  sodium.sodium_munlock(secretBuffer);
  secretBuffer = null;
  secretLoaded = false;
  return JSON.parse(credentialsJson);
}

// Validate environment
export function validateEnv(): void {
  if (!secretLoaded || !secretBuffer) {
    throw new Error('Missing required Twitter credentials. Provide via environment variables or .env.');
  }
  const optionalVars: (keyof Config)[] = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET_KEY',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_TOKEN_SECRET',
    'PROXY_URL',
  ];
  const missingOptional = optionalVars.filter((v) => !process.env[v] && !getCredentials()[v?.toLowerCase() as keyof TwitterCredentials]);
  if (missingOptional.length > 0) {
    logger.warn(`Missing optional variables: ${missingOptional.join(', ')}.`);
  }
  logger.info('Environment validation completed successfully');
}