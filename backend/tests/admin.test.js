import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Place from '../models/Place.js';
import Review from '../models/Review.js';

async function adminToken() {
    await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
    const res = await request(BASE_URL).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    return res.body.token;
}
describe('Admin authorization + admin-only views (api/admin.js)', () => {
test('admin routes reject requests with no token (401)', async () => {
    const res = await request(BASE_URL).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
});
});