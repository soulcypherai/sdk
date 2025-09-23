# SoulCypher Avatar SDK

The official JavaScript/TypeScript SDK for integrating streaming AI avatars into your applications using the SoulCypher platform.

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @soulcypher/avatar-sdk

# yarn
yarn add @soulcypher/avatar-sdk

# pnpm
pnpm add @soulcypher/avatar-sdk
```

### Basic Usage

```typescript
import { SoulCypherSDK } from '@soulcypher/avatar-sdk';

// Initialize SDK
const sdk = new SoulCypherSDK({
  apiKey: 'your-api-key-here'
});

// Get available avatars
const avatars = await sdk.getAvatars();
console.log('Available avatars:', avatars);

// Create a session with an avatar
const sessionManager = await sdk.createSession({
  avatarId: avatars[0].id,
  userId: 'user-123'
});

// Connect to video element for streaming
const videoElement = document.getElementById('avatar-video');
await sessionManager.connect(videoElement);

// Send a message to the avatar
await sessionManager.sendMessage('Hello, how are you today?');

// Listen for avatar responses
sessionManager.on('avatar.message', (event) => {
  console.log('Avatar said:', event.data);
});

// End the session
await sdk.endSession(sessionManager.session.id);
```

## 📚 Documentation

### SDK Configuration

```typescript
const sdk = new SoulCypherSDK({
  apiKey: string,           // Required: Your API key
  baseUrl?: string,         // Optional: Custom API base URL
  environment?: string      // Optional: 'production' | 'development'
});
```

### Core Methods

#### `getAvatars()`
Retrieve all available avatars.

```typescript
const avatars = await sdk.getAvatars();
// Returns: Avatar[]
```

#### `getAvatar(avatarId)`
Get specific avatar details.

```typescript
const avatar = await sdk.getAvatar('avatar-uuid');
// Returns: Avatar
```

#### `createSession(request)`
Create a new avatar session.

```typescript
const sessionManager = await sdk.createSession({
  avatarId: 'avatar-uuid',
  userId: 'user-123',
  metadata?: {
    sessionName?: string,
    customContext?: string
  }
});
// Returns: AvatarSessionManager
```

#### `endSession(sessionId)`
End an active session.

```typescript
await sdk.endSession('session-uuid');
```

#### `ping()`
Test API connectivity.

```typescript
const isHealthy = await sdk.ping();
// Returns: boolean
```

### Session Management

The `AvatarSessionManager` handles real-time avatar interactions:

#### Connection

```typescript
// Connect to video and audio elements
await sessionManager.connect(videoElement, audioElement);

// Get connection status
const status = sessionManager.getStatus();
// Returns: 'disconnected' | 'connecting' | 'connected' | 'error'
```

#### Messaging

```typescript
// Send message to avatar
await sessionManager.sendMessage('Tell me about yourself');

// Listen for responses
sessionManager.on('avatar.message', (event) => {
  console.log('Avatar response:', event.data.content);
});
```

#### Events

```typescript
// Session events
sessionManager.on('session.started', (event) => {
  console.log('Session started:', event.session.id);
});

sessionManager.on('session.ended', (event) => {
  console.log('Session ended');
});

// Media events
sessionManager.on('avatar.video', (event) => {
  console.log('Video track available:', event.track);
});

sessionManager.on('avatar.audio', (event) => {
  console.log('Audio track available:', event.track);
});

// Connection quality
sessionManager.on('connection.quality', (event) => {
  console.log('Connection quality:', event.quality);
});
```

#### Cleanup

```typescript
// Disconnect from current session
await sessionManager.disconnect();

// Cleanup all sessions
await sdk.cleanup();
```

## 🎯 Framework Integration

### React

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { SoulCypherSDK, AvatarSessionManager } from '@soulcypher/avatar-sdk';

function AvatarChat() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionManager, setSessionManager] = useState<AvatarSessionManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sdk = new SoulCypherSDK({
      apiKey: process.env.REACT_APP_SOULCYPHER_API_KEY!
    });

    const initSession = async () => {
      try {
        const avatars = await sdk.getAvatars();
        const session = await sdk.createSession({
          avatarId: avatars[0].id,
          userId: 'user-123'
        });

        session.on('session.started', () => setIsConnected(true));
        session.on('session.ended', () => setIsConnected(false));

        await session.connect(videoRef.current!);
        setSessionManager(session);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();

    return () => {
      sessionManager?.disconnect();
    };
  }, []);

  const sendMessage = async (message: string) => {
    if (sessionManager) {
      await sessionManager.sendMessage(message);
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={() => sendMessage('Hello!')}>
        Say Hello
      </button>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>SoulCypher Avatar Demo</title>
</head>
<body>
  <video id="avatar-video" autoplay playsinline></video>
  <div id="status">Disconnected</div>
  <button id="hello-btn" disabled>Say Hello</button>

  <script type="module">
    import { SoulCypherSDK } from 'https://unpkg.com/@soulcypher/avatar-sdk/dist/index.esm.js';

    const videoElement = document.getElementById('avatar-video');
    const statusElement = document.getElementById('status');
    const helloButton = document.getElementById('hello-btn');

    const sdk = new SoulCypherSDK({
      apiKey: 'your-api-key'
    });

    let sessionManager = null;

    async function initializeAvatar() {
      try {
        const avatars = await sdk.getAvatars();
        sessionManager = await sdk.createSession({
          avatarId: avatars[0].id,
          userId: 'demo-user'
        });

        sessionManager.on('session.started', () => {
          statusElement.textContent = 'Connected';
          helloButton.disabled = false;
        });

        await sessionManager.connect(videoElement);
      } catch (error) {
        console.error('Failed to initialize avatar:', error);
        statusElement.textContent = 'Error: ' + error.message;
      }
    }

    helloButton.addEventListener('click', async () => {
      if (sessionManager) {
        await sessionManager.sendMessage('Hello, nice to meet you!');
      }
    });

    initializeAvatar();
  </script>
</body>
</html>
```

## 🔧 Advanced Usage

### Custom Error Handling

```typescript
import {
  SoulCypherSDK,
  SoulCypherError,
  AuthenticationError,
  RateLimitError
} from '@soulcypher/avatar-sdk';

try {
  const sdk = new SoulCypherSDK({ apiKey: 'invalid-key' });
  await sdk.getAvatars();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded:', error.message);
  } else if (error instanceof SoulCypherError) {
    console.error('API error:', error.message, error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Multiple Sessions

```typescript
const sdk = new SoulCypherSDK({ apiKey: 'your-api-key' });

// Create multiple sessions
const session1 = await sdk.createSession({
  avatarId: 'avatar-1',
  userId: 'user-123'
});

const session2 = await sdk.createSession({
  avatarId: 'avatar-2',
  userId: 'user-123'
});

// Get all active sessions
const activeSessions = sdk.getActiveSessions();
console.log(`${activeSessions.length} active sessions`);

// Cleanup all sessions
await sdk.cleanup();
```

### Session Persistence

```typescript
// Store session ID for later use
const sessionManager = await sdk.createSession({
  avatarId: 'avatar-uuid',
  userId: 'user-123'
});

localStorage.setItem('avatarSessionId', sessionManager.session.id);

// Later, retrieve existing session
const sessionId = localStorage.getItem('avatarSessionId');
if (sessionId) {
  const existingSession = await sdk.getSession(sessionId);
  if (existingSession) {
    await existingSession.connect(videoElement);
  }
}
```

## 🎨 UI Components

### Connection Status Indicator

```typescript
function ConnectionStatus({ sessionManager }: { sessionManager: AvatarSessionManager }) {
  const [status, setStatus] = useState(sessionManager.getStatus());

  useEffect(() => {
    const updateStatus = () => setStatus(sessionManager.getStatus());

    sessionManager.on('session.started', updateStatus);
    sessionManager.on('session.ended', updateStatus);
    sessionManager.on('connection.quality', updateStatus);

    return () => {
      sessionManager.off('session.started', updateStatus);
      sessionManager.off('session.ended', updateStatus);
      sessionManager.off('connection.quality', updateStatus);
    };
  }, [sessionManager]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'green';
      case 'connecting': return 'yellow';
      case 'disconnected': return 'gray';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div style={{ color: getStatusColor() }}>
      Status: {status}
    </div>
  );
}
```

## 📋 API Reference

### Types

```typescript
interface SDKConfig {
  apiKey: string;
  baseUrl?: string;
  environment?: 'production' | 'development';
}

interface Avatar {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  provider: 'RPM' | 'Hedra';
  costPerMinute: string;
}

interface CreateSessionRequest {
  avatarId: string;
  userId: string;
  metadata?: {
    sessionName?: string;
    customContext?: string;
    userAgent?: string;
  };
}

interface AvatarSession {
  id: string;
  sessionId: string;
  provider: string;
  roomName: string;
  liveKitToken: string;
  liveKitUrl: string;
  avatar: Avatar;
  expiresAt: string;
}

interface SessionEventData {
  type: string;
  session: AvatarSession;
  timestamp: string;
  data: any;
}
```

### Error Types

- `SoulCypherError` - Base error class
- `AuthenticationError` - Invalid or expired API key
- `RateLimitError` - Rate limit exceeded
- `SessionError` - Session-related errors
- `ConnectionError` - Network/connection issues

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/soulcypher/dev-platform.git
cd dev-platform/sdk

# Install dependencies
yarn install

# Build the SDK
yarn build

# Run tests
yarn test

# Start development mode
yarn dev
```

### Package Structure

```
sdk/
├── packages/
│   ├── js/              # JavaScript/TypeScript SDK
│   │   ├── src/         # Source code
│   │   ├── dist/        # Built package
│   │   └── package.json
│   ├── react-native/    # React Native SDK (coming soon)
│   └── shared/          # Shared utilities
├── examples/            # Usage examples
└── docs/               # Documentation
```

## 🔒 Security

- API keys are transmitted securely via HTTPS
- WebRTC connections use secure protocols
- Session tokens have automatic expiration
- No sensitive data is stored locally

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📖 [Documentation](https://docs.soulcypher.ai)
- 📧 [Email Support](mailto:support@soulcypher.ai)
- 🐛 [Report Issues](https://github.com/soulcypher/sdk/issues)


---

Made with ❤️ by the SoulCypher team