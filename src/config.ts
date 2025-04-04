import sodium from 'sodium-native';
import chalk from 'chalk';

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
const DEBUG: boolean = process.env.DEBUG === 'true';

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

// Load secrets from external environment variables only
const loadSecrets = (): void => {
  if (secretLoaded) return;

  if (DEBUG) logger.info('Starting loadSecrets process...');

  const externalUsername: string | undefined = process.env.TWITTER_USERNAME;
  const externalPassword: string | undefined = process.env.TWITTER_PASSWORD;
  const externalEmail: string | undefined = process.env.TWITTER_EMAIL;

  if (DEBUG) {
    logger.info(`Checking for external environment variables...`);
    logger.info(`TWITTER_USERNAME exists: ${Boolean(externalUsername)}`);
    logger.info(`TWITTER_PASSWORD exists: ${Boolean(externalPassword)}`);
    logger.info(`TWITTER_EMAIL exists: ${Boolean(externalEmail)}`);
  }

  if (!externalUsername || !externalPassword || !externalEmail) {
    throw new Error('TWITTER_USERNAME, TWITTER_PASSWORD, and TWITTER_EMAIL are required in environment variables.');
  }

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

  logger.info('Loaded Twitter credentials from external environment variables.');
  secretLoaded = true;
};

// Initialize secrets
loadSecrets();

// Export configuration object
export const config: Config = {
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
    throw new Error('Missing required Twitter credentials. Provide via environment variables.');
  }
  logger.info('Environment validation completed successfully');
}

// Cleanup credentials securely when shutting down
export function cleanupCredentials(): void {
  if (secretBuffer) {
    try {
      sodium.sodium_memzero(secretBuffer);
      sodium.sodium_munlock(secretBuffer);
      secretBuffer = null;
      secretLoaded = false;
      logger.info('Credentials cleared securely');
    } catch (error) {
      logger.error(`Error clearing credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Auto-cleanup on process exit (optional, gated by DEBUG)
if (DEBUG) {
  process.on('exit', () => {
    cleanupCredentials();
    logger.info('Process exit detected, cleaned up credentials.');
  });
}