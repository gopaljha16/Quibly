// Simple API test script
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🧪 Testing Discord Backend API...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health:', health.data);

        // Test user registration
        console.log('\n2. Testing user registration...');
        const registerData = {
            username: 'testuser' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        };

        try {
            const register = await axios.post(`${API_BASE}/auth/register`, registerData);
            console.log('✅ Registration successful:', {
                success: register.data.success,
                message: register.data.message,
                userId: register.data.user?.id
            });
        } catch (regError) {
            console.log('❌ Registration error:', regError.response?.data || regError.message);
        }

        // Test user count
        console.log('\n3. Testing user count...');
        try {
            const userCount = await axios.get(`${API_BASE}/users/count`);
            console.log('✅ User count:', userCount.data);
        } catch (countError) {
            console.log('❌ User count error:', countError.response?.data || countError.message);
        }

        console.log('\n🎉 API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPI();