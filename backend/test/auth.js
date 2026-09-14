import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';

describe('Auth (api/auth.js)', () => {
  const validUser = { name: 'Test User', email: 'test@example.com', password: 'password123' };
  //registration tests
  test('register creates a user and returns a token', async () => {
    const res = await request(BASE_URL).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined();
  });
    // password hashing test
    test('register hashes the password', async () => {
    await request(BASE_URL).post('/api/auth/register').send(validUser);
    const stored = await User.findOne({ email: validUser.email }).select('+password');
    expect(stored.password).not.toBe(validUser.password);
  });
   //Duplicate email test
  test('register rejects a duplicate email', async () => {
    await request(BASE_URL).post('/api/auth/register').send(validUser);
    const res = await request(BASE_URL).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });
  
});
