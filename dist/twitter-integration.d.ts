import { Profile, Tweet, SearchMode } from 'agent-twitter-client';
/**
 * TwitterIntegration class handles interactions with the Twitter API.
 * It provides a singleton wrapper around the agent-twitter-client library.
 */
export declare class TwitterIntegration {
    private scraper;
    private isInitialized;
    private static instance;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * Get the singleton instance of TwitterIntegration.
     */
    static getInstance(): TwitterIntegration;
    /**
     * Initialize the Twitter client with credentials.
     * This method must be called before using any Twitter operations.
     */
    initialize(): Promise<void>;
    /**
     * Ensure the client is authenticated before performing operations.
     * Will attempt to re-authenticate if needed.
     */
    ensureAuthenticated(): Promise<boolean>;
    /**
     * Get a Twitter profile by username.
     */
    getProfileByUsername(username: string): Promise<Profile | null>;
    /**
     * Get the authenticated user's profile.
     */
    getMyProfile(): Promise<Profile | null>;
    /**
     * Get a specific tweet by ID.
     */
    getTweet(tweetId: string): Promise<Tweet | null>;
    /**
     * Get tweets from a user.
     */
    getUserTweets(username: string, count?: number): Promise<Tweet[]>;
    /**
     * Send a tweet.
     * Note: mediaItems should be properly formatted as required by agent-twitter-client
     */
    sendTweet(text: string, mediaItems?: Array<{
        data: Buffer;
        mediaType: string;
    }>, inReplyToId?: string): Promise<any>;
    /**
     * Like a tweet.
     */
    likeTweet(tweetId: string): Promise<any>;
    /**
     * Retweet a tweet.
     */
    retweet(tweetId: string): Promise<any>;
    /**
     * Search for tweets.
     */
    searchTweets(query: string, count?: number, searchMode?: SearchMode): Promise<Tweet[]>;
    /**
     * Search for profiles.
     */
    searchProfiles(query: string, count?: number): Promise<Profile[]>;
    /**
     * Get followers of a user.
     */
    getFollowers(username: string, count?: number): Promise<Profile[]>;
    /**
     * Get users that a user is following.
     */
    getFollowing(username: string, count?: number): Promise<Profile[]>;
    /**
     * Follow a user.
     */
    followUser(username: string): Promise<any>;
    /**
     * Clean up resources.
     */
    cleanup(): Promise<void>;
    /**
     * Get a user's bio by username.
     * This method retrieves a Twitter user's biography/profile description.
     */
    getUserBio(username: string): Promise<string | null>;
    /**
     * Get a user ID directly by username (screen name).
     * This is more efficient than retrieving the whole profile when only the ID is needed.
     */
    getUserIdByUsername(username: string): Promise<string | null>;
    /**
     * Extract text from a tweet for easier processing.
     * This is useful when you want just the text content without the full tweet object.
     */
    getTweetText(tweetId: string): Promise<string | null>;
    /**
     * Get conversation thread for a tweet.
     * Retrieves the parent tweet and all replies to a given tweet.
     */
    getConversationThread(tweetId: string, count?: number): Promise<Tweet[]>;
    /**
     * Check if the authenticated user is following another user.
     */
    isFollowing(username: string): Promise<boolean>;
    /**
     * Upload media to Twitter.
     * This is useful for attaching media to tweets.
     *
     * @param mediaData The binary data of the media as a Buffer or base64 string
     * @param mediaType The MIME type of the media (e.g., 'image/jpeg', 'image/png', 'video/mp4')
     * @returns An object containing the uploaded media ID or an error
     */
    uploadMedia(mediaData: Buffer | string, mediaType: string): Promise<any>;
    /**
     * Send a tweet with media.
     * This is a convenience method that handles both uploading media and sending a tweet in one call.
     *
     * @param text The text content of the tweet
     * @param media An array of media objects with base64 data and media types
     * @param inReplyToId Optional tweet ID to reply to
     * @returns Response from the Twitter API
     */
    sendTweetWithMedia(text: string, media: Array<{
        data: string;
        mediaType: string;
    }>, inReplyToId?: string): Promise<any>;
}
