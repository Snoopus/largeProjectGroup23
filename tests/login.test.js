const request = require('supertest');
const app = require('../server');

test('login with missing password returns 400', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ login: 'test@example.com' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('login with empty password returns 400', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ login: 'test@example.com', password: '' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('login with invalid credentials returns empty user data', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ login: 'wrong@example.com', password: 'wrongpass' });

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(-1);
  expect(response.body.firstName).toBe('');
  expect(response.body.lastName).toBe('');
  expect(response.body.role).toBe('');
  expect(response.body.error).toBe('');
});

// Close MongoDB connection after all tests
afterAll(async () => {
  const { MongoClient } = require('mongodb');
  // Give a moment for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
});
