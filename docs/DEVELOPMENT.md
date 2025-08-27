# Development Guide

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd saywrite

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package as Electron app
npm run build:electron
```

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Electron development mode
npm run electron:dev

# Build and test production version
npm run build && npm run electron:preview
```

### Code Organization

Follow the feature-first architecture:

```
src/
├── app/           # Application shell
├── features/      # Business features
└── shared/        # Reusable code
```

### Import Conventions

Use path aliases for clean imports:

```typescript
// ✅ Good
import { useRecorder } from '@features/recorder';
import { GlassPanel } from '@shared/components';
import { formatDuration } from '@shared/lib/utils';

// ❌ Avoid
import { useRecorder } from '../../../features/recorder';
import { GlassPanel } from '../../shared/components/GlassPanel';
```

## Feature Development

### Creating a New Feature

1. **Create feature directory**:
   ```
   src/features/my-feature/
   ├── components/
   ├── hooks/
   ├── lib/
   └── index.ts
   ```

2. **Implement the hook** (state management):
   ```typescript
   // hooks/useMyFeature.ts
   export function useMyFeature() {
     const [state, setState] = useState();
     // ... logic
     return { state, actions };
   }
   ```

3. **Create components** (UI):
   ```typescript
   // components/MyFeaturePanel.tsx
   export function MyFeaturePanel() {
     const { state, actions } = useMyFeature();
     return <div>...</div>;
   }
   ```

4. **Export public API**:
   ```typescript
   // index.ts
   export { useMyFeature } from './hooks/useMyFeature';
   export { MyFeaturePanel } from './components/MyFeaturePanel';
   ```

5. **Integrate in app shell**:
   ```typescript
   // app/shell/AppShell.tsx
   import { useMyFeature, MyFeaturePanel } from '@features/my-feature';
   ```

### Component Guidelines

- Use functional components with hooks
- Keep components focused and small
- Use TypeScript interfaces for props
- Handle loading and error states
- Follow glass morphism design patterns

```typescript
interface MyComponentProps {
  data: string;
  onAction: (value: string) => void;
  loading?: boolean;
}

export function MyComponent({ data, onAction, loading = false }: MyComponentProps) {
  if (loading) return <div>Loading...</div>;
  
  return (
    <GlassPanel>
      {/* component content */}
    </GlassPanel>
  );
}
```

### Hook Guidelines

- One hook per concern
- Return objects with named properties
- Handle loading and error states
- Use TypeScript for all parameters and returns

```typescript
interface UseMyFeatureReturn {
  data: MyData | null;
  loading: boolean;
  error: string | null;
  actions: {
    doSomething: (param: string) => void;
    reset: () => void;
  };
}

export function useMyFeature(): UseMyFeatureReturn {
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSomething = useCallback((param: string) => {
    // implementation
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    actions: { doSomething, reset }
  };
}
```

## Electron IPC

### Adding New IPC Channels

1. **Define types** in `shared/lib/types.ts`:
   ```typescript
   export interface MyIPCData {
     input: string;
     result: number;
   }
   ```

2. **Update preload script** (`electron/preload.ts`):
   ```typescript
   const api = {
     // existing methods...
     myNewMethod: (data: MyIPCData) => ipcRenderer.invoke('my-new-method', data)
   };
   ```

3. **Update window types** (`src/types/window.d.ts`):
   ```typescript
   interface Window {
     app: {
       // existing methods...
       myNewMethod: (data: MyIPCData) => Promise<number>;
     };
   }
   ```

4. **Handle in main process** (`electron/main.ts`):
   ```typescript
   ipcMain.handle('my-new-method', async (event, data: MyIPCData) => {
     // implementation
     return result;
   });
   ```

5. **Use in renderer** via `ipcClient`:
   ```typescript
   const result = await ipcClient.myNewMethod(data);
   ```

## Styling

### Design System

- **Colors**: Dark glass morphism with transparency
- **Spacing**: 8px grid system
- **Typography**: System fonts with consistent sizing
- **Effects**: Backdrop blur, subtle shadows, smooth animations

### CSS Guidelines

- Use CSS custom properties for consistency
- Scope styles to components
- Follow BEM naming for complex components
- Use `rem` units for scalability

```css
/* Component styles */
.my-component {
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  padding: 1rem;
}

.my-component__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}
```

## Testing

### Unit Tests

Test hooks and utilities in isolation:

```typescript
import { renderHook } from '@testing-library/react';
import { useMyFeature } from './useMyFeature';

test('should initialize with default state', () => {
  const { result } = renderHook(() => useMyFeature());
  
  expect(result.current.data).toBeNull();
  expect(result.current.loading).toBe(false);
});
```

### Component Tests

Test UI components with React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('should render with data', () => {
  render(<MyComponent data="test" onAction={jest.fn()} />);
  
  expect(screen.getByText('test')).toBeInTheDocument();
});
```

## Debugging

### Development Tools

- **React DevTools**: Inspect component state and props
- **Electron DevTools**: Debug main process and IPC
- **VS Code Debugger**: Set breakpoints in TypeScript code

### Common Issues

1. **IPC not working**: Check preload script registration
2. **Import errors**: Verify path aliases in `tsconfig.json` and `vite.config.ts`
3. **Type errors**: Ensure all IPC methods are properly typed
4. **Audio issues**: Check microphone permissions and audio context state

### Logging

Use console methods with prefixes for clarity:

```typescript
console.log('[Recorder]', 'Starting recording...');
console.error('[IPC]', 'Failed to communicate with main process:', error);
```

## Performance

### Optimization Tips

- Use `useCallback` and `useMemo` for expensive operations
- Debounce user inputs and API calls
- Properly dispose of audio contexts and streams
- Use React.lazy for code splitting if needed

### Memory Management

```typescript
useEffect(() => {
  const audioContext = new AudioContext();
  
  return () => {
    // Cleanup
    audioContext.close();
  };
}, []);
```

## Deployment

### Building for Production

```bash
# Build web assets
npm run build

# Package Electron app
npm run electron:pack

# Create installers
npm run electron:dist
```

### Platform-Specific Builds

The app supports Windows, macOS, and Linux. Platform-specific configurations are in `electron-builder.json5`.

## Troubleshooting

### Common Development Issues

1. **Hot reload not working**: Restart the dev server
2. **TypeScript errors**: Run `npm run type-check`
3. **Electron app won't start**: Check main process logs
4. **Audio permissions**: Ensure microphone access is granted

### Getting Help

- Check existing issues in the repository
- Review the architecture documentation
- Use TypeScript compiler for type checking
- Test in both development and production builds
