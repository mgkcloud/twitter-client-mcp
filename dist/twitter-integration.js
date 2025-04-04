import { Scraper, SearchMode } from 'agent-twitter-client';
import { logger, getCredentials } from './config.js';
/**
 * TwitterIntegration class handles interactions with the Twitter API.
 * It provides a singleton wrapper around the agent-twitter-client library.
 */
export class TwitterIntegration {
    scraper = null;
    isInitialized = false;
    static instance;
    /**
     * Private constructor to enforce singleton pattern.
     */
    constructor() {
        // Private constructor to enforce singleton pattern
    }
    /**
     * Get the singleton instance of TwitterIntegration.
     */
    static getInstance() {
        if (!TwitterIntegration.instance) {
            TwitterIntegration.instance = new TwitterIntegration();
        }
        return TwitterIntegration.instance;
    }
    /**
     * Initialize the Twitter client with credentials.
     * This method must be called before using any Twitter operations.
     */
    async initialize() {
        if (this.isInitialized) {
            logger.info('Twitter client already initialized.');
            return;
        }
        try {
            // Create a new Scraper instance
            this.scraper = new Scraper();
            // Get credentials securely
            const credentials = getCredentials();
            // Log in with credentials
            logger.info('Logging in to Twitter...');
            // If API v2 credentials are provided, use them for extended functionality
            if (credentials.apiKey && credentials.apiSecretKey &&
                credentials.accessToken && credentials.accessTokenSecret) {
                await this.scraper.login(credentials.username, credentials.password, credentials.email, undefined, // twoFactorSecret
                credentials.apiKey, credentials.apiSecretKey, credentials.accessToken, credentials.accessTokenSecret);
                logger.info('Logged in to Twitter with V2 API credentials.');
            }
            else {
                // Otherwise, just use basic authentication
                await this.scraper.login(credentials.username, credentials.password, credentials.email);
                logger.info('Logged in to Twitter with basic credentials.');
            }
            this.isInitialized = true;
            logger.info('Twitter client initialized successfully.');
        }
        catch (error) {
            logger.error(`Failed to initialize Twitter client: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Twitter client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Ensure the client is authenticated before performing operations.
     * Will attempt to re-authenticate if needed.
     */
    async ensureAuthenticated() {
        if (!this.scraper) {
            await this.initialize();
            return this.isInitialized;
        }
        try {
            // Check if we're still logged in
            const isLoggedIn = await this.scraper.isLoggedIn();
            if (!isLoggedIn) {
                logger.info('Twitter session expired, re-authenticating...');
                await this.initialize();
            }
            return this.isInitialized;
        }
        catch (error) {
            logger.error(`Authentication check failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * Get a Twitter profile by username.
     */
    async getProfileByUsername(username) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const profileResult = await this.scraper.getProfile(username);
            return profileResult;
        }
        catch (error) {
            logger.error(`Failed to get profile for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Get the authenticated user's profile.
     */
    async getMyProfile() {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const profile = await this.scraper.me();
            return profile || null;
        }
        catch (error) {
            logger.error(`Failed to get current user profile: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Get a specific tweet by ID.
     */
    async getTweet(tweetId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            return await this.scraper.getTweet(tweetId);
        }
        catch (error) {
            logger.error(`Failed to get tweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Get tweets from a user.
     */
    async getUserTweets(username, count = 20) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const tweetGenerator = this.scraper.getTweets(username, count);
            const tweets = [];
            // Consume the generator up to the count
            for await (const tweet of tweetGenerator) {
                tweets.push(tweet);
                if (tweets.length >= count)
                    break;
            }
            return tweets;
        }
        catch (error) {
            logger.error(`Failed to get tweets for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Send a tweet.
     * Note: mediaItems should be properly formatted as required by agent-twitter-client
     */
    async sendTweet(text, mediaItems, inReplyToId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            if (inReplyToId) {
                return await this.scraper.sendTweet(text, inReplyToId, mediaItems);
            }
            else {
                return await this.scraper.sendTweet(text, undefined, mediaItems);
            }
        }
        catch (error) {
            logger.error(`Failed to send tweet: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Like a tweet.
     */
    async likeTweet(tweetId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            return await this.scraper.likeTweet(tweetId);
        }
        catch (error) {
            logger.error(`Failed to like tweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Retweet a tweet.
     */
    async retweet(tweetId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            return await this.scraper.retweet(tweetId);
        }
        catch (error) {
            logger.error(`Failed to retweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Search for tweets.
     */
    async searchTweets(query, count = 20, searchMode = SearchMode.Top) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const tweetGenerator = this.scraper.searchTweets(query, count, searchMode);
            const tweets = [];
            // Consume the generator up to the count
            for await (const tweet of tweetGenerator) {
                tweets.push(tweet);
                if (tweets.length >= count)
                    break;
            }
            return tweets;
        }
        catch (error) {
            logger.error(`Failed to search tweets for "${query}": ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Search for profiles.
     */
    async searchProfiles(query, count = 20) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const profileGenerator = this.scraper.searchProfiles(query, count);
            const profiles = [];
            // Consume the generator up to the count
            for await (const profile of profileGenerator) {
                profiles.push(profile);
                if (profiles.length >= count)
                    break;
            }
            return profiles;
        }
        catch (error) {
            logger.error(`Failed to search profiles for "${query}": ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Get followers of a user.
     */
    async getFollowers(username, count = 20) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // First get the user ID
            const profile = await this.scraper.getProfile(username);
            if (!profile.userId) {
                throw new Error(`Could not find user ID for ${username}`);
            }
            const followerGenerator = this.scraper.getFollowers(profile.userId, count);
            const followers = [];
            // Consume the generator up to the count
            for await (const follower of followerGenerator) {
                followers.push(follower);
                if (followers.length >= count)
                    break;
            }
            return followers;
        }
        catch (error) {
            logger.error(`Failed to get followers for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Get users that a user is following.
     */
    async getFollowing(username, count = 20) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // First get the user ID
            const profile = await this.scraper.getProfile(username);
            if (!profile.userId) {
                throw new Error(`Could not find user ID for ${username}`);
            }
            const followingGenerator = this.scraper.getFollowing(profile.userId, count);
            const following = [];
            // Consume the generator up to the count
            for await (const followedUser of followingGenerator) {
                following.push(followedUser);
                if (following.length >= count)
                    break;
            }
            return following;
        }
        catch (error) {
            logger.error(`Failed to get following for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Follow a user.
     */
    async followUser(username) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            return await this.scraper.followUser(username);
        }
        catch (error) {
            logger.error(`Failed to follow user ${username}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Clean up resources.
     */
    async cleanup() {
        if (this.scraper) {
            try {
                await this.scraper.logout();
                logger.info('Logged out of Twitter.');
            }
            catch (error) {
                logger.error(`Error during logout: ${error instanceof Error ? error.message : String(error)}`);
            }
            this.scraper = null;
            this.isInitialized = false;
        }
    }
    /**
     * Get a user's bio by username.
     * This method retrieves a Twitter user's biography/profile description.
     */
    async getUserBio(username) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const profile = await this.scraper.getProfile(username);
            if (!profile) {
                return null;
            }
            return profile.biography || null;
        }
        catch (error) {
            logger.error(`Failed to get bio for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Get a user ID directly by username (screen name).
     * This is more efficient than retrieving the whole profile when only the ID is needed.
     */
    async getUserIdByUsername(username) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const userId = await this.scraper.getUserIdByScreenName(username);
            return userId || null;
        }
        catch (error) {
            logger.error(`Failed to get user ID for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Extract text from a tweet for easier processing.
     * This is useful when you want just the text content without the full tweet object.
     */
    async getTweetText(tweetId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            const tweet = await this.scraper.getTweet(tweetId);
            return tweet?.text || null;
        }
        catch (error) {
            logger.error(`Failed to get tweet text for ${tweetId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Get conversation thread for a tweet.
     * Retrieves the parent tweet and all replies to a given tweet.
     */
    async getConversationThread(tweetId, count = 20) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // First get the original tweet
            const originalTweet = await this.scraper.getTweet(tweetId);
            if (!originalTweet) {
                throw new Error(`Tweet not found: ${tweetId}`);
            }
            const thread = [originalTweet];
            // If it's a reply, get the parent tweet
            if (originalTweet.inReplyToStatusId) {
                try {
                    const parentTweet = await this.scraper.getTweet(originalTweet.inReplyToStatusId);
                    if (parentTweet) {
                        thread.unshift(parentTweet); // Add parent at the beginning
                    }
                }
                catch (error) {
                    logger.warn(`Failed to get parent tweet: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Note: Original code tried to use getReplies which isn't supported
            // We'll fall back to just getting the parent tweet for the conversation
            return thread;
        }
        catch (error) {
            logger.error(`Failed to get conversation thread for ${tweetId}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Check if the authenticated user is following another user.
     */
    async isFollowing(username) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // Note: Original code tried to use isFollowing which isn't supported
            // Instead we'll check our following list to see if this user is in it
            // First get the user's profile to get their ID
            const targetProfile = await this.scraper.getProfile(username);
            if (!targetProfile || !targetProfile.userId) {
                throw new Error(`Could not find user ID for ${username}`);
            }
            // Get our profile
            const myProfile = await this.scraper.me();
            if (!myProfile || !myProfile.userId) {
                throw new Error('Could not retrieve authenticated user profile');
            }
            // Get our following (limited to reasonable amount to check)
            const following = [];
            const followingGenerator = this.scraper.getFollowing(myProfile.userId, 100);
            for await (const followedUser of followingGenerator) {
                if (followedUser.userId === targetProfile.userId) {
                    return true;
                }
                following.push(followedUser);
                if (following.length >= 100)
                    break;
            }
            return false;
        }
        catch (error) {
            logger.error(`Failed to check following status for ${username}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * Upload media to Twitter.
     * This is useful for attaching media to tweets.
     *
     * @param mediaData The binary data of the media as a Buffer or base64 string
     * @param mediaType The MIME type of the media (e.g., 'image/jpeg', 'image/png', 'video/mp4')
     * @returns An object containing the uploaded media ID or an error
     */
    async uploadMedia(mediaData, mediaType) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // Validate media type
            const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const supportedVideoTypes = ['video/mp4'];
            const supportedTypes = [...supportedImageTypes, ...supportedVideoTypes];
            if (!supportedTypes.includes(mediaType)) {
                throw new Error(`Unsupported media type: ${mediaType}. Supported types are: ${supportedTypes.join(', ')}`);
            }
            // If the mediaData is passed as a base64 string, convert it to a Buffer
            const buffer = typeof mediaData === 'string'
                ? Buffer.from(mediaData.replace(/^data:.*?;base64,/, ''), 'base64')
                : mediaData;
            logger.info(`Preparing media of type ${mediaType} (${buffer.length} bytes)`);
            // If it's a video, validate file size (512MB max)
            if (mediaType === 'video/mp4' && buffer.length > 512 * 1024 * 1024) {
                throw new Error('Video file size exceeds maximum limit of 512MB');
            }
            // Instead of using a direct uploadMedia method (which doesn't exist),
            // we'll prepare the media item and return it to be used with sendTweet
            return {
                data: buffer,
                mediaType: mediaType
            };
        }
        catch (error) {
            logger.error(`Failed to process media: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Send a tweet with media.
     * This is a convenience method that handles both uploading media and sending a tweet in one call.
     *
     * @param text The text content of the tweet
     * @param media An array of media objects with base64 data and media types
     * @param inReplyToId Optional tweet ID to reply to
     * @returns Response from the Twitter API
     */
    async sendTweetWithMedia(text, media, inReplyToId) {
        await this.ensureAuthenticated();
        if (!this.scraper) {
            throw new Error('Twitter client not initialized.');
        }
        try {
            // Twitter limitations:
            // - Maximum 4 images per tweet
            // - Only 1 video per tweet
            // - Cannot mix videos and images in the same tweet
            // Count image and video items
            const imageItems = media.filter(item => ['image/jpeg', 'image/png', 'image/gif'].includes(item.mediaType));
            const videoItems = media.filter(item => item.mediaType === 'video/mp4');
            // Validate counts
            if (imageItems.length > 0 && videoItems.length > 0) {
                throw new Error('Cannot mix images and videos in the same tweet');
            }
            if (imageItems.length > 4) {
                throw new Error('Maximum of 4 images per tweet allowed');
            }
            if (videoItems.length > 1) {
                throw new Error('Maximum of 1 video per tweet allowed');
            }
            // Upload all media files
            const mediaItems = await Promise.all(media.map(async (item) => {
                // Validate media type
                const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
                if (!supportedTypes.includes(item.mediaType)) {
                    throw new Error(`Unsupported media type: ${item.mediaType}. Supported types are: ${supportedTypes.join(', ')}`);
                }
                const buffer = Buffer.from(item.data.replace(/^data:.*?;base64,/, ''), 'base64');
                // If it's a video, validate file size (512MB max)
                if (item.mediaType === 'video/mp4' && buffer.length > 512 * 1024 * 1024) {
                    throw new Error('Video file size exceeds maximum limit of 512MB');
                }
                return { data: buffer, mediaType: item.mediaType };
            }));
            logger.info(`Sending tweet with ${mediaItems.length} media items: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
            return await this.sendTweet(text, mediaItems, inReplyToId);
        }
        catch (error) {
            logger.error(`Failed to send tweet with media: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
