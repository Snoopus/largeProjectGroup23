const request = require('supertest');
const app = require('../server');

test('register with missing email returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      password: 'testpass',
      firstName: 'John',
      lastName: 'Doe',
      id: 12345,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('register with empty password returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'test@example.com',
      password: '',
      firstName: 'John',
      lastName: 'Doe',
      id: 12345,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('register with missing firstName returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      lastName: 'Doe',
      id: 12345,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('register with null id returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      firstName: 'John',
      lastName: 'Doe',
      id: null,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('register with empty role returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      firstName: 'John',
      lastName: 'Doe',
      id: 12345,
      role: ''
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

// Close MongoDB connection after all tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
