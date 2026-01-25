// tests/admin.test.js

import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import 'dotenv/config'; // Ensure .env variables are loaded

describe('Admin Controller & Routes', () => {

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    // 26. Admin login success
    test('POST /api/admin/login - success', async () => {
        jest.spyOn(jwt, 'sign').mockReturnValue('a-real-looking-token');
        const res = await request(app).post('/api/admin/login').send({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // 30. Admin login returns a token
    test('POST /api/admin/login - returns token on success', async () => {
        jest.spyOn(jwt, 'sign').mockReturnValue('a-real-looking-token');
        const res = await request(app).post('/api/admin/login').send({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        });
        expect(res.body).toHaveProperty('token');
    });

    // 35. Admin login with valid credentials has success: true
    test('POST /api/admin/login - body has success true on correct login', async () => {
        jest.spyOn(jwt, 'sign').mockReturnValue('a-real-looking-token');
        const res = await request(app).post('/api/admin/login').send({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        });
        expect(res.body.success).toBe(true);
    });
});