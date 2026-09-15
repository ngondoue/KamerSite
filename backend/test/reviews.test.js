import request from 'supertest';
import { BASE_URL } from './setup.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Place from '../models/Place.js';
import Review from '../models/Review.js';

describe('Reviews (api/reviews.js)', () => {
  let userToken, adminToken, place;

  beforeEach(async () => {
    await User.create({ name: 'User', email: 'user@test.com', password: 'password123' });
    const userLogin = await request(BASE_URL).post('/api/auth/login').send({ email: 'user@test.com', password: 'password123' });
    userToken = userLogin.body.token;

    await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
    const adminLogin = await request(BASE_URL).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const category = await Category.create({ name: 'Restaurants' });
    place = await Place.create({ name: 'Reviewed Place', description: 'x', category: category._id, location: 'x', status: 'published' });
  });
test('a new review defaults to "pending"', async () => {
    await request(BASE_URL)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ place: place._id, rating: 5, comment: 'Great!' });

    const stored = await Review.findOne({ place: place._id });
    expect(stored.status).toBe('pending');
  });
});