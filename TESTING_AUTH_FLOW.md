# Testing Authentication Flow - Step by Step Guide

## Prerequisites
1. Backend server running on `http://localhost:5000`
2. Frontend server running on `http://localhost:3000`
3. Clear all browser cookies before testing

## Test 1: Signup Flow

### Steps:
1. Open browser DevTools (F12)
2. Go to Application > Cookies > `http://localhost:3000`
3. Clear all cookies
4. Navigate to `http://localhost:3000/signup`
5. Fill in the signup form:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Select at least one interest
6. Click "Create Account"

### Expected Results:
✅ Redirected to `/channels/@me`
✅ In DevTools > Application > Cookies, you should see:
   - Cookie name: `token`
   - HttpOnly: ✅ (checked)
   - Secure: ❌ (unchecked in development)
   - SameSite: `Lax`
   - Path: `/`
   - Expires: 7 days from now

✅ Console should show: "Socket connected: <socket-id>"
✅ No JavaScript errors in console

### If It Fails:
- Check backend console for errors
- Check Network tab for `/api/auth/register` request
- Verify response includes `Set-Cookie` header
- Check if CORS is working (no CORS errors in console)

---

## Test 2: Login Flow

### Steps:
1. Clear all cookies again
2. Navigate to `http://localhost:3000/login`
3. Fill in the login form:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Sign In"

### Expected Results:
✅ Redirected to `/channels/@me`
✅ Cookie `token` is set with HttpOnly flag
✅ Socket connects successfully
✅ User data loads (profile, servers, etc.)

---

## Test 3: Session Persistence

### Steps:
1. After logging in, refresh the page (F5)
2. Navigate to different routes
3. Close and reopen the browser tab

### Expected Results:
✅ User stays logged in after refresh
✅ No redirect to login page
✅ All data loads correctly
✅ Socket reconnects automatically

---

## Test 4: Protected Routes

### Steps:
1. While logged in, try accessing:
   - `/channels/@me` - should work
   - `/channels/[serverId]/[channelId]` - should work
2. Logout (if logout button exists)
3. Try accessing the same routes

### Expected Results:
✅ When logged in: All routes accessible
✅ When logged out: Redirected to `/login`

---

## Test 5: API Calls

### Steps:
1. Login successfully
2. Open DevTools > Network tab
3. Navigate around the app to trigger API calls
4. Check the request headers

### Expected Results:
✅ All API requests to `/api/*` include `Cookie: token=...` header
✅ Responses are successful (200, 201, etc.)
✅ No 401 Unauthorized errors

---

## Test 6: Socket Authentication

### Steps:
1. Login successfully
2. Open DevTools > Console
3. Look for socket connection logs

### Expected Results:
✅ Console shows: "Socket connected: <socket-id>"
✅ No "auth_error" messages
✅ Real-time features work (messages, presence, etc.)

---

## Test 7: Logout Flow

### Steps:
1. While logged in, call the logout function
2. Check cookies in DevTools
3. Try accessing protected routes

### Expected Results:
✅ Redirected to `/login`
✅ Cookie `token` is removed
✅ Socket disconnects
✅ Cannot access protected routes

---

## Test 8: Multiple Tabs

### Steps:
1. Login in one tab
2. Open another tab with the same app
3. Logout from one tab
4. Check the other tab

### Expected Results:
✅ Both tabs share the same session
✅ Logging out from one tab should affect the other (may need refresh)

---

## Common Issues & Debugging

### Issue: Cookie not being set
**Debug Steps:**
1. Check Network tab > Response Headers for `Set-Cookie`
2. Verify backend is sending the cookie
3. Check CORS configuration
4. Ensure `credentials: 'include'` in API calls

### Issue: 401 Unauthorized errors
**Debug Steps:**
1. Check if cookie exists in DevTools
2. Verify cookie is being sent in request headers
3. Check backend JWT validation
4. Verify JWT_SECRET matches between requests

### Issue: Socket not connecting
**Debug Steps:**
1. Check if token cookie exists
2. Look for socket errors in console
3. Verify SOCKET_URL is correct
4. Check backend socket authentication middleware

### Issue: Redirect loop
**Debug Steps:**
1. Clear all cookies
2. Check middleware logic in `frontend/middleware.ts`
3. Verify token validation on backend
4. Check for expired tokens

---

## Browser DevTools Shortcuts

- **Open DevTools**: F12 or Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
- **Network Tab**: See all HTTP requests
- **Console Tab**: See logs and errors
- **Application Tab**: See cookies, localStorage, etc.
- **Clear Cookies**: Application > Cookies > Right-click > Clear

---

## Success Criteria

All tests should pass with:
- ✅ No JavaScript errors in console
- ✅ No 401/403 errors in Network tab
- ✅ HttpOnly cookie is set correctly
- ✅ Socket connects successfully
- ✅ Session persists across page refreshes
- ✅ Protected routes are properly guarded
- ✅ Logout clears session completely
