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
interface Logger {
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
}
export declare const logger: Logger;
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
export declare const config: Config;
export declare function getCredentials(): TwitterCredentials;
export declare function validateEnv(): void;
export {};
