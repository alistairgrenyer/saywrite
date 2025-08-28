# SayWrite - Voice-to-Text Rewriting Assistant

SayWrite is a modern Electron application that transforms your voice into polished, professional text. Simply speak into the floating bubble interface, and watch as your words are transcribed and intelligently rewritten for any context.

## ✨ Features

- **🎤 Voice Recording**: Modern AudioWorklet-based recording with visual feedback
- **📝 Real-time Transcription**: Speech-to-text powered by Whisper
- **✨ AI Rewriting**: Transform casual speech into professional text (planned)
- **⚙️ Settings Management**: Configurable audio, UI, and transcription settings
- **🎨 Modern UI**: Beautiful glass morphism interface with smooth animations
- **🔒 Secure Architecture**: Electron security boundaries with context isolation
- **🔄 Real-time Feedback**: Visual indicators for recording, processing, and transcription states
- **📐 Simplified Layout**: Declarative positioning system with pure functions and React hooks

## Architecture

SayWrite follows a **feature-first, layered architecture** that prioritizes maintainability, type safety, and clear separation of concerns.

### Core Principles
- **Feature-First Organization**: Code organized by business features rather than technical layers
- **Single Source of Truth**: Each concern has one authoritative location
- **Composition Over Inheritance**: Favor composable functions and hooks
- **Typed Boundaries**: TypeScript + Zod for runtime type safety
- **Electron Security**: Strict security boundaries with context isolation

### Directory Structure
```
src/
├── app/                    # Application shell and orchestration
│   ├── components/         # App-level UI components
│   ├── providers/          # Global providers and context
│   └── shell/              # Main app shell orchestration
├── features/               # Business features (domain logic)
│   ├── recorder/           # Audio recording and capture
│   ├── transcript/         # Speech-to-text results
│   ├── rewrite/            # AI-powered text enhancement
│   └── settings/           # Application configuration
└── shared/                 # Cross-cutting concerns
    ├── components/         # Reusable UI primitives
    ├── hooks/              # Cross-feature React hooks
    └── lib/                # Utilities, types, and services
```

### Security Architecture
- **Context Isolation**: `contextIsolation: true` - Renderer cannot access Node.js APIs
- **Node Integration**: `nodeIntegration: false` - No direct Node.js access in renderer
- **Preload Script**: All OS/file/process operations go through typed IPC channels
- **Typed IPC**: All IPC communication uses TypeScript interfaces for type safety

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and configure:
   ```bash
   API_BASE_URL=https://api.saywrite.nously.io
   DEV_JWT=your-dev-token-here  # Optional for development
   ```

3. **Run Development Server**
   ```bash
   # Start development server with hot reload
   npm run dev

   # Run Electron in development mode
   npm run electron:dev
   ```

4. **Path Aliases**
   The project uses TypeScript path aliases for clean imports:
   - `@/` → `src/`
   - `@app/` → `src/app/`
   - `@features/` → `src/features/`
   - `@shared/` → `src/shared/`

## Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)**: Detailed architecture overview and design principles
- **[Development Guide](docs/DEVELOPMENT.md)**: Comprehensive development workflow and guidelines

## Authentication (Deep Link)

SayWrite uses a custom protocol deep link to deliver authentication tokens from the browser back into the app.

- **Custom protocol**: `saywrite://auth/callback`
- **Callback query params**: `access_token`, `refresh_token`, `expires_in` (seconds), optional `email`, `id`
- **Main process**: Parses the deep link and sends payload to renderer via IPC channel `auth:tokens`
  - Payload shape: `{ accessToken, refreshToken, expiresAt, user?: { id, email } }`
  - `expiresAt = Date.now() + expires_in * 1000`
  - No token values are logged
- **Preload** (`electron/preload.ts`): Exposes `window.electronAPI.onAuthTokens(cb)` and `window.electronAPI.openExternal(url)`
- **Renderer**: Subscribes to tokens and persists via `authService`
  - See `src/app/shell/AppShell.tsx`
  - `authService.setTokens({ accessToken, refreshToken, expiresAt })`
  - `authService.setUser(user)` if present

### Refresh Token API

`authService.refreshAccessToken()` calls:

- `POST https://api.saywrite.nously.io/api/v1/auth/refresh_token?refresh_token=<token>`
- Expects `{ access_token, token_type, expires_in }`
- Keeps existing refresh token; updates access token and `expiresAt`

## API Contracts

### Authentication
```typescript
POST /v1/auth/login
Body: { email: string, password: string }
Response: { access_token: string, token_type: "bearer" }
```

### Transcription
```typescript
POST /v1/transcribe
Headers: { Authorization: "Bearer <token>" }
Body: FormData with 'audio' file and optional 'language' field
Response: { text: string }
```

### Rewrite
```typescript
POST /v1/rewrite
Headers: { Authorization: "Bearer <token>" }
Body: {
  transcript: string,
  profile: {
    id: string,
    name: string,
    tone: string,
    constraints: string[],
    format?: string,
    audience?: string,
    glossary?: Record<string, string>,
    max_words?: number
  },
  options: {
    temperature: number,
    provider_hint: string
  }
}
Response: {
  draft: string,
  usage: { stt_ms: number, llm_ms: number }
}
```

## Developer Override Options

### Environment Variable
```bash
DEV_JWT=your-jwt-token-here
```

### CLI Argument
```bash
npm run dev -- --dev-token=your-jwt-token-here
```

### Debug Menu (Future)
A debug menu item will allow JWT injection in development builds.

## Current Features

### 🎤 Recorder
- Modern AudioWorklet-based audio capture (replaces deprecated ScriptProcessorNode)
- Real-time audio processing on dedicated audio thread
- Visual recording meter with waveform display
- Audio level monitoring and resampling
- WAV file generation for transcription

### 📝 Transcript
- Speech-to-text using local Whisper integration
- Editable transcript window with glass morphism UI
- Audio playback with waveform visualization
- Processing indicators and error handling

### ⚙️ Settings
- Audio input device selection
- UI preferences (opacity, animations)
- Transcription settings and language options
- Persistent settings storage

### 🎨 Modern UI
- Glass morphism design with dark transparency
- Smooth animations and transitions
- Draggable floating bubble interface
- Simplified declarative positioning system
- Responsive and accessible components

## Security Considerations

- Tokens are delivered to the renderer via a single IPC event `auth:tokens` and stored using `authService`
- Tokens are never logged
- Electron security boundaries are preserved (`contextIsolation: true`, `nodeIntegration: false`)
- Request/response validation can be layered at boundaries (e.g., with Zod)
- Automatic token cleanup on refresh failures and logout

## Error Handling

The application provides comprehensive error handling:
- Network connectivity issues
- Invalid credentials (401)
- API validation errors (400)
- Rate limiting (429)
- Server errors (5xx)

All errors are presented to users with clear, actionable messages without exposing sensitive technical details.

## Building for Production

```bash
npm run build
```

This will create distributable packages for your target platform. Ensure keytar is properly configured for your deployment targets.

### Protocol Registration (Packaging)

`electron-builder.json5` registers the custom protocol:

```json
{
  "protocols": [
    { "name": "SayWrite", "schemes": ["saywrite"] }
  ]
}
```

On install, the OS associates `saywrite://` links with SayWrite.
