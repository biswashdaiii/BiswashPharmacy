// tests/user.test.js

import request from "supertest";
import app from '../index.js';
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctor_model.js";
import { appointmentModel } from "../models/appointmentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jest } from '@jest/globals';

describe('User API tests', () => {
    // FIX: Add .toObject() to mock Mongoose document behavior
    const testUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        toObject: function() { return this; }
    };

    const doctorData = {
        _id: 'doc123',
        available: true,
        fee: 100,
        slots_booked: {},
        toObject: function() { return this; }
    };

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    // 1. Successful User Registration
    test('POST /api/user/register - should register a user successfully', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(userModel, 'create').mockResolvedValue(testUser);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'New User', email: 'new@example.com', password: 'password123' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    // 2. Successful User Login
    test('POST /api/user/login - should login a user successfully', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(testUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: testUser.email, password: 'password123' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    // 3. Get All Users Successfully
    test('GET /api/user/all - should get all users successfully', async () => {
        jest.spyOn(userModel, 'find').mockResolvedValue([testUser]);
        const res = await request(app).get('/api/user/all');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // 4. Book an Appointment Successfully
    test('POST /api/user/book-appointment - should book an appointment successfully', async () => {
        jest.spyOn(doctorModel, 'findById').mockReturnValue({
            select: jest.fn().mockResolvedValue(doctorData),
        });
        jest.spyOn(userModel, 'findById').mockReturnValue({
            select: jest.fn().mockResolvedValue(testUser),
        });
        jest.spyOn(appointmentModel.prototype, 'save').mockResolvedValue({});
        jest.spyOn(doctorModel, 'findByIdAndUpdate').mockResolvedValue({});
        const res = await request(app)
            .post('/api/user/book-appointment')
            .send({ userId: 'user123', docId: 'doc123', slotDate: '2025-12-25', slotTime: '10:00' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // 5. Get User Profile Successfully
    test('GET /api/user/get-profile - should get user profile with valid token', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: testUser._id }));
        jest.spyOn(userModel, 'findById').mockReturnValue({
            select: jest.fn().mockResolvedValue(testUser)
        });
        const res = await request(app)
            .get('/api/user/get-profile')
            .set('Authorization', 'Bearer fake-valid-token');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('userData');
    });

    // 6. Update User Profile Successfully
    test('PUT /api/user/update-profile - should update user profile successfully', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: testUser._id }));
        jest.spyOn(userModel, 'findByIdAndUpdate').mockReturnValue({
            select: jest.fn().mockResolvedValue({ ...testUser, name: 'Updated Name' })
        });
        const res = await request(app)
            .put('/api/user/update-profile')
            .set('Authorization', 'Bearer fake-valid-token')
            .send({ name: 'Updated Name', email: 'new@example.com', phone: '1234567890' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
    
    // 7. Register user with minimum required fields
    test('POST /api/user/register - success with minimum fields', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(userModel, 'create').mockResolvedValue(testUser);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Test', email: 'test@test.com', password: 'password' });
        expect(res.statusCode).toBe(201);
    });

    // 8. Login with case-insensitive email
    test('POST /api/user/login - success with case-insensitive email', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(testUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'Test@example.com', password: 'password123' });
        expect(res.statusCode).toBe(200);
    });

    // 9. Get empty list of users
    test('GET /api/user/all - success with empty list', async () => {
        jest.spyOn(userModel, 'find').mockResolvedValue([]);
        const res = await request(app).get('/api/user/all');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    // 10. Book appointment on a different date
    test('POST /api/user/book-appointment - success on a different date', async () => {
        jest.spyOn(doctorModel, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue(doctorData) });
        jest.spyOn(userModel, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue(testUser) });
        jest.spyOn(appointmentModel.prototype, 'save').mockResolvedValue({});
        jest.spyOn(doctorModel, 'findByIdAndUpdate').mockResolvedValue({});
        const res = await request(app)
            .post('/api/user/book-appointment')
            .send({ userId: 'user123', docId: 'doc123', slotDate: '2025-12-26', slotTime: '11:00' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // 11. Update just the user's name
    test('PUT /api/user/update-profile - success updating only name', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: testUser._id }));
        jest.spyOn(userModel, 'findByIdAndUpdate').mockReturnValue({ select: jest.fn().mockResolvedValue(testUser) });
        const res = await request(app)
            .put('/api/user/update-profile')
            .set('Authorization', 'Bearer fake-valid-token')
            .send({ name: 'Just My Name', email: testUser.email, phone: '1112223333' });
        expect(res.statusCode).toBe(200);
    });

    // 12. Update user profile with address
    test('PUT /api/user/update-profile - success with address', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: testUser._id }));
        jest.spyOn(userModel, 'findByIdAndUpdate').mockReturnValue({ select: jest.fn().mockResolvedValue(testUser) });
        const res = await request(app)
            .put('/api/user/update-profile')
            .set('Authorization', 'Bearer fake-valid-token')
            .send({ name: 'With Address', email: 'address@test.com', phone: '123', address: '123 Main St' });
        expect(res.statusCode).toBe(200);
    });

    // 13. Get profile returns correct user data
    test('GET /api/user/get-profile - returns correct user data', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: testUser._id }));
        jest.spyOn(userModel, 'findById').mockReturnValue({
            select: jest.fn().mockResolvedValue({ name: 'Specific User', email: 'specific@test.com' })
        });
        const res = await request(app)
            .get('/api/user/get-profile')
            .set('Authorization', 'Bearer fake-valid-token');
        expect(res.body.userData.name).toBe('Specific User');
    });

    // 14. Successful registration returns a user object
    test('POST /api/user/register - returns user object on success', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(userModel, 'create').mockResolvedValue(testUser);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Another User', email: 'another@example.com', password: 'password123' });
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('name');
    });

    // 15. Successful login returns a user object
    test('POST /api/user/login - returns user object on success', async () => {
        jest.spyOn(userModel, 'findOne').mockResolvedValue(testUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: testUser.email, password: 'password123' });
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('id');
    });
});