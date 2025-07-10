# GymFlow Settings System

## Overview

The GymFlow settings system provides a comprehensive, real-time, and performant way to manage application settings across different user roles. Settings applied by gym owners are automatically propagated to trainers and members, but not to super admins.

## Features

### ✅ Real-time Settings Propagation
- WebSocket-based real-time updates
- Automatic settings synchronization
- Optimistic UI updates

### ✅ Role-based Settings Management
- **Super Admin**: Global settings for all gyms
- **Gym Owner**: Gym-specific settings that propagate to trainers/members
- **Trainer/Member**: User-specific settings (read-only from gym)

### ✅ Performance Optimizations
- Multi-level caching (Memory, LocalStorage, Service Worker)
- Bulk settings updates
- Performance monitoring
- Optimistic updates

### ✅ Offline Support
- Service Worker caching
- Graceful fallbacks
- Retry mechanisms

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Super Admin   │    │   Gym Owner     │    │ Trainer/Member  │
│                 │    │                 │    │                 │
│ Global Settings │    │ Gym Settings    │    │ User Settings   │
│                 │    │       ↓         │    │       ↑         │
│                 │    │ Propagates to → │    │ Inherits from   │
│                 │    │ Trainers/Members│    │ Gym Settings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Global Settings
- `GET /api/settings` - Get global settings (Super Admin only)
- `POST /api/settings` - Update global settings (Super Admin only)

### Gym Settings
- `GET /api/settings/gym/:gymId` - Get gym-specific settings
- `POST /api/settings/gym/:gymId` - Update gym settings with propagation

### User Settings
- `GET /api/settings/user/:userId` - Get user-specific settings
- `POST /api/settings/user/:userId` - Update user settings

### Bulk Operations
- `POST /api/settings/bulk` - Bulk update settings for multiple users

## Frontend Components

### Core Components
- `SettingsInitializer`: Loads and applies settings on app start
- `SystemSettings`: Main settings management interface
- `SettingsPerformanceMonitor`: Performance monitoring dashboard

### Hooks
- `useRealTimeSettings`: WebSocket-based real-time updates
- `useAuth`: Authentication context with role checking

### Libraries
- `settings.jsx`: Core settings management
- `settingsCache.js`: Performance-optimized caching
- `websocketService.js`: Real-time communication

## Usage Examples

### 1. Update Gym Settings with Propagation

```javascript
// In SystemSettings component
const saveSettings = async () => {
  const response = await authFetch(`/api/settings/gym/${user._id}`, {
    method: 'POST',
    body: JSON.stringify({
      settings: updatedSettings,
      applyToUsers: true // Propagate to trainers/members
    })
  });
  
  if (response.success) {
    // Settings automatically applied to all gym users
    toast.success('Settings applied to all gym users');
  }
};
```

### 2. Real-time Settings Updates

```javascript
// In useRealTimeSettings hook
const handleMessage = useCallback((event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'settings_update') {
    // Apply new settings immediately
    applySettings(data.settings, user._id, user.role, user.gymId);
    
    // Show notification
    toast.info('Settings updated by gym administrator');
  }
}, [user]);
```

### 3. Performance Monitoring

```javascript
// Performance events are automatically dispatched
window.addEventListener('settingsPerformance', (event) => {
  const { type, timing, success } = event.detail;
  
  if (type === 'cache_hit') {
    console.log('Settings loaded from cache');
  } else if (type === 'api_call') {
    console.log(`API call took ${timing}ms`);
  }
});
```

## Settings Propagation Flow

1. **Gym Owner Updates Settings**
   ```
   Gym Owner → API → Database → WebSocket → Trainers/Members
   ```

2. **Real-time Updates**
   ```
   WebSocket Message → Cache Update → UI Update → Notification
   ```

3. **Fallback Mechanisms**
   ```
   WebSocket Failed → HTTP Polling → Service Worker Cache → LocalStorage
   ```

## Performance Features

### Caching Strategy
- **L1 Cache**: In-memory cache (5 min TTL)
- **L2 Cache**: LocalStorage (persistent)
- **L3 Cache**: Service Worker (offline support)

### Optimization Techniques
- Optimistic updates for immediate UI feedback
- Bulk operations for multiple users
- WebSocket connection pooling
- Automatic retry with exponential backoff

## Deployment Configuration

### Netlify (Frontend)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_URL = "https://gym-management-system-ckb0.onrender.com"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Service-Worker-Allowed = "/"
```

### Render (Backend)
```javascript
// WebSocket support enabled
const server = http.createServer(app);
webSocketService.initialize(server);
server.listen(PORT);
```

## Testing

Run the test suite:
```bash
node test-settings.js
```

Tests cover:
- Authentication flow
- Settings CRUD operations
- Real-time propagation
- Performance metrics
- Error handling

## Security Considerations

1. **Role-based Access Control**
   - Super admins can only manage global settings
   - Gym owners can only manage their gym's settings
   - Trainers/members have read-only access

2. **WebSocket Authentication**
   - JWT token verification
   - User role validation
   - Connection rate limiting

3. **Data Validation**
   - Input sanitization
   - Settings schema validation
   - Rate limiting on updates

## Monitoring and Debugging

### Performance Metrics
- API response times
- Cache hit rates
- WebSocket connection status
- Settings update frequency

### Debug Tools
- Settings Performance Monitor (dev mode)
- WebSocket connection status
- Cache inspection tools
- Performance event logging

## Future Enhancements

1. **Settings Versioning**
   - Track settings changes
   - Rollback capabilities
   - Audit logging

2. **A/B Testing**
   - Feature flags
   - Gradual rollouts
   - Performance comparisons

3. **Advanced Caching**
   - Redis integration
   - CDN caching
   - Edge computing

## Troubleshooting

### Common Issues

1. **Settings Not Updating**
   - Check WebSocket connection
   - Verify user permissions
   - Clear cache and retry

2. **Slow Performance**
   - Check cache hit rates
   - Monitor API response times
   - Optimize settings size

3. **WebSocket Disconnections**
   - Check network connectivity
   - Verify token expiration
   - Review retry logic

### Debug Commands
```javascript
// Check cache status
console.log(settingsCache.getStats());

// Clear all caches
settingsCache.clear();
localStorage.clear();

// Force settings reload
window.location.reload();
```