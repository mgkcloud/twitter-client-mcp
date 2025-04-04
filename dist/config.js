import sodium from 'sodium-native';
import chalk from 'chalk';
// Redaction function with type safety
const redactSensitive = (input) => {
    if (typeof input === 'string') {
        return input
            .replace(/[0-9a-fA-F]{64}/g, '[REDACTED_KEY]')
            .replace(/[^=&\s]{32,}/g, '[REDACTED_LONG_VALUE]')
            .replace(/(private_key|secret|key|token|password)=([^&\s]+)/gi, '$1=[REDACTED]');
    }
    if (input && typeof input === 'object') {
        const sanitized = {};
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
export const logger = {
    error: (...args) => process.stderr.write(`${chalk.red('[ERROR]')} ${args.map(redactSensitive).join(' ')}\n`),
    warn: (...args) => process.stderr.write(`${chalk.yellow('[WARN]')} ${args.map(redactSensitive).join(' ')}\n`),
    info: (...args) => process.stderr.write(`${chalk.blue('[INFO]')} ${args.map(redactSensitive).join(' ')}\n`),
};
// Secure secret storage
let secretBuffer = null;
let secretLoaded = false;
const DEBUG = process.env.DEBUG === 'true';
// Load secrets from external environment variables only
const loadSecrets = () => {
    if (secretLoaded)
        return;
    if (DEBUG)
        logger.info('Starting loadSecrets process...');
    const externalUsername = process.env.TWITTER_USERNAME;
    const externalPassword = process.env.TWITTER_PASSWORD;
    const externalEmail = process.env.TWITTER_EMAIL;
    if (DEBUG) {
        logger.info(`Checking for external environment variables...`);
        logger.info(`TWITTER_USERNAME exists: ${Boolean(externalUsername)}`);
        logger.info(`TWITTER_PASSWORD exists: ${Boolean(externalPassword)}`);
        logger.info(`TWITTER_EMAIL exists: ${Boolean(externalEmail)}`);
    }
    if (!externalUsername || !externalPassword || !externalEmail) {
        throw new Error('TWITTER_USERNAME, TWITTER_PASSWORD, and TWITTER_EMAIL are required in environment variables.');
    }
    const credentials = {
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
    secretBuffer = sodium.sodium_malloc(credentialsJson.length);
    secretBuffer.write(credentialsJson);
    sodium.sodium_mlock(secretBuffer);
    process.env.TWITTER_USERNAME = '[REDACTED]';
    process.env.TWITTER_PASSWORD = '[REDACTED]';
    process.env.TWITTER_EMAIL = '[REDACTED]';
    if (process.env.TWITTER_API_KEY)
        process.env.TWITTER_API_KEY = '[REDACTED]';
    if (process.env.TWITTER_API_SECRET_KEY)
        process.env.TWITTER_API_SECRET_KEY = '[REDACTED]';
    if (process.env.TWITTER_ACCESS_TOKEN)
        process.env.TWITTER_ACCESS_TOKEN = '[REDACTED]';
    if (process.env.TWITTER_ACCESS_TOKEN_SECRET)
        process.env.TWITTER_ACCESS_TOKEN_SECRET = '[REDACTED]';
    logger.info('Loaded Twitter credentials from external environment variables.');
    secretLoaded = true;
};
// Initialize secrets
loadSecrets();
// Export configuration object
export const config = {
    PROXY_URL: process.env.PROXY_URL,
};
// Secure credentials access
export function getCredentials() {
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
export function validateEnv() {
    if (!secretLoaded || !secretBuffer) {
        throw new Error('Missing required Twitter credentials. Provide via environment variables.');
    }
    logger.info('Environment validation completed successfully');
}
// Cleanup credentials securely when shutting down
export function cleanupCredentials() {
    if (secretBuffer) {
        try {
            sodium.sodium_memzero(secretBuffer);
            sodium.sodium_munlock(secretBuffer);
            secretBuffer = null;
            secretLoaded = false;
            logger.info('Credentials cleared securely');
        }
        catch (error) {
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
