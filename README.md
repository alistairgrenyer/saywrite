# SayWrite - Electron App with Authentication & Rewrite API

SayWrite is an Electron application that provides on-device speech-to-text (STT) with cloud-based text rewriting capabilities. The app features secure JWT authentication, token storage via OS keychain, and a clean architecture with ports and adapters.

## Features

- **Secure Authentication**: JWT-based login with keychain storage
- **Rewrite API**: Cloud-based text rewriting with customizable profiles
- **Developer Tools**: Dev token injection for testing without login
- **Clean Architecture**: Ports and adapters pattern for maintainability
- **Type Safety**: Full TypeScript implementation with Zod validation
- **401 Handling**: Automatic token refresh and re-authentication flow

## Architecture

### Main Process (Electron)
- **TokenStore**: Manages JWT tokens with keytar integration and dev overrides
- **HttpClient**: Axios-based client with auth interceptors and 401 handling
- **ApiService**: Business logic for login, logout, and rewrite operations
- **IPC Handlers**: Secure communication bridge to renderer process

### Renderer Process (React)
- **LoginModal**: User authentication interface
- **useAuth Hook**: Authentication state management
- **HostedApiClient**: Adapter implementing ApiClient port
- **Clean UI**: Modern, responsive interface with loading states

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
├── components/          # React components
├── hooks/               # Custom React hooks
└── types/               # Global type definitions

electron/
├── main/
│   ├── tokenStore.ts    # Token management
│   ├── http.ts          # HTTP client
│   └── api.ts           # API service
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
