import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Place from '../models/Place.js';
import Review from '../models/Reviews.js';

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
test('GET /api/admin/places/:id returns one place regardless of status', async () => {
const token = await adminToken();
const category = await Category.create({ name: 'Museums' });
const place = await Place.create({ name: 'Draft Museum', description: 'x', category: category._id, location: 'x', status: 'draft' });

const res = await request(BASE_URL).get(`/api/admin/places/${place._id}`).set('Authorization', `Bearer ${token}`);
expect(res.status).toBe(200);
expect(res.body.name).toBe('Draft Museum');
});
test('GET /api/admin/categories shows inactive categories too', async () => {
const token = await adminToken();
await Category.create({ name: 'Inactive Category', status: 'inactive' });

const res = await request(BASE_URL).get('/api/admin/categories').set('Authorization', `Bearer ${token}`);
expect(res.body.some((c) => c.name === 'Inactive Category')).toBe(true);
});
test('GET /api/admin/reviews shows pending reviews', async () => {
const token = await adminToken();
const category = await Category.create({ name: 'Restaurants' });
const place = await Place.create({ name: 'A Place', description: 'x', category: category._id, location: 'x', status: 'published' });
const user = await User.create({ name: 'Reviewer', email: 'reviewer@test.com', password: 'password123' });
await Review.create({ user: user._id, place: place._id, rating: 5, status: 'pending' });

const res = await request(BASE_URL).get('/api/admin/reviews').set('Authorization', `Bearer ${token}`);
expect(res.status).toBe(200);
expect(res.body).toHaveLength(1);
expect(res.body[0].status).toBe('pending');
});
test('GET /api/admin/users lists users', async () => {
const token = await adminToken();
await User.create({ name: 'Someone', email: 'someone@test.com', password: 'password123' });

const res = await request(BASE_URL).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
expect(res.status).toBe(200);
expect(res.body.length).toBeGreaterThanOrEqual(2); // the admin + "Someone"
});
test('a user cannot promote themselves to admin', async () => {
const user = await User.create({ name: 'Sneaky', email: 'sneaky@test.com', password: 'password123' });
const login = await request(BASE_URL).post('/api/auth/login').send({ email: 'sneaky@test.com', password: 'password123' });
const res = await request(BASE_URL)
.patch(`/api/admin/users/${user._id}/role`)
.set('Authorization', `Bearer ${login.body.token}`)
.send({ role: 'admin' });
expect(res.status).toBe(403);
});
test('an admin can promote a regular user', async () => {
const token = await adminToken();
const regularUser = await User.create({ name: 'Regular', email: 'regular2@test.com', password: 'password123' });
const res = await request(BASE_URL)
.patch(`/api/admin/users/${regularUser._id}/role`)
.set('Authorization', `Bearer ${token}`)
.send({ role: 'admin' });
expect(res.status).toBe(200);
expect(res.body.role).toBe('admin');
});
test('an admin can demote another admin back to a regular user', async () => {
const token = await adminToken();
const otherAdmin = await User.create({ name: 'Other Admin', email: 'other-admin@test.com', password: 'password123', role: 'admin' });

const res = await request(BASE_URL)
.patch(`/api/admin/users/${otherAdmin._id}/role`)
.set('Authorization', `Bearer ${token}`)
.send({ role: 'user' });

expect(res.status).toBe(200);
expect(res.body.role).toBe('user');
});
test('an admin cannot remove their own admin access', async () => {
const admin = await User.create({ name: 'Admin', email: 'self-admin@test.com', password: 'password123', role: 'admin' });
const login = await request(BASE_URL).post('/api/auth/login').send({ email: 'self-admin@test.com', password: 'password123' });

const res = await request(BASE_URL)
.patch(`/api/admin/users/${admin._id}/role`)
.set('Authorization', `Bearer ${login.body.token}`)
.send({ role: 'user' });

expect(res.status).toBe(400);
});
test('an invalid role is rejected', async () => {
const token = await adminToken();
const regularUser = await User.create({ name: 'Regular', email: 'regular3@test.com', password: 'password123' });

const res = await request(BASE_URL)
.patch(`/api/admin/users/${regularUser._id}/role`)
.set('Authorization', `Bearer ${token}`)
.send({ role: 'superuser' });

expect(res.status).toBe(400);
});
test('a nonexistent user returns 404', async () => {
const token = await adminToken();

const res = await request(BASE_URL)
.patch('/api/admin/users/000000000000000000000000/role')
.set('Authorization', `Bearer ${token}`)
.send({ role: 'admin' });

expect(res.status).toBe(404);
});
});