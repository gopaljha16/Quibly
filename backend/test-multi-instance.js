#!/usr/bin/env node

/**
 * Multi-Instance Load Testing Script
 * 
 * This script simulates the cross-instance communication failure by:
 * 1. Connecting multiple clients to different backend instances
 * 2. Sending messages and tracking which clients receive them
 * 3. Demonstrating the WebSocket broadcast isolation issue
 * 
 * Usage:
 *   1. Start instance 1: INSTANCE_ID=Instance-1 PORT=5000 node src/index.js
 *   2. Start instance 2: INSTANCE_ID=Instance-2 PORT=5001 node src/index.js
 *   3. Run this script: node test-multi-instance.js
 */

const io = require('socket.io-client');

// Configuration
const INSTANCE_1_URL = 'http://localhost:5000';
const INSTANCE_2_URL = 'http://localhost:5001';
const TEST_CHANNEL_ID = 'test-channel-123';

// Replace with a valid JWT token from your system
const AUTH_TOKEN = process.env.TEST_TOKEN || 'YOUR_JWT_TOKEN_HERE';

console.log('🧪 Multi-Instance Load Test\n');
console.log('This test demonstrates the WebSocket broadcast isolation issue:');
console.log('- Client A connects to Instance 1');
console.log('- Client B connects to Instance 2');
console.log('- Client A sends a message');
console.log('- Expected: Both clients receive the message');
console.log('- Actual: Only Client A receives it (Instance 1 isolation)\n');
console.log('='.repeat(60));

// Create clients
const clientA = io(INSTANCE_1_URL, {
    auth: { token: AUTH_TOKEN },
    transports: ['websocket']
});

const clientB = io(INSTANCE_2_URL, {
    auth: { token: AUTH_TOKEN },
    transports: ['websocket']
});

let receivedByA = false;
let receivedByB = false;

// Client A (connected to Instance 1)
clientA.on('connect', () => {
    console.log('✅ Client A connected to Instance 1 (port 5000)');
    clientA.emit('join_channel', TEST_CHANNEL_ID);
});

clientA.on('receive_message', (msg) => {
    receivedByA = true;
    console.log('📨 Client A RECEIVED message:', msg.content);
});

clientA.on('error', (err) => {
    console.error('❌ Client A error:', err);
});

// Client B (connected to Instance 2)
clientB.on('connect', () => {
    console.log('✅ Client B connected to Instance 2 (port 5001)');
    clientB.emit('join_channel', TEST_CHANNEL_ID);

    // Wait a bit for join to complete, then send message from Client A
    setTimeout(() => {
        console.log('\n📤 Client A sending message...\n');
        clientA.emit('send_message', {
            channelId: TEST_CHANNEL_ID,
            content: 'Test message from Client A',
            tempId: 'test-123'
        });

        // Check results after 2 seconds
        setTimeout(() => {
            console.log('\n' + '='.repeat(60));
            console.log('📊 RESULTS:');
            console.log(`   Client A (Instance 1): ${receivedByA ? '✅ Received' : '❌ Did NOT receive'}`);
            console.log(`   Client B (Instance 2): ${receivedByB ? '✅ Received' : '❌ Did NOT receive'}`);
            console.log('='.repeat(60));

            if (!receivedByB) {
                console.log('\n🔴 CROSS-INSTANCE BROADCAST FAILURE CONFIRMED');
                console.log('   The message was only broadcast to clients on Instance 1.');
                console.log('   Clients on Instance 2 did not receive it.');
                console.log('\n   This proves the audit finding: global.io only broadcasts');
                console.log('   to the local Socket.IO instance, not across instances.');
            } else {
                console.log('\n✅ Cross-instance broadcasting works!');
                console.log('   (You likely have Socket.IO Redis adapter installed)');
            }

            console.log('\n💡 To fix: Install Socket.IO Redis adapter');
            console.log('   npm install @socket.io/redis-adapter');

            process.exit(receivedByB ? 0 : 1);
        }, 2000);
    }, 1000);
});

clientB.on('receive_message', (msg) => {
    receivedByB = true;
    console.log('📨 Client B RECEIVED message:', msg.content);
});

clientB.on('error', (err) => {
    console.error('❌ Client B error:', err);
});

// Timeout handler
setTimeout(() => {
    console.error('\n⏱️  Test timeout - shutting down');
    process.exit(1);
}, 10000);
