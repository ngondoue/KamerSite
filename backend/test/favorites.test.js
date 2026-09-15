import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Place from '../models/Place.js';

describe('Favorites (api/favorites.js)', () => {
  let token, place;

  beforeEach(async () => {
    await User.create({ name: 'User', email: 'user@test.com', password: 'password123' });
    const login = await request(BASE_URL).post('/api/auth/login').send({ email: 'user@test.com', password: 'password123' });
    token = login.body.token;

    const category = await Category.create({ name: 'Parks' });
    place = await Place.create({ name: 'Test Park', description: 'x', category: category._id, location: 'x', status: 'published' });
  });
  test('requires authentication', async () => {
    const res = await request(BASE_URL).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  test('can add and list a favorite', async () => {
    const addRes = await request(BASE_URL)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ placeId: place._id });
    expect(addRes.status).toBe(201);

    const res = await request(BASE_URL).get('/api/favorites').set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);
  });

  
