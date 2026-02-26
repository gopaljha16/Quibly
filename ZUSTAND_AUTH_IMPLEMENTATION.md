# Zustand Authentication State Management - Complete Implementation

## Overview
Implemented a robust, production-ready authentication state management system using Zustand with proper synchronization between httpOnly cookies, React Query, and global state.

## Architecture

### 1. Auth Store (`frontend/lib/store/authStore.ts`)
Central source of truth for authentication state.

**State:**
- `user`: Current user object (User type)
- `isAuthenticated`: Boolean flag
- `isLoading`: Loading state for auth operations
- `error`: Error messages

**Actions:**
- `setUser(user)`: Set user and mark as authenticated
- `login(user)`: Login action
- `logout()`: Clear all auth state
- `updateUser(updates)`: Partial user updates
- `setLoading(loading)`: Set loading state
- `setError(error)`: Set error message
- `hasToken()`: Check if httpOnly cookie exists

**Features:**
- DevTools integration for debugging
- Type-safe with TypeScript
- Optimized selectors for performance

### 2. Auth Flow

#### Login/Signup Flow:
```
User submits form
  ↓
Controller calls API
  ↓
Backend validates & sets httpOnly cookie
  ↓
Frontend receives user data
  ↓
Update Zustand store with user
  ↓
Navigate to /channels/@me
  ↓
AuthProvider fetches user (if needed)
  ↓
Socket connects with auth
```

#### App Initialization:
```
App loads
  ↓
AuthProvider checks for token
  ↓
If token exists → fetch user
  ↓
Update Zustand store
  ↓
Socket connects
  ↓
App ready
```

### 3. Key Components

#### AuthProvider (`frontend/providers/AuthProvider.tsx`)
- Initializes auth state on app load
- Fetches current user if token exists
- Syncs with auth store
- Skips auth pages to avoid unnecessary calls

#### SocketProvider (`frontend/providers/SocketProvider.tsx`)
- Connects socket only when authenticated
- Uses auth store to check authentication
- Passes user ID and username to socket
- Disconnects on logout

#### Controllers
**useLoginController:**
- Manages login form state
- Calls API and updates auth store
- Handles errors and loading states

**useSignupController:**
- Manages signup form state
- Calls API and updates auth store
- Handles recommendations flow

### 4. Synchronization Points

#### Auth Store ↔ React Query
All profile mutations sync with auth store:
- `useUpdateProfile` → updates auth store
- `useUploadAvatar` → updates avatar in store
- `useUploadBanner` → updates banner in store
- `useUpdateStatus` → updates status in store

#### Auth Store ↔ Cookies
- Backend sets httpOnly cookie (secure)
- Frontend reads cookie existence (not value)
- Logout clears both store and cookie

#### Auth Store ↔ Socket
- Socket connects when `isAuthenticated === true`
- Socket uses user data from store
- Socket disconnects on logout

## Production Considerations

### 1. Security
✅ **httpOnly Cookies**: Token not accessible via JavaScript
✅ **Secure Flag**: Enabled in production
✅ **SameSite**: Set to 'none' in production for CORS
✅ **HTTPS Only**: Secure flag ensures HTTPS in production

### 2. Cookie Configuration

**Development:**
```javascript
{
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 days
}
```

**Production:**
```javascript
{
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 days
}
```

### 3. CORS Configuration
Backend properly configured for production:
```javascript
cors({
  origin: process.env.FRONTEND_URL.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
})
```

### 4. Error Handling

**Token Expiration:**
- API returns 401
- Auth store cleared
- User redirected to login
- Socket disconnected

**Network Errors:**
- Graceful degradation
- Error messages shown
- Retry logic in React Query

**Invalid Token:**
- Backend clears cookie
- Frontend clears store
- Redirect to login

## File Structure

```
frontend/
├── lib/
│   ├── store/
│   │   ├── authStore.ts          # ✅ Zustand auth store
│   │   ├── index.ts               # ✅ Export all stores
│   │   └── uiStore.ts
│   ├── auth.ts                    # ✅ Auth utilities (logout, hasToken)
│   ├── api.ts                     # API client with credentials
│   └── socket.ts                  # Socket with auth
├── providers/
│   ├── AuthProvider.tsx           # ✅ Auth initialization
│   ├── SocketProvider.tsx         # ✅ Socket with auth store
│   └── QueryProvider.tsx
├── controllers/
│   └── auth/
│       ├── useLoginController.ts  # ✅ Login with store
│       └── useSignupController.ts # ✅ Signup with store
├── hooks/
│   ├── queries/
│   │   ├── useProfile.ts          # ✅ Syncs with store
│   │   └── useUserProfile.ts      # ✅ Syncs with store
│   └── useAuthInit.ts             # Auth initialization hook
└── models/
    └── auth/
        └── types.ts                # ✅ Typed with User from store
```

## Usage Examples

### 1. Access Auth State
```typescript
import { useAuthStore } from '@/lib/store/authStore'

function MyComponent() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isLoading = useAuthStore(state => state.isLoading)
  
  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <LoginPrompt />
  
  return <div>Welcome {user?.username}</div>
}
```

### 2. Update User Data
```typescript
import { useAuthStore } from '@/lib/store/authStore'

function UpdateProfile() {
  const updateUser = useAuthStore(state => state.updateUser)
  
  const handleUpdate = () => {
    updateUser({ 
      avatar: 'new-avatar-url',
      bio: 'Updated bio'
    })
  }
}
```

### 3. Logout
```typescript
import { logout } from '@/lib/auth'

function LogoutButton() {
  return (
    <button onClick={logout}>
      Logout
    </button>
  )
}
```

### 4. Check Authentication
```typescript
import { useAuthStore, selectIsAuthenticated } from '@/lib/store/authStore'

function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <ProtectedContent />
}
```

## Testing Checklist

### Development Testing
- [ ] Login sets user in store
- [ ] Signup sets user in store
- [ ] Logout clears store
- [ ] Page refresh maintains auth
- [ ] Socket connects after login
- [ ] Socket disconnects after logout
- [ ] Profile updates sync to store
- [ ] Multiple tabs share auth state (via cookie)

### Production Testing
- [ ] HTTPS enforced
- [ ] Secure cookies set
- [ ] CORS working correctly
- [ ] Token persists across sessions
- [ ] Logout clears httpOnly cookie
- [ ] 401 errors handled gracefully
- [ ] Socket auth works in production
- [ ] No token leakage in console/network

## Debugging

### Check Auth State
```typescript
// In browser console
window.__ZUSTAND_DEVTOOLS__
```

### Check Cookie
```typescript
// In browser console
document.cookie.includes('token=')
```

### Check Store State
```typescript
import { useAuthStore } from '@/lib/store/authStore'

// Anywhere in code
console.log('Auth State:', useAuthStore.getState())
```

## Common Issues & Solutions

### Issue: User not persisting after refresh
**Solution**: Check if AuthProvider is wrapping the app and token cookie exists

### Issue: Socket not connecting
**Solution**: Verify `isAuthenticated` is true and user object exists in store

### Issue: 401 errors after login
**Solution**: Ensure `credentials: 'include'` in API calls and CORS configured

### Issue: Store not updating after profile change
**Solution**: Check that mutations call `updateUser` from auth store

## Performance Optimizations

1. **Selective Subscriptions**: Use selectors to subscribe to specific state
2. **Memoization**: User object changes trigger minimal re-renders
3. **Lazy Loading**: Auth state loaded only when needed
4. **Stale Time**: React Query caches profile for 10 minutes
5. **DevTools**: Only enabled in development

## Migration Notes

### From Old System
- Removed manual cookie setting in controllers
- Added Zustand store for centralized state
- Synced React Query with Zustand
- Updated all components to use auth store

### Breaking Changes
- None - backward compatible with existing API

## Future Enhancements

1. **Refresh Token**: Implement token refresh logic
2. **Offline Support**: Cache user data for offline access
3. **Multi-Device Sync**: WebSocket-based auth sync
4. **Session Management**: Track active sessions
5. **2FA Support**: Two-factor authentication flow
