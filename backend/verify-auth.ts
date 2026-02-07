
import axios from 'axios';
import mongoose from 'mongoose';

const API_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        console.log("Waiting for server...");
        await new Promise(r => setTimeout(r, 2000));

        // 1. Signup
        console.log('1. Testing Signup...');
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';

        let token = '';
        try {
            const signupRes = await axios.post(`${API_URL}/auth/signup`, { email, password });
            console.log('Signup Successful:', signupRes.data.email);
            token = signupRes.data.token;
        } catch (e: any) {
            console.error('Signup Failed:', JSON.stringify(e.response?.data || e.message, null, 2));
            return;
        }

        // 2. Create Task (Protected)
        console.log('2. Testing Create Task (Protected)...');
        let taskId = '';
        try {
            const taskRes = await axios.post(`${API_URL}/tasks`, { taskPrompt: 'Auth test task' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Task Created:', taskRes.data);
            taskId = taskRes.data.taskId;
        } catch (e: any) {
            console.error('Create Task Failed:', e.response?.data || e.message);
            return;
        }

        // 3. Verify List Tasks
        console.log('3. Testing List Tasks...');
        try {
            const listRes = await axios.get(`${API_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`User has ${listRes.data.length} tasks.`);
            const found = listRes.data.find((t: any) => t.browserUseId === taskId);
            if (found) {
                console.log('Task found in DB list.');
            } else {
                console.error('Task NOT found in DB list.');
            }
        } catch (e: any) {
            console.error('List Tasks Failed:', e.response?.data || e.message);
        }

        console.log('Done.');

    } catch (e: any) {
        console.error('Test failed:', e.message);
    }
}

testAuth();
