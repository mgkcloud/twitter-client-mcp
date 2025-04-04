import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Profile Tools
export const PROFILE_BY_USERNAME_TOOL: Tool = {
  name: "profileByUsername",
  description: "Get a Twitter profile by username",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username without @ symbol"
      }
    },
    required: ["username"]
  }
};

export const MY_PROFILE_TOOL: Tool = {
  name: "myProfile",
  description: "Get the authenticated user's Twitter profile",
  inputSchema: {
    type: "object",
    properties: {
      check: {
        type: "boolean",
        description: "Set to true to retrieve the profile"
      }
    },
    required: ["check"]
  }
};

export const GET_USER_BIO_TOOL: Tool = {
  name: "getUserBio",
  description: "Get a Twitter user's biography/profile description",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username without @ symbol"
      }
    },
    required: ["username"]
  }
};

// Tweet Tools
export const GET_TWEET_TOOL: Tool = {
  name: "getTweet",
  description: "Get a specific tweet by ID",
  inputSchema: {
    type: "object",
    properties: {
      tweetId: {
        type: "string",
        description: "The ID of the tweet to retrieve"
      }
    },
    required: ["tweetId"]
  }
};

export const GET_USER_TWEETS_TOOL: Tool = {
  name: "getUserTweets",
  description: "Get tweets from a Twitter user",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username without @ symbol"
      },
      count: {
        type: "number",
        description: "The maximum number of tweets to retrieve (default: 20)"
      }
    },
    required: ["username"]
  }
};

export const SEND_TWEET_TOOL: Tool = {
  name: "sendTweet",
  description: "Post a new tweet with optional media and/or as a reply",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text content of the tweet"
      },
      inReplyToId: {
        type: "string",
        description: "Optional tweet ID to reply to"
      }
      // Note: Media handling is not included here as it would require
      // binary data handling which is more complex in the MCP context
    },
    required: ["text"]
  }
};

export const LIKE_TWEET_TOOL: Tool = {
  name: "likeTweet",
  description: "Like a tweet",
  inputSchema: {
    type: "object",
    properties: {
      tweetId: {
        type: "string",
        description: "The ID of the tweet to like"
      }
    },
    required: ["tweetId"]
  }
};

export const RETWEET_TOOL: Tool = {
  name: "retweet",
  description: "Retweet a tweet",
  inputSchema: {
    type: "object",
    properties: {
      tweetId: {
        type: "string",
        description: "The ID of the tweet to retweet"
      }
    },
    required: ["tweetId"]
  }
};

// Search Tools
export const SEARCH_TWEETS_TOOL: Tool = {
  name: "searchTweets",
  description: "Search for tweets",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query"
      },
      count: {
        type: "number",
        description: "The maximum number of tweets to retrieve (default: 20)"
      },
      searchMode: {
        type: "string",
        description: "Search mode: 'top', 'latest', 'photos', or 'videos' (default: 'top')",
        enum: ["top", "latest", "photos", "videos"]
      }
    },
    required: ["query"]
  }
};

export const SEARCH_PROFILES_TOOL: Tool = {
  name: "searchProfiles",
  description: "Search for Twitter profiles",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query"
      },
      count: {
        type: "number",
        description: "The maximum number of profiles to retrieve (default: 20)"
      }
    },
    required: ["query"]
  }
};

// Relationship Tools
export const GET_FOLLOWERS_TOOL: Tool = {
  name: "getTwitterFollowers",
  description: "Get the followers of a Twitter user",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The username of the Twitter user"
      },
      count: {
        type: "number",
        description: "The number of followers to return"
      }
    },
    required: ["username"]
  }
};

export const GET_FOLLOWING_TOOL: Tool = {
  name: "getTwitterFollowing",
  description: "Get the users that a Twitter user is following",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The username of the Twitter user"
      },
      count: {
        type: "number",
        description: "The number of following to return"
      }
    },
    required: ["username"]
  }
};

export const FOLLOW_USER_TOOL: Tool = {
  name: "followUser",
  description: "Follow a Twitter user",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username to follow without @ symbol"
      }
    },
    required: ["username"]
  }
};

// User ID Tool
export const GET_USER_ID_TOOL: Tool = {
  name: "getUserId",
  description: "Get a Twitter user's ID by their username",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username without @ symbol"
      }
    },
    required: ["username"]
  }
};

// Tweet Text Tool
export const GET_TWEET_TEXT_TOOL: Tool = {
  name: "getTweetText",
  description: "Get only the text content of a tweet without the full tweet object",
  inputSchema: {
    type: "object",
    properties: {
      tweetId: {
        type: "string",
        description: "The ID of the tweet to retrieve text from"
      }
    },
    required: ["tweetId"]
  }
};

// Conversation Thread Tool
export const GET_CONVERSATION_THREAD_TOOL: Tool = {
  name: "getConversationThread",
  description: "Get a tweet conversation thread including the parent tweet",
  inputSchema: {
    type: "object",
    properties: {
      tweetId: {
        type: "string",
        description: "The ID of the tweet to get conversation for"
      },
      count: {
        type: "number",
        description: "The maximum number of tweets to retrieve in the thread (default: 20)"
      }
    },
    required: ["tweetId"]
  }
};

// Is Following Tool
export const IS_FOLLOWING_TOOL: Tool = {
  name: "isFollowing",
  description: "Check if the authenticated user is following another user",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The Twitter username to check if following"
      }
    },
    required: ["username"]
  }
};

// Media Tools
export const UPLOAD_MEDIA_TOOL: Tool = {
  name: "uploadMedia",
  description: "Prepare media (image/video) for posting to Twitter",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "Base64-encoded media data or data URL (e.g., 'data:image/jpeg;base64,/9j/4AAQ...')"
      },
      mediaType: {
        type: "string",
        description: "MIME type of the media. Supported types: 'image/jpeg', 'image/png', 'image/gif', 'video/mp4'. Videos must be under 512MB."
      }
    },
    required: ["data", "mediaType"]
  }
};

export const SEND_TWEET_WITH_MEDIA_TOOL: Tool = {
  name: "sendTweetWithMedia",
  description: "Post a new tweet with attached media (images/videos). Twitter limitations: max 4 images OR 1 video per tweet (cannot mix types).",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text content of the tweet"
      },
      media: {
        type: "array",
        description: "Array of media objects. Supports up to 4 images OR 1 video (not both). Supported formats: JPG, PNG, GIF, MP4. Videos must be under 512MB.",
        items: {
          type: "object",
          properties: {
            data: {
              type: "string",
              description: "Base64-encoded media data or data URL"
            },
            mediaType: {
              type: "string",
              description: "MIME type of the media. Supported types: 'image/jpeg', 'image/png', 'image/gif', 'video/mp4'"
            }
          },
          required: ["data", "mediaType"]
        }
      },
      inReplyToId: {
        type: "string",
        description: "Optional tweet ID to reply to"
      }
    },
    required: ["text", "media"]
  }
};

// Export all tools together
export const twitterTools: Tool[] = [
  // Profile tools
  PROFILE_BY_USERNAME_TOOL,
  MY_PROFILE_TOOL,
  GET_USER_BIO_TOOL,
  GET_USER_ID_TOOL,
  IS_FOLLOWING_TOOL,
  
  // Tweet tools
  GET_TWEET_TOOL,
  GET_USER_TWEETS_TOOL,
  SEND_TWEET_TOOL,
  LIKE_TWEET_TOOL,
  RETWEET_TOOL,
  GET_TWEET_TEXT_TOOL,
  GET_CONVERSATION_THREAD_TOOL,
  
  // Media tools
  UPLOAD_MEDIA_TOOL,
  SEND_TWEET_WITH_MEDIA_TOOL,
  
  // Search tools
  SEARCH_TWEETS_TOOL,
  SEARCH_PROFILES_TOOL,
  
  // Relationship tools
  GET_FOLLOWERS_TOOL,
  GET_FOLLOWING_TOOL,
  FOLLOW_USER_TOOL
]; 