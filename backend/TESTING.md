# Multi-Instance Testing Guide

## Purpose

This guide demonstrates the cross-instance WebSocket broadcast failure identified in the production architecture audit.

## The Problem

When running multiple backend instances:
- Each instance has isolated in-memory state (Maps in `presence.socket.js`)
- `global.io.to(room).emit()` only broadcasts to clients connected to that specific instance
- Users on different instances don't receive real-time updates from each other

## Quick Test (Manual)

### Step 1: Start Backend Instances

Open 3 terminal windows:

**Terminal 1 - Instance 1:**
```bash
cd backend
npm run test:instance1
# or: INSTANCE_ID=Instance-1 PORT=5000 node src/index.js
```

**Terminal 2 - Instance 2:**
```bash
cd backend
npm run test:instance2
# or: INSTANCE_ID=Instance-2 PORT=5001 node src/index.js
```

**Terminal 3 - Load Test:**
```bash
cd backend
npm run test:multi
# or: node test-multi-instance.js
```

### Step 2: Manual Browser Test

1. Open browser tab 1: `http://localhost:3000` (connects to frontend)
2. Open DevTools Console, run:
   ```javascript
   // Force connect to Instance 1
   const socket1 = io('http://localhost:5000', { 
     auth: { token: document.cookie.match(/token=([^;]+)/)[1] } 
   });
   socket1.emit('join_channel', 'YOUR_CHANNEL_ID');
   socket1.on('receive_message', msg => console.log('Socket1 received:', msg));
   ```

3. Open browser tab 2, run:
   ```javascript
   // Force connect to Instance 2
   const socket2 = io('http://localhost:5001', { 
     auth: { token: document.cookie.match(/token=([^;]+)/)[1] } 
   });
   socket2.emit('join_channel', 'YOUR_CHANNEL_ID');
   socket2.on('receive_message', msg => console.log('Socket2 received:', msg));
   ```

4. Send message from Socket 1:
   ```javascript
   socket1.emit('send_message', {
     channelId: 'YOUR_CHANNEL_ID',
     content: 'Test from Instance 1'
   });
   ```

### Expected Result (FAILURE)

- ✅ Socket1 receives the message (same instance)
- ❌ Socket2 does NOT receive the message (different instance)

### What You'll See in Logs

**Instance 1 logs:**
```
[Instance-1] 📨 MESSAGE_SEND: User abc123 → Channel xyz789 | "Test from Instance 1..."
[Instance-1] 📡 BROADCAST: Emitting to channel xyz789 | Message msg_abc123
```

**Instance 2 logs:**
```
(silence - no broadcast received)
```

This proves the isolation issue.

## Automated Test

The `test-multi-instance.js` script automates this:

```bash
# Make sure both instances are running first
npm run test:instance1  # Terminal 1
npm run test:instance2  # Terminal 2

# Then run test
npm run test:multi      # Terminal 3
```

**Expected output:**
```
🔴 CROSS-INSTANCE BROADCAST FAILURE CONFIRMED
   The message was only broadcast to clients on Instance 1.
   Clients on Instance 2 did not receive it.
```

## Debug Logging Added

All WebSocket events now log with instance ID:

- `🔌 CONNECT` - User connects to instance
- `🔌 DISCONNECT` - User disconnects  
- `📨 MESSAGE_SEND` - Instance receives message
- `📡 BROADCAST` - Instance attempts to emit
- `👤 PRESENCE_ONLINE` - User comes online (local state)
- `👤 PRESENCE_OFFLINE` - User goes offline (local state)

Watch the logs to see how events are isolated per instance.

## The Fix

Install Socket.IO Redis adapter to enable cross-instance pub/sub:

```bash
npm install @socket.io/redis-adapter redis
```

Modify `src/socket/index.js`:
```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));
```

Then re-run the test - both clients should receive messages ✅

## Presence State Issue

Similar problem with presence tracking:

```javascript
// backend/src/socket/presence.socket.js
const activeConnections = new Map(); // ❌ LOCAL to this instance  
```

**Test:**
1. User A connects to Instance 1
2. User B (on Instance 2) queries "who's online?"
3. Instance 2's Map is empty → User A appears offline ❌

**Fix:** Migrate to Redis Sets (see audit report Priority 1, Task #2)

## Production Deployment

⚠️ **DO NOT deploy multiple instances without fixing these issues**

Current behavior with load balancer:
- 10 instances running
- Random distribution of connections
- Only ~10% of users receive each broadcast
- Presence appears broken for 90% of users

**Use sticky sessions as temporary workaround** (not recommended for production scale).
