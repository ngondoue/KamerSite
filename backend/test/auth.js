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

  
});
