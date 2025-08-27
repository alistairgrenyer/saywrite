# SayWrite Architecture

## Overview

SayWrite is an Electron + React + TypeScript application that provides voice-to-text transcription with AI-powered rewriting capabilities. The application follows a **feature-first, layered architecture** that prioritizes maintainability, type safety, and clear separation of concerns.

## Core Principles

- **Feature-First Organization**: Code is organized by business features rather than technical layers
- **Single Source of Truth**: Each concern has one authoritative location
- **Composition Over Inheritance**: Favor composable functions and hooks over class hierarchies
- **Typed Boundaries**: Use TypeScript + Zod for runtime type safety at system boundaries
- **Electron Security**: Maintain strict security boundaries with context isolation

## Directory Structure

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

## Feature Structure

Each feature follows a consistent internal structure:

```
features/[feature-name]/
├── components/             # Feature-specific UI components
├── hooks/                  # Feature-specific React hooks
├── lib/                    # Feature-specific utilities and services
└── index.ts                # Public API exports
```

### Feature Responsibilities

- **Recorder**: Microphone capture, audio processing, recording state management
- **Transcript**: STT results display, audio playback, text editing
- **Rewrite**: AI-powered text enhancement and style suggestions
- **Settings**: User preferences, configuration persistence

## Shared Infrastructure

### Components (`shared/components/`)
- **ErrorBoundary**: React error boundary for graceful error handling
- **GlassPanel**: Reusable glass morphism UI panel with consistent styling

### Hooks (`shared/hooks/`)
- **usePosition**: Draggable position management with mouse events
- **useError**: Global error state management

### Library (`shared/lib/`)
- **types.ts**: Shared TypeScript interfaces and types
- **utils.ts**: Common utility functions (formatting, debounce, etc.)
- **ipc-client.ts**: Typed IPC client for Electron communication

## Electron Security Architecture

SayWrite maintains strict Electron security boundaries:

- **Context Isolation**: `contextIsolation: true` - Renderer cannot access Node.js APIs
- **Node Integration**: `nodeIntegration: false` - No direct Node.js access in renderer
- **Preload Script**: All OS/file/process operations go through typed IPC channels
- **Typed IPC**: All IPC communication uses TypeScript interfaces for type safety

### IPC Communication Flow

```
Renderer Process (React)
    ↓ (typed IPC calls)
Preload Script (context bridge)
    ↓ (IPC channels)
Main Process (Electron)
    ↓ (Node.js APIs)
Operating System
```

## State Management

- **Feature-Local State**: Each feature manages its own state using React hooks
- **Shared State**: Cross-cutting concerns use shared hooks (e.g., `useError`)
- **Persistence**: Settings persist to localStorage via `useSettings` hook
- **No Global Store**: Avoid centralized state management; lift state only when necessary

## Styling Architecture

- **Glass Morphism Design**: Consistent dark glass aesthetic with transparency effects
- **CSS Modules**: Component-scoped styles with `.css` files
- **Shared Styles**: Common styles in `styles/shared.css`
- **Design Tokens**: Consistent colors, spacing, and effects across components

## Path Aliases

The project uses TypeScript path aliases for clean imports:

- `@/` → `src/`
- `@app/` → `src/app/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`

## Development Guidelines

### Adding New Features

1. Create feature directory under `src/features/[feature-name]/`
2. Implement hooks for state management
3. Create components for UI
4. Add utilities to `lib/` if needed
5. Export public API through `index.ts`
6. Update app shell to integrate the feature

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Handle errors gracefully with ErrorBoundary
- Follow glass morphism design patterns

### Hook Guidelines

- One hook per concern
- Return objects with named properties
- Handle loading and error states
- Use TypeScript for all parameters and returns
- Follow React hooks rules

### IPC Guidelines

- All IPC calls must be typed
- Use the shared `ipcClient` for consistency
- Handle errors and timeouts appropriately
- Never expose Node.js APIs directly to renderer

## Testing Strategy

- **Unit Tests**: Test hooks and utilities in isolation
- **Component Tests**: Test UI components with React Testing Library
- **Integration Tests**: Test feature workflows end-to-end
- **E2E Tests**: Test full application flows with Electron

## Performance Considerations

- **Lazy Loading**: Load features on demand where possible
- **Audio Processing**: Use Web Workers for heavy audio processing
- **Memory Management**: Properly dispose of audio contexts and streams
- **Debouncing**: Debounce expensive operations (file I/O, API calls)

## Security Considerations

- **Input Validation**: Validate all user inputs and IPC messages
- **File Access**: Restrict file operations to necessary directories
- **Network Requests**: Validate and sanitize all external requests
- **Error Handling**: Never expose sensitive information in error messages
