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
  test('a pending review does not show publicly or affect the rating', async () => {
    await request(BASE_URL)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ place: place._id, rating: 5 });

    const reviews = await request(BASE_URL).get(`/api/reviews/place/${place._id}`);
    expect(reviews.body).toHaveLength(0);

    const placeRes = await request(BASE_URL).get(`/api/places/${place._id}`);
    expect(placeRes.body.rating).toBe(0);
  });

 test('an admin approving a review (PUT) makes it public and updates the rating', async () => {
    await request(BASE_URL)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ place: place._id, rating: 4 });

    const review = await Review.findOne({ place: place._id });

    const putRes = await request(BASE_URL)
      .put(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(putRes.status).toBe(200);

    const reviews = await request(BASE_URL).get(`/api/reviews/place/${place._id}`);
    expect(reviews.body).toHaveLength(1);

    const placeRes = await request(BASE_URL).get(`/api/places/${place._id}`);
    expect(placeRes.body.rating).toBe(4);
  });
  test('a regular user cannot moderate a review (PUT requires admin)', async () => {
    await request(BASE_URL).post('/api/reviews').set('Authorization', `Bearer ${userToken}`).send({ place: place._id, rating: 3 });
    const review = await Review.findOne({ place: place._id });

    const res = await request(BASE_URL)
      .put(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
  });
  test('a rejected review does not count toward the rating', async () => {
    await request(BASE_URL).post('/api/reviews').set('Authorization', `Bearer ${userToken}`).send({ place: place._id, rating: 1 });
    const review = await Review.findOne({ place: place._id });

    await request(BASE_URL)
      .put(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    const placeRes = await request(BASE_URL).get(`/api/places/${place._id}`);
    expect(placeRes.body.rating).toBe(0);
  });
test('a user can only review a place once', async () => {
    await request(BASE_URL).post('/api/reviews').set('Authorization', `Bearer ${userToken}`).send({ place: place._id, rating: 5 });
    const res = await request(BASE_URL).post('/api/reviews').set('Authorization', `Bearer ${userToken}`).send({ place: place._id, rating: 3 });
    expect(res.status).toBe(409);
  });

});
