# Twitter Client MCP

A Model Context Protocol (MCP) server that provides secure access to Twitter functionality through the `agent-twitter-client` library.

## Features

The Twitter Client MCP provides the following capabilities:

- **Profile Operations**
  - Get profile information by username
  - Get the authenticated user's profile

- **Tweet Operations**
  - Get a specific tweet by ID
  - Get tweets from a user
  - Send new tweets
  - Like tweets
  - Retweet tweets

- **Search Operations**
  - Search for tweets
  - Search for profiles

- **Relationship Operations**
  - Get followers of a user
  - Get users that a user is following
  - Follow a user

## Security ⚠️

> **IMPORTANT: TWITTER CREDENTIAL PROTECTION**

This MCP server requires Twitter credentials to operate. To protect these sensitive credentials:

1. **NEVER share your credentials**
2. **NEVER run commands that display your credentials**
3. **NEVER allow the LLM to execute shell commands directly** without your approval

### Multiple Layers of Protection

This server implements several layers of security to keep your credentials safe:

#### 1. Credential Isolation
- Your credentials are only loaded during initialization
- After loading, credentials are immediately removed from environment variables
- Credentials are never logged or transmitted to the LLM

#### 2. Memory Protection
- Secure memory allocation using sodium-native
- Memory locking to prevent swapping to disk
- Zero-out memory buffers after use

#### 3. Access Prevention
- Secure environment variable handling
- Strict validation of required environment variables
- Console output sanitization to prevent leaking secrets

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Required Environment Variables

The Twitter Client MCP requires the following environment variables:

```
TWITTER_USERNAME=your_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email@example.com
```

Optionally, you can add Twitter API v2 credentials for advanced functionality:

```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET_KEY=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret
```

## Tools

The server exposes the following MCP tools:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `profileByUsername` | Get a Twitter profile by username | `username`: String |
| `myProfile` | Get the authenticated user's profile | `check`: Boolean |
| `getTweet` | Get a specific tweet by ID | `tweetId`: String |
| `getUserTweets` | Get tweets from a Twitter user | `username`: String, `count?`: Number |
| `sendTweet` | Post a new tweet | `text`: String, `inReplyToId?`: String |
| `likeTweet` | Like a tweet | `tweetId`: String |
| `retweet` | Retweet a tweet | `tweetId`: String |
| `searchTweets` | Search for tweets | `query`: String, `count?`: Number, `searchMode?`: String ('top', 'latest', 'photos', 'videos') |
| `searchProfiles` | Search for Twitter profiles | `query`: String, `count?`: Number |
| `getFollowers` | Get a list of users following a Twitter user | `username`: String, `count?`: Number |
| `getFollowing` | Get a list of users that a Twitter user is following | `username`: String, `count?`: Number |
| `followUser` | Follow a Twitter user | `username`: String |

## Usage

### Running Locally

```bash
# Start the server with environment variables
TWITTER_USERNAME=your_username TWITTER_PASSWORD=your_password TWITTER_EMAIL=your_email@example.com npm start
```

### Adding to Cursor

To add this MCP server to Cursor:

1. In Cursor, go to Settings > MCP Servers
2. Click "Add Server"
3. Configure the server with the following settings:
   - **Name**: `Twitter Client MCP` (or any name you prefer)
   - **Type**: `command`
   - **Command**: `node`
   - **Arguments**: `/path/to/twitter-client-mcp/dist/index.js` (replace with your actual path)
   - **Environment Variables**:
     - `TWITTER_USERNAME`: Your Twitter username
     - `TWITTER_PASSWORD`: Your Twitter password
     - `TWITTER_EMAIL`: Your Twitter email
     - Any other variables you want to set
4. Click "Save"

### Using NPX (Recommended)

You can also use npx to run the MCP server directly from GitHub:

```bash
TWITTER_USERNAME=your_username TWITTER_PASSWORD=your_password TWITTER_EMAIL=your_email@example.com npx github:mzkrasner/twitter-client-mcp
```

### Using Environment Variables in Cursor Configuration

For more security and ease of use, configure Cursor via the `.cursor/mcp.json` file in your home directory:

```json
{
  "mcpServers": {
    "twitter-client-mcp": {
      "command": "npx",
      "args": [
        "github:mzkrasner/twitter-client-mcp"
      ],
      "env": {
        "TWITTER_USERNAME": "your_username",
        "TWITTER_PASSWORD": "your_password",
        "TWITTER_EMAIL": "your_email@example.com"
      }
    }
  }
}
```

## Development

### Important Note for Development

When developing the MCP server, use `console.error()` instead of `console.log()` for all debugging and logging statements. The MCP protocol communicates with the client via stdout, so any `console.log()` statements will interfere with this communication.

## License

MIT 