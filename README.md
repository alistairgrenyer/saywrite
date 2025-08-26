# SayWrite - Voice-to-Text Rewriting Assistant

SayWrite is a modern Electron application that transforms your voice into polished, professional text. Simply speak into the floating bubble interface, and watch as your words are transcribed and intelligently rewritten for any context.

## ✨ Features

- **🎤 Voice Recording**: One-click voice recording with visual feedback
- **📝 Real-time Transcription**: Speech-to-text powered by cloud APIs
- **✨ AI Rewriting**: Transform casual speech into professional text
- **🔐 Secure Authentication**: JWT-based login with keychain storage
- **🎨 Modern UI**: Beautiful floating bubble interface with smooth animations
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🔄 Real-time Feedback**: Visual indicators for recording, processing, and rewriting states

## Architecture

### Main Process (Electron)
- **TokenStore**: Manages JWT tokens with keytar integration and dev overrides
- **HttpClient**: Axios-based client with auth interceptors and 401 handling
- **ApiService**: Business logic for login, logout, and rewrite operations
- **IPC Handlers**: Secure communication bridge to renderer process

### Renderer Process (React)
- **FloatingBubble**: Main voice recording interface with smooth animations
- **LoginModal**: User authentication interface
- **useAuth Hook**: Authentication state management
- **HostedApiClient**: Adapter implementing ApiClient port
- **Modern UI**: Floating bubble design with gradient backgrounds and transitions

### Security Features
- No tokens stored in renderer process
- All HTTP requests handled in main process
- Typed IPC surface with Zod validation
- OS keychain integration for secure token storage

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
   npm run dev
   ```

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

## File Structure

```
src/
├── core/
│   ├── models/          # Zod schemas and TypeScript types
│   └── ports/           # Interface definitions
├── adapters/
│   └── api/             # API client implementations
├── components/
│   ├── FloatingBubble.tsx    # Main voice interface
│   ├── FloatingBubble.css    # Bubble styling and animations
│   └── LoginModal.tsx        # Authentication modal
├── hooks/               # Custom React hooks
└── types/               # Global type definitions

electron/
├── main/
│   ├── tokenStore.ts    # Token management
│   ├── http.ts          # HTTP client with FormData support
│   └── api.ts           # API service with transcription
├── main.ts              # Main process entry
└── preload.ts           # IPC bridge
```

## Security Considerations

- JWT tokens are never accessible in the renderer process
- All API calls are proxied through the main process
- Keytar provides OS-level secure storage
- Request/response validation with Zod schemas
- Automatic token cleanup on 401 responses

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
