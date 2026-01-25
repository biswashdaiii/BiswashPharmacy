// tests/doctor.test.js

import request from 'supertest';
import app from '../index.js';
import doctorModel from "../models/doctor_model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jest } from '@jest/globals';

describe('Doctor Controller & Routes', () => {
    const testDoctor = { _id: 'doc123', email: 'doctor@example.com', password: 'hashedpassword' };

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    // 16. Doctor login success
    test('POST /api/doctor/login - success', async () => {
        jest.spyOn(doctorModel, 'findOne').mockResolvedValue(testDoctor);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-doctor-token');
        const res = await request(app).post('/api/doctor/login').send({
            email: 'doctor@example.com',
            password: 'correctpassword'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // 17. Get doctor list success
    test('GET /api/doctor/list - success', async () => {
        jest.spyOn(doctorModel, 'find').mockReturnValue({ select: jest.fn().mockResolvedValue([testDoctor]) });
        const res = await request(app).get('/api/doctor/list');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
    
    // 19. Doctor list returns an array
    test('GET /api/doctor/list - returns an array of doctors', async () => {
        jest.spyOn(doctorModel, 'find').mockReturnValue({ select: jest.fn().mockResolvedValue([testDoctor]) });
        const res = await request(app).get('/api/doctor/list');
        expect(Array.isArray(res.body.doctors)).toBe(true);
    });

    // 20. Doctor login returns a token
    test('POST /api/doctor/login - returns a token on success', async () => {
        jest.spyOn(doctorModel, 'findOne').mockResolvedValue(testDoctor);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('a-valid-token');
        const res = await request(app).post('/api/doctor/login').send({
            email: 'doctor@example.com',
            password: 'correctpassword'
        });
        expect(res.body).toHaveProperty('token');
    });

    // 21. Get empty list of doctors
    test('GET /api/doctor/list - success with no doctors', async () => {
        jest.spyOn(doctorModel, 'find').mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
        const res = await request(app).get('/api/doctor/list');
        expect(res.body.doctors).toEqual([]);
    });

    // 23. Doctor login with different valid credentials
    test('POST /api/doctor/login - success with another doctor', async () => {
        const anotherDoctor = { _id: 'doc456', email: 'anotherdoc@example.com', password: 'hashedpassword' };
        jest.spyOn(doctorModel, 'findOne').mockResolvedValue(anotherDoctor);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(jwt, 'sign').mockReturnValue('another-token');
        const res = await request(app).post('/api/doctor/login').send({
            email: 'anotherdoc@example.com',
            password: 'anotherpassword'
        });
        expect(res.statusCode).toBe(200);
    });

    // 24. List doctors returns specific data fields
    test('GET /api/doctor/list - returns doctors with specific fields', async () => {
        jest.spyOn(doctorModel, 'find').mockReturnValue({ select: jest.fn().mockResolvedValue([{ name: 'Dr. House', speciality: 'Diagnostician' }]) });
        const res = await request(app).get('/api/doctor/list');
        expect(res.body.doctors[0]).toHaveProperty('name');
        expect(res.body.doctors[0]).toHaveProperty('speciality');
    });
});