import { type Profile, Scraper, SearchMode, type Tweet } from 'agent-twitter-client';

import { config, logger } from './config.js';

/**
 * Interface for tweet response with nested tweets property
 */
interface TweetResponse {
  tweets: Tweet[];
}

/**
 * TwitterIntegration class handles interactions with the Twitter API.
 * It provides a singleton wrapper around the agent-twitter-client library.
 */
export class TwitterIntegration {
  private scraper: Scraper | null = null;
  private isInitialized = false;
  private static instance: TwitterIntegration;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of TwitterIntegration.
   */
  public static getInstance(): TwitterIntegration {
    if (!TwitterIntegration.instance) {
      TwitterIntegration.instance = new TwitterIntegration();
    }
    return TwitterIntegration.instance;
  }

  /**
   * Initialize the Twitter client with credentials.
   * This method must be called before using any Twitter operations.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Twitter client already initialized.');
      return;
    }

    try {
      // Create a new Scraper instance
      this.scraper = new Scraper();

      // Get credentials securely
      logger.info('Retrieving Twitter credentials...');
      const credentials = config;
      logger.info(`Retrieved credentials for user: ${credentials.TWITTER_USERNAME}, ${credentials.TWOFACTOR}`);

      // Log in with credentials
      logger.info('Logging in to Twitter...');

      // If API v2 credentials are provided, use them for extended functionality
      if (
        credentials.TWITTER_API_KEY &&
        credentials.TWITTER_API_SECRET_KEY &&
        credentials.TWITTER_ACCESS_TOKEN &&
        credentials.TWITTER_ACCESS_TOKEN_SECRET
      ) {
        // Check for required username when using API authentication
        if (!credentials.TWITTER_USERNAME) {
          logger.warn(
            'No TWITTER_USERNAME provided for API authentication. This may cause issues with some operations.',
          );
        }

        try {
          await this.scraper.login(
            credentials.TWITTER_USERNAME || '',
            credentials.TWITTER_PASSWORD || '',
            credentials.TWITTER_EMAIL || '',
            credentials.TWOFACTOR || undefined, // twoFactorSecret
            credentials.TWITTER_API_KEY,
            credentials.TWITTER_API_SECRET_KEY,
            credentials.TWITTER_ACCESS_TOKEN,
            credentials.TWITTER_ACCESS_TOKEN_SECRET,
          );
          logger.info('Successfully logged in to Twitter with API credentials.');
        } catch (error) {
          logger.error(
            `API authentication failed: ${error instanceof Error ? error.message : String(error)}. Twitter auth occationally fails, you often just need to retry starting the server. `,
          );
          throw new Error(
            'Twitter API authentication failed. Twitter auth occationally fails, you often just need to retry starting the server.',
          );
        }
      } else {
        // For basic authentication, ensure we have the minimum required credentials
        if (!credentials.TWITTER_USERNAME) {
          logger.error('TWITTER_USERNAME is required for authentication');
          throw new Error('Twitter authentication failed: Missing username');
        }

        try {
          // Otherwise, just use basic authentication
          await this.scraper.login(
            credentials.TWITTER_USERNAME,
            credentials.TWITTER_PASSWORD || '',
            credentials.TWITTER_EMAIL || '',
          );
          logger.info('Successfully logged in to Twitter with basic credentials.');
        } catch (error) {
          logger.error(
            `Failed to log in to Twitter with basic credentials: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw new Error('Twitter basic authentication failed');
        }
      }

      this.isInitialized = true;
      logger.info('Twitter client initialized successfully.');
    } catch (error) {
      logger.error(
        `Failed to initialize Twitter client: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Twitter client initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure the client is authenticated before performing operations.
   * Will attempt to re-authenticate if needed.
   */
  async ensureAuthenticated(): Promise<boolean> {
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
    } catch (error) {
      logger.error(
        `Authentication check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get a Twitter profile by username.
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const profileResult = await this.scraper.getProfile(username);
      return profileResult;
    } catch (error) {
      logger.error(
        `Failed to get profile for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get the authenticated user's profile.
   */
  async getMyProfile(): Promise<Profile | null> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const profile = await this.scraper.me();
      return profile || null;
    } catch (error) {
      logger.error(
        `Failed to get current user profile: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get a specific tweet by ID.
   */
  async getTweet(tweetId: string): Promise<Tweet | null> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      return await this.scraper.getTweet(tweetId);
    } catch (error) {
      logger.error(
        `Failed to get tweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get a Twitter list.
   */
  async getListTweets(listId: string, count = 20): Promise<Tweet[]> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    const tweetsResult = await this.scraper.fetchListTweets(listId, count);

    // Handle different possible return structures from the underlying library
    let finalTweets: Tweet[] = [];
    if (Array.isArray(tweetsResult)) {
      finalTweets = tweetsResult;
    } else if (
      tweetsResult &&
      typeof tweetsResult === 'object' &&
      Array.isArray((tweetsResult as TweetResponse).tweets)
    ) {
      // Handle cases where tweets are nested under a 'tweets' property
      finalTweets = (tweetsResult as TweetResponse).tweets;
    } else {
      // If the structure is unexpected or empty in a way we don't handle, log and THROW an error
      const errorMessage = `Unexpected response format or empty result from fetchListTweets for list ${listId}`;
      logger.error(errorMessage, tweetsResult);
      // Instead of returning [], throw an error to be caught by the main handler
      throw new Error(errorMessage);
    }

    // Workaround: Truncate the results to the requested count as the library might not respect it
    if (finalTweets.length > count) {
      logger.warn(
        `fetchListTweets returned ${finalTweets.length} tweets, exceeding the requested count of ${count}. Truncating.`,
      );
      return finalTweets.slice(0, count);
    }

    return finalTweets;
  }

  /**
   * Get tweets from a user.
   */
  async getUserTweets(username: string, count = 20): Promise<Tweet[]> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const tweetGenerator = this.scraper.getTweets(username, count);
      const tweets: Tweet[] = [];

      // Consume the generator up to the count
      for await (const tweet of tweetGenerator) {
        tweets.push(tweet);
        if (tweets.length >= count) break;
      }

      return tweets;
    } catch (error) {
      logger.error(
        `Failed to get tweets for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Send a tweet.
   * Note: mediaItems should be properly formatted as required by agent-twitter-client
   */
  async sendTweet(
    text: string,
    mediaItems?: Array<{ data: Buffer; mediaType: string }>,
    inReplyToId?: string,
  ): Promise<Response> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      if (inReplyToId) {
        return await this.scraper.sendTweet(text, inReplyToId, mediaItems);
      } else {
        return await this.scraper.sendTweet(text, undefined, mediaItems);
      }
    } catch (error) {
      logger.error(
        `Failed to send tweet: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Like a tweet.
   */
  async likeTweet(tweetId: string): Promise<void> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      return await this.scraper.likeTweet(tweetId);
    } catch (error) {
      logger.error(
        `Failed to like tweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Retweet a tweet.
   */
  async retweet(tweetId: string): Promise<void> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      return await this.scraper.retweet(tweetId);
    } catch (error) {
      logger.error(
        `Failed to retweet ${tweetId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Search for tweets.
   */
  async searchTweets(
    query: string,
    count = 20,
    searchMode: SearchMode = SearchMode.Top,
  ): Promise<Tweet[]> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const tweetGenerator = this.scraper.searchTweets(query, count, searchMode);
      const tweets: Tweet[] = [];

      // Consume the generator up to the count
      for await (const tweet of tweetGenerator) {
        tweets.push(tweet);
        if (tweets.length >= count) break;
      }

      return tweets;
    } catch (error) {
      logger.error(
        `Failed to search tweets for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Search for profiles.
   */
  async searchProfiles(query: string, count = 20): Promise<Profile[]> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const profileGenerator = this.scraper.searchProfiles(query, count);
      const profiles: Profile[] = [];

      // Consume the generator up to the count
      for await (const profile of profileGenerator) {
        profiles.push(profile);
        if (profiles.length >= count) break;
      }

      return profiles;
    } catch (error) {
      logger.error(
        `Failed to search profiles for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get followers of a user.
   */
  async getFollowers(username: string, count = 20): Promise<Profile[]> {
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
      const followers: Profile[] = [];

      // Consume the generator up to the count
      for await (const follower of followerGenerator) {
        followers.push(follower);
        if (followers.length >= count) break;
      }

      return followers;
    } catch (error) {
      logger.error(
        `Failed to get followers for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get users that a user is following.
   */
  async getFollowing(username: string, count = 20): Promise<Profile[]> {
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
      const following: Profile[] = [];

      // Consume the generator up to the count
      for await (const followedUser of followingGenerator) {
        following.push(followedUser);
        if (following.length >= count) break;
      }

      return following;
    } catch (error) {
      logger.error(
        `Failed to get following for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Follow a user.
   */
  async followUser(username: string): Promise<void> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      return await this.scraper.followUser(username);
    } catch (error) {
      logger.error(
        `Failed to follow user ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Clean up resources.
   */
  async cleanup(): Promise<void> {
    if (this.scraper) {
      try {
        await this.scraper.logout();
        logger.info('Logged out of Twitter.');
      } catch (error) {
        logger.error(
          `Error during logout: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      this.scraper = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get a user's bio by username.
   * This method retrieves a Twitter user's biography/profile description.
   */
  async getUserBio(username: string): Promise<string | null> {
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
    } catch (error) {
      logger.error(
        `Failed to get bio for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get a user ID directly by username (screen name).
   * This is more efficient than retrieving the whole profile when only the ID is needed.
   */
  async getUserIdByUsername(username: string): Promise<string | null> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const userId = await this.scraper.getUserIdByScreenName(username);
      return userId || null;
    } catch (error) {
      logger.error(
        `Failed to get user ID for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Extract text from a tweet for easier processing.
   * This is useful when you want just the text content without the full tweet object.
   */
  async getTweetText(tweetId: string): Promise<string | null> {
    await this.ensureAuthenticated();

    if (!this.scraper) {
      throw new Error('Twitter client not initialized.');
    }

    try {
      const tweet = await this.scraper.getTweet(tweetId);
      return tweet?.text || null;
    } catch (error) {
      logger.error(
        `Failed to get tweet text for ${tweetId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get conversation thread for a tweet.
   * Retrieves the parent tweet and all replies to a given tweet.
   */
  async getConversationThread(tweetId: string, count = 20): Promise<Tweet[]> {
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

      const thread: Tweet[] = [originalTweet];

      // If it's a reply, get the parent tweet
      if (originalTweet.inReplyToStatusId) {
        try {
          const parentTweet = await this.scraper.getTweet(originalTweet.inReplyToStatusId);
          if (parentTweet) {
            thread.unshift(parentTweet); // Add parent at the beginning
          }
        } catch (error) {
          logger.warn(
            `Failed to get parent tweet: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Note: Original code tried to use getReplies which isn't supported
      // We'll fall back to just getting the parent tweet for the conversation

      return thread;
    } catch (error) {
      logger.error(
        `Failed to get conversation thread for ${tweetId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Check if the authenticated user is following another user.
   */
  async isFollowing(username: string): Promise<boolean> {
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
      const following: Profile[] = [];
      const followingGenerator = this.scraper.getFollowing(myProfile.userId, 100);

      for await (const followedUser of followingGenerator) {
        if (followedUser.userId === targetProfile.userId) {
          return true;
        }
        following.push(followedUser);
        if (following.length >= 100) break;
      }

      return false;
    } catch (error) {
      logger.error(
        `Failed to check following status for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      );
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
  async uploadMedia(
    mediaData: Buffer | string,
    mediaType: string,
  ): Promise<{
    data: Buffer<ArrayBufferLike>;
    mediaType: string;
  }> {
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
        throw new Error(
          `Unsupported media type: ${mediaType}. Supported types are: ${supportedTypes.join(', ')}`,
        );
      }

      // If the mediaData is passed as a base64 string, convert it to a Buffer
      const buffer =
        typeof mediaData === 'string'
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
        mediaType: mediaType,
      };
    } catch (error) {
      logger.error(
        `Failed to process media: ${error instanceof Error ? error.message : String(error)}`,
      );
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
  async sendTweetWithMedia(
    text: string,
    media: Array<{ data: string; mediaType: string }>,
    inReplyToId?: string,
  ): Promise<Response> {
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
      const imageItems = media.filter((item) =>
        ['image/jpeg', 'image/png', 'image/gif'].includes(item.mediaType),
      );

      const videoItems = media.filter((item) => item.mediaType === 'video/mp4');

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
      const mediaItems = await Promise.all(
        media.map(async (item) => {
          // Validate media type
          const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
          if (!supportedTypes.includes(item.mediaType)) {
            throw new Error(
              `Unsupported media type: ${item.mediaType}. Supported types are: ${supportedTypes.join(', ')}`,
            );
          }

          const buffer = Buffer.from(item.data.replace(/^data:.*?;base64,/, ''), 'base64');

          // If it's a video, validate file size (512MB max)
          if (item.mediaType === 'video/mp4' && buffer.length > 512 * 1024 * 1024) {
            throw new Error('Video file size exceeds maximum limit of 512MB');
          }

          return { data: buffer, mediaType: item.mediaType };
        }),
      );

      logger.info(
        `Sending tweet with ${mediaItems.length} media items: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
      );

      return await this.sendTweet(text, mediaItems, inReplyToId);
    } catch (error) {
      logger.error(
        `Failed to send tweet with media: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
