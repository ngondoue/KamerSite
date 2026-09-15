import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Place from '../models/Place.js';

async function adminToken() {
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
  const res = await request(BASE_URL).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
  return res.body.token;
}

describe('Categories (api/categories.js)', () => {
  test('GET /api/categories only returns active categories', async () => {
    await Category.create([{ name: 'Active', status: 'active' }, { name: 'Inactive', status: 'inactive' }]);
    const res = await request(BASE_URL).get('/api/categories');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Active');
  });

  test('POST /api/categories requires admin', async () => {
    const res = await request(BASE_URL).post('/api/categories').send({ name: 'Nature' });
    expect(res.status).toBe(401);
  });

  test('POST /api/categories creates a category (admin)', async () => {
    const token = await adminToken();
    const res = await request(BASE_URL)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nature', description: 'Natural sites' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Nature');
  });

  test('DELETE /api/categories/:id succeeds when no places depend on it', async () => {
    const token = await adminToken();
    const category = await Category.create({ name: 'Unused Category' });

    const res = await request(BASE_URL)
      .delete(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
