#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TwitterIntegration } from "./twitter-integration.js";
import { twitterTools } from "./tools/index.js";
import { logger } from "./config.js";
import { SearchMode } from "agent-twitter-client";

// Create the MCP server
const server = new Server(
  {
    name: "twitter-client-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},    // We support tools
      resources: {}, // Empty resources
      prompts: {}    // Empty prompts
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: twitterTools,
}));

// Handle empty resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [],
}));

// Handle empty prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    const args = request.params.arguments as Record<string, any>;
    const twitter = TwitterIntegration.getInstance();
    
    logger.info(`Received tool call: ${toolName}`);
    
    // Profile tools
    if (toolName === "profileByUsername") {
      const username = args.username;
      logger.info(`Getting profile for username: ${username}`);
      
      const profile = await twitter.getProfileByUsername(username);
      
      if (!profile) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Profile not found for username: ${username}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(profile)
        }]
      };
    }
    
    else if (toolName === "myProfile") {
      if (!args.check) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "Parameter 'check' must be true" })
          }],
          isError: true
        };
      }
      
      logger.info("Getting authenticated user's profile");
      const profile = await twitter.getMyProfile();
      
      if (!profile) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "Failed to get authenticated user's profile" })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(profile)
        }]
      };
    }
    
    else if (toolName === "getUserBio") {
      const username = args.username;
      logger.info(`Getting bio for username: ${username}`);
      
      const bio = await twitter.getUserBio(username);
      
      if (bio === null) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Bio not found for username: ${username}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ username, bio })
        }]
      };
    }
    
    else if (toolName === "getUserId") {
      const username = args.username;
      logger.info(`Getting user ID for username: ${username}`);
      
      const userId = await twitter.getUserIdByUsername(username);
      
      if (userId === null) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `User ID not found for username: ${username}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ username, userId })
        }]
      };
    }
    
    else if (toolName === "isFollowing") {
      const username = args.username;
      logger.info(`Checking if currently following user: ${username}`);
      
      const isFollowing = await twitter.isFollowing(username);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ username, isFollowing })
        }]
      };
    }
    
    // Tweet tools
    else if (toolName === "getTweet") {
      const tweetId = args.tweetId;
      logger.info(`Getting tweet with ID: ${tweetId}`);
      
      const tweet = await twitter.getTweet(tweetId);
      
      if (!tweet) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Tweet not found for ID: ${tweetId}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(tweet)
        }]
      };
    }
    
    else if (toolName === "getUserTweets") {
      const username = args.username;
      const count = args.count || 20;
      
      logger.info(`Getting ${count} tweets for username: ${username}`);
      
      const tweets = await twitter.getUserTweets(username, count);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(tweets)
        }]
      };
    }
    
    else if (toolName === "getTweetText") {
      const tweetId = args.tweetId;
      logger.info(`Getting text for tweet with ID: ${tweetId}`);
      
      const tweetText = await twitter.getTweetText(tweetId);
      
      if (tweetText === null) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Tweet text not found for ID: ${tweetId}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tweetId, text: tweetText })
        }]
      };
    }
    
    else if (toolName === "getConversationThread") {
      const tweetId = args.tweetId;
      const count = args.count || 20;
      
      logger.info(`Getting conversation thread for tweet with ID: ${tweetId}`);
      
      const thread = await twitter.getConversationThread(tweetId, count);
      
      if (thread.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `No conversation found for tweet ID: ${tweetId}` })
          }],
          isError: true
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(thread)
        }]
      };
    }
    
    else if (toolName === "sendTweet") {
      const text = args.text;
      const inReplyToId = args.inReplyToId;
      
      logger.info(`Sending tweet: ${text.substring(0, 30)}${text.length > 30 ? "..." : ""}`);
      
      const result = await twitter.sendTweet(text, undefined, inReplyToId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    }
    
    else if (toolName === "likeTweet") {
      const tweetId = args.tweetId;
      
      logger.info(`Liking tweet with ID: ${tweetId}`);
      
      const result = await twitter.likeTweet(tweetId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    }
    
    else if (toolName === "retweet") {
      const tweetId = args.tweetId;
      
      logger.info(`Retweeting tweet with ID: ${tweetId}`);
      
      const result = await twitter.retweet(tweetId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    }
    
    // Search tools
    else if (toolName === "searchTweets") {
      const query = args.query;
      const count = args.count || 20;
      let searchMode = SearchMode.Top; // Default
      
      // Map string searchMode to enum
      if (args.searchMode === "latest") searchMode = SearchMode.Latest;
      else if (args.searchMode === "photos") searchMode = SearchMode.Photos;
      else if (args.searchMode === "videos") searchMode = SearchMode.Videos;
      
      logger.info(`Searching tweets with query: ${query}`);
      
      const tweets = await twitter.searchTweets(query, count, searchMode);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(tweets)
        }]
      };
    }
    
    else if (toolName === "searchProfiles") {
      const query = args.query;
      const count = args.count || 20;
      
      logger.info(`Searching profiles with query: ${query}`);
      
      const profiles = await twitter.searchProfiles(query, count);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(profiles)
        }]
      };
    }
    
    // Relationship tools
    else if (toolName === "getTwitterFollowers") {
      const username = args.username;
      const count = args.count || 20;
      
      logger.info(`Getting ${count} followers for username: ${username}`);
      
      const followers = await twitter.getFollowers(username, count);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(followers)
        }]
      };
    }
    
    else if (toolName === "getTwitterFollowing") {
      const username = args.username;
      const count = args.count || 20;
      
      logger.info(`Getting ${count} following for username: ${username}`);
      
      const following = await twitter.getFollowing(username, count);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(following)
        }]
      };
    }
    
    else if (toolName === "followUser") {
      const username = args.username;
      
      logger.info(`Following user: ${username}`);
      
      const result = await twitter.followUser(username);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    }
    
    // Media tools
    else if (toolName === "uploadMedia") {
      const data = args.data;
      const mediaType = args.mediaType;
      
      logger.info(`Processing media of type: ${mediaType}`);
      
      try {
        const mediaItem = await twitter.uploadMedia(data, mediaType);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              success: true,
              message: "Media prepared successfully",
              mediaItem: { type: mediaType }  // We don't return the full data to avoid large responses
            })
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              error: `Failed to process media: ${error instanceof Error ? error.message : String(error)}`
            })
          }],
          isError: true
        };
      }
    }
    
    else if (toolName === "sendTweetWithMedia") {
      const text = args.text;
      const media = args.media;
      const inReplyToId = args.inReplyToId;
      
      if (!Array.isArray(media) || media.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "Media array is required and must not be empty" })
          }],
          isError: true
        };
      }
      
      logger.info(`Sending tweet with ${media.length} media items: ${text.substring(0, 30)}${text.length > 30 ? "..." : ""}`);
      
      try {
        const result = await twitter.sendTweetWithMedia(text, media, inReplyToId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              error: `Failed to send tweet with media: ${error instanceof Error ? error.message : String(error)}`
            })
          }],
          isError: true
        };
      }
    }
    
    // Unknown tool
    else {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: `Unknown tool: ${toolName}` })
        }],
        isError: true
      };
    }
  } catch (error: any) {
    logger.error(`Error processing request: ${error.message || error}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ 
          error: `Error processing request: ${error.message || String(error)}`,
          stack: error.stack
        })
      }],
      isError: true
    };
  }
});

// Initialize and run the server
async function runServer() {
  try {
    
    // Initialize Twitter integration
    logger.info("Initializing Twitter integration...");
    await TwitterIntegration.getInstance().initialize();
    
    // Connect transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info("Twitter Client MCP Server running on stdio");
    
    // Handle cleanup on shutdown
    const cleanup = async () => {
      try {
        logger.info("Shutting down Twitter Client MCP Server...");
        await TwitterIntegration.getInstance().cleanup();
        process.exit(0);
      } catch (error) {
        logger.error(`Error during shutdown: ${error}`);
        process.exit(1);
      }
    };
    
    // Register shutdown handlers
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught exception: ${error}`);
      cleanup();
    });
    
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

// Run the server
runServer(); 