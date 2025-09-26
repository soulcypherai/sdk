# SoulCypher Avatar SDK

JavaScript/TypeScript SDK for integrating streaming AI avatars into your applications.

## Installation

```bash
npm install @soulcypher/avatar-sdk
```

## Quick Start

```typescript
import { SoulCypherSDK, AvatarSessionManager, AVATAR_PROVIDERS } from '@soulcypher/avatar-sdk';

const sdk = new SoulCypherSDK({
  apiKey: 'your-api-key'
});

// Get avatars
const avatars = await sdk.getAvatars();

// Create session
const sessionManager = await sdk.createSession({
  avatarId: avatars[0].id,
  userId: 'user-123'
});

// Connect (video for Hedra, audio-only for RPM)
const videoEl = document.getElementById('video');
const audioEl = document.getElementById('audio');

if (avatars[0].provider === AVATAR_PROVIDERS.HEDRA) {
  await sessionManager.connect(videoEl, audioEl);
} else {
  await sessionManager.connect(undefined, audioEl);
}

// Listen for responses
sessionManager.on('avatar.response', (event) => {
  console.log('Avatar said:', event.data.text);
});

// Send message
await sessionManager.sendMessage('Hello!');
```

## Provider Types

- **Hedra**: Video + audio avatars
- **RPM**: Audio-only avatars

## Events

- `session.started` - Session connected
- `session.ended` - Session disconnected
- `avatar.response` - Text response from avatar
- `avatar.video` - Video track available (Hedra only)
- `avatar.audio` - Audio track available

## Manual Session Creation

If using your own API routes:

```typescript
// Create via your API
const sessionData = await fetch('/api/sessions', {
  method: 'POST',
  body: JSON.stringify({ avatarId, userId })
}).then(r => r.json());

// Use session data directly
const sessionManager = new AvatarSessionManager(sessionData);
```

## API Reference

### SDK Methods
- `getAvatars()` → `Avatar[]`
- `getAvatar(id)` → `Avatar`
- `createSession(request)` → `AvatarSessionManager`
- `endSession(sessionId)` → `void`

### Session Manager
- `connect(videoEl?, audioEl?)` → Connect to LiveKit
- `sendMessage(text)` → Send message to avatar
- `disconnect()` → End session
- `on(event, handler)` → Listen for events

### Types

```typescript
interface Avatar {
  id: string;
  slug: string;
  name: string;
  provider: 'rpm' | 'hedra';
  // ... other fields
}
```

## License

MIT License

## Support

- [Documentation](https://docs.soulcypher.ai)
- [Report Issues](https://github.com/soulcypher/sdk/issues)