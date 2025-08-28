# Changelog

## [Unreleased] - 2025-01-28

### 🔄 Major Refactoring

#### Layout System Simplification
- **BREAKING**: Removed complex subscription-based LayoutManager system
- **NEW**: Implemented simplified declarative positioning with pure functions
- **NEW**: Added `positioning.ts` with pure position calculation functions
- **NEW**: Added `useBubblePosition` hook for simple bubble state management
- **NEW**: Added `useComponentPosition` hook for component positioning
- **IMPROVED**: Components now receive `bubblePosition` as props for predictable positioning
- **FIXED**: Eliminated infinite re-render loops and flickering issues
- **FIXED**: Removed console log spam from layout system

#### Audio System Modernization
- **BREAKING**: Replaced deprecated ScriptProcessorNode with AudioWorklet
- **NEW**: Implemented `AudioWorkletCapture` class using modern Web Audio API
- **NEW**: Added `audioProcessor.js` AudioWorklet processor for real-time audio
- **IMPROVED**: Audio processing now runs on dedicated audio thread
- **FIXED**: Eliminated deprecation warnings for ScriptProcessorNode
- **IMPROVED**: Better performance and lower latency for audio recording

### 🔧 Technical Improvements

#### Security Enhancements
- **NEW**: Added Content Security Policy to `index.html`
- **FIXED**: Added `media-src 'self' blob:` for audio playback support
- **IMPROVED**: Proper CSP configuration for Electron security

#### Error Handling & Stability
- **FIXED**: AudioPlayback component errors with non-finite currentTime values
- **FIXED**: Event handler type mismatches in audio components
- **IMPROVED**: Added validation for audio duration before seeking operations
- **IMPROVED**: Better error boundaries and graceful degradation

#### Code Quality
- **REMOVED**: Obsolete `audioCapture.ts` file using deprecated APIs
- **REMOVED**: All references to old layout system files
- **CLEANED**: Updated comments and documentation to reflect new implementations
- **IMPROVED**: Consistent TypeScript interfaces and better type safety

### 📚 Documentation Updates

#### Architecture Documentation
- **UPDATED**: `ARCHITECTURE.md` with new layout system design principles
- **ADDED**: Detailed AudioWorklet implementation documentation
- **ADDED**: Layout system architecture section with benefits and design decisions
- **IMPROVED**: Feature responsibilities updated with modern implementations

#### Development Guide
- **UPDATED**: `DEVELOPMENT.md` with new development practices
- **ADDED**: Common issues section including AudioWorklet and positioning guidance
- **IMPROVED**: Performance optimization tips for new systems
- **ADDED**: Troubleshooting guide for CSP and audio issues

#### README Updates
- **UPDATED**: Feature list to highlight AudioWorklet and simplified positioning
- **IMPROVED**: Current features section with modern implementation details
- **ADDED**: References to simplified layout system benefits

### 🎯 Benefits of Changes

#### Performance Improvements
- **Audio**: Real-time processing on dedicated thread eliminates main thread blocking
- **Layout**: Pure functions eliminate unnecessary re-calculations and subscriptions
- **Memory**: Better cleanup of audio resources and reduced memory leaks
- **Rendering**: Eliminated infinite loops and reduced unnecessary re-renders

#### Developer Experience
- **Maintainability**: Simplified, declarative code is easier to understand and debug
- **Predictability**: Pure functions make behavior consistent and testable
- **Modern APIs**: Using current web standards eliminates deprecation warnings
- **Type Safety**: Better TypeScript integration with cleaner interfaces

#### User Experience
- **Stability**: No more flickering or position resets in UI components
- **Performance**: Smoother audio recording with lower latency
- **Reliability**: Eliminated console errors and improved error handling
- **Future-proof**: Modern implementations ensure long-term compatibility

### 🔄 Migration Notes

For developers working with this codebase:

1. **Layout System**: Components now receive `bubblePosition` as props instead of using `usePositionedComponent`
2. **Audio Recording**: Use `AudioWorkletCapture` instead of `AudioCapture` for new implementations
3. **Positioning**: Use `useComponentPosition` hook with bubble position for component positioning
4. **CSP**: Ensure Content Security Policy includes necessary directives for media and blob sources

### 🧹 Removed/Deprecated

- `LayoutManager` class and subscription system
- `LayoutProvider` React context
- `usePositionedComponent` hook
- `audioCapture.ts` with ScriptProcessorNode implementation
- All complex layout subscription logic
- Legacy positioning calculation methods
