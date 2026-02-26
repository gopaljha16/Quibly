# Authentication Token State Management - Issues & Fixes

## Problems Identified

### 1. **Cookie Overwriting Issue** (CRITICAL)
- **Location**: `frontend/controllers/auth/useLoginController.ts` and `useSignupController.ts`
- **Problem**: Frontend was manually setting cookies with `document.cookie`, overwriting the secure httpOnly cookie set by the backend
- **Impact**: 
  - Security vulnerability (token accessible via JavaScript)
  - Inconsistent authentication state
  - Potential XSS attacks

### 2. **Backend Cookie Configuration**
- Backend correctly sets httpOnly cookies with these settings:
  ```javascript
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
  ```

### 3. **API Configuration**
- `frontend/lib/api.ts` correctly uses `credentials: 'include'` ✅
- CORS is properly configured on backend ✅

## Fixes Applied

### ✅ 1. Removed Manual Cookie Setting
**File**: `frontend/controllers/auth/useLoginController.ts`
```typescript
// BEFORE (WRONG):
const response = await AuthApiService.login(formData)
if (response?.token) {
    document.cookie = `token=${response.token}; path=/; max-age=604800`
}

// AFTER (CORRECT):
const response = await AuthApiService.login(formData)
// Backend sets httpOnly cookie automatically - don't override it
router.push('/channels/@me')
router.refresh()
```

**File**: `frontend/controllers/auth/useSignupController.ts`
```typescript
// Same fix applied - removed manual cookie setting
```

### ✅ 2. Updated Logout Function
**File**: `frontend/lib/auth.ts`
- Now calls backend `/auth/logout` endpoint to properly clear httpOnly cookie
- Fallback to clear client-side cookies if they exist

### ✅ 3. Improved Socket Authentication
**File**: `frontend/lib/socket.ts`
- Added token refresh on socket connection
- Ensures latest token is used when reconnecting

## How It Works Now

### Login/Signup Flow:
1. User submits credentials
2. Backend validates and generates JWT
3. **Backend sets httpOnly cookie in response** (secure, not accessible via JS)
4. Frontend receives response and redirects
5. All subsequent API calls automatically include the cookie via `credentials: 'include'`

### Authentication Check:
1. Middleware checks for `token` cookie in request
2. Backend validates JWT from cookie
3. User data attached to request if valid

### Socket Connection:
1. Socket reads token from cookies
2. Sends token in auth handshake
3. Backend validates and establishes connection

## Testing Checklist

- [ ] Clear all cookies in browser
- [ ] Try signup - should redirect to `/channels/@me`
- [ ] Check browser DevTools > Application > Cookies - should see `token` cookie with HttpOnly flag
- [ ] Refresh page - should stay logged in
- [ ] Try API calls - should work without manual token handling
- [ ] Check socket connection - should connect successfully
- [ ] Try logout - should clear cookie and redirect to login
- [ ] Try login - should work and set cookie again

## Security Improvements

### Before:
- ❌ Token accessible via `document.cookie`
- ❌ Vulnerable to XSS attacks
- ❌ Manual cookie management prone to errors

### After:
- ✅ Token in httpOnly cookie (not accessible via JavaScript)
- ✅ Protected from XSS attacks
- ✅ Automatic cookie management by browser
- ✅ Secure in production with `secure` and `sameSite` flags

## Environment Configuration

### Backend (.env):
```env
NODE_ENV=development
JWT_SECRET=<your-secret>
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Common Issues & Solutions

### Issue: "Not authenticated" errors
**Solution**: Clear all cookies and login again. The old non-httpOnly cookies may conflict.

### Issue: Socket not connecting
**Solution**: Check that token cookie is set. Socket reads from cookies automatically.

### Issue: API calls failing with 401
**Solution**: Ensure `credentials: 'include'` is set in fetch options (already done in `lib/api.ts`)

### Issue: Cookie not persisting
**Solution**: Check CORS configuration - `credentials: true` must be set on backend (already configured)

## Files Modified

1. ✅ `frontend/controllers/auth/useLoginController.ts` - Removed manual cookie setting
2. ✅ `frontend/controllers/auth/useSignupController.ts` - Removed manual cookie setting  
3. ✅ `frontend/lib/auth.ts` - Updated logout to call backend API
4. ✅ `frontend/lib/socket.ts` - Added token refresh on connection

## Next Steps

1. Test the complete auth flow
2. Clear browser cookies before testing
3. Verify httpOnly flag is set on token cookie
4. Test socket connection after login
5. Test API calls to protected endpoints
6. Test logout functionality
