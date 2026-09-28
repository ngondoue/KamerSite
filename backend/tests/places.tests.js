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

describe('Places (api/places.js)', () => {
  let category;

  beforeEach(async () => {
    category = await Category.create({ name: 'Restaurants', icon: 'restaurant' });
  });

  test('GET /api/places only returns published places', async () => {
    await Place.create([
      { name: 'Published', description: 'x', category: category._id, location: 'Yaoundé', status: 'published' },
      { name: 'Draft', description: 'x', category: category._id, location: 'Yaoundé', status: 'draft' },
    ]);

    const res = await request(BASE_URL).get('/api/places');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Published');
  });

  test('search and filters combine in one query', async () => {
    await Place.create([
      { name: 'Great Waterfall', description: 'x', category: category._id, location: 'x', status: 'published', rating: 4.5 },
      { name: 'Great Waterfall Low Rated', description: 'x', category: category._id, location: 'x', status: 'published', rating: 2 },
    ]);

    const res = await request(BASE_URL).get(`/api/places?search=Great&category=${category._id}&rating=4`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Great Waterfall');
  });

  test('GET /api/places/:id accepts a slug', async () => {
    const place = await Place.create({ name: 'Slug Test', description: 'x', category: category._id, location: 'x', status: 'published' });
    const res = await request(BASE_URL).get(`/api/places/${place.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Slug Test');
  });

  test('an invalid/non-existent place returns 404', async () => {
    const res = await request(BASE_URL).get('/api/places/000000000000000000000000');
    expect(res.status).toBe(404);
  });

  test('GET /api/places/:id/nearby returns closer places first', async () => {
    const center = await Place.create({
      name: 'Center', description: 'x', category: category._id, location: 'x', status: 'published',
      coordinates: { lat: 3.87, lng: 11.52 },
    });
    await Place.create({
      name: 'Near', description: 'x', category: category._id, location: 'x', status: 'published',
      coordinates: { lat: 3.871, lng: 11.521 }, // ~150m away
    });
    await Place.create({
      name: 'Far', description: 'x', category: category._id, location: 'x', status: 'published',
      coordinates: { lat: 4.5, lng: 12.5 },
    });
    await Place.create({
      name: 'No Coordinates', description: 'x', category: category._id, location: 'x', status: 'published',
    });

    const res = await request(BASE_URL).get(`/api/places/${center._id}/nearby`);
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Near');
    expect(res.body.map((p) => p.name)).not.toContain('No Coordinates');
  });

  test('POST /api/places (admin) ignores client-supplied rating/reviewCount', async () => {
    const token = await adminToken();
    const res = await request(BASE_URL)
      .post('/api/places')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Faked', description: 'x', category: category._id, location: 'x',
        rating: 4.9, reviewCount: 999,
      });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(0);
    expect(res.body.verification.verified).toBe(false);
  });

  test('non-admin cannot create a place', async () => {
    await User.create({ name: 'User', email: 'user@test.com', password: 'password123' });
    const login = await request(BASE_URL).post('/api/auth/login').send({ email: 'user@test.com', password: 'password123' });

    const res = await request(BASE_URL)
      .post('/api/places')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ name: 'x', description: 'x', category: category._id, location: 'x' });

    expect(res.status).toBe(403);
  });

  test('PUT /api/places/:id with verified:true records who verified it, ignoring a client-supplied verifiedBy', async () => {
    const token = await adminToken();
    const place = await Place.create({ name: 'Unverified', description: 'x', category: category._id, location: 'x' });

    const res = await request(BASE_URL)
      .put(`/api/places/${place._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ verified: true, verifiedBy: 'someone-else-fake-id' });

    expect(res.status).toBe(200);
    expect(res.body.verification.verified).toBe(true);
    expect(res.body.verification.verifiedBy).not.toBe('someone-else-fake-id');
  });

  test('DELETE /api/places/:id (admin only)', async () => {
    const token = await adminToken();
    const place = await Place.create({ name: 'To Delete', description: 'x', category: category._id, location: 'x' });

    const res = await request(BASE_URL).delete(`/api/places/${place._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(await Place.findById(place._id)).toBeNull();
  });
});
