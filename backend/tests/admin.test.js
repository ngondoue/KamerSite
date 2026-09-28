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
test('admin routes reject a regular user (403, not 401)', async () => {
await User.create({ name: 'Regular', email: 'regular@test.com', password: 'password123' });
const login = await request(BASE_URL).post('/api/auth/login').send({ email: 'regular@test.com', password: 'password123' });

const res = await request(BASE_URL).get('/api/admin/dashboard').set('Authorization', `Bearer ${login.body.token}`);
expect(res.status).toBe(403);
});
test('admin routes accept an actual admin', async () => {
const token = await adminToken();
const res = await request(BASE_URL).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
expect(res.status).toBe(200);
expect(res.body).toHaveProperty('totalPlaces');
});
test('dashboard counts reflect the real database', async () => {
const token = await adminToken();

const category = await Category.create({ name: 'Parks' });
await Place.create([
{ name: 'Published', description: 'x', category: category._id, location: 'x', status: 'published' },
{ name: 'Draft', description: 'x', category: category._id, location: 'x', status: 'draft' },
]);

const res = await request(BASE_URL).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
expect(res.body.totalPlaces).toBe(2);
expect(res.body.publishedPlaces).toBe(1);
expect(res.body.draftPlaces).toBe(1);
});
test('GET /api/admin/places shows drafts too (unlike the public endpoint)', async () => {
const token = await adminToken();

const category = await Category.create({ name: 'Parks' });
await Place.create({ name: 'Draft Place', description: 'x', category: category._id, location: 'x', status: 'draft' });
const res = await request(BASE_URL).get('/api/admin/places').set('Authorization', `Bearer ${token}`);
expect(res.body).toHaveLength(1);
expect(res.body[0].name).toBe('Draft Place');
});
});