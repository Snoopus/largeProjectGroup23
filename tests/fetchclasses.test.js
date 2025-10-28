const request = require('supertest');
const app = require('../server');

test('fetchclasses with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchclasses')
    .send({});

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
  expect(response.body.classes).toEqual([]);
});

test('fetchclasses with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchclasses')
    .send({ userId: '' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
  expect(response.body.classes).toEqual([]);
});

test('fetchclasses with null userId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchclasses')
    .send({ userId: null });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
  expect(response.body.classes).toEqual([]);
});

test('fetchclasses with nonexistent userId returns 404', async () => {
  const response = await request(app)
    .post('/api/fetchclasses')
    .send({ userId: 99999 });

  expect(response.status).toBe(404);
  expect(response.body.error).toContain('User not found');
  expect(response.body.classes).toEqual([]);
});

// Close MongoDB connection after all tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
