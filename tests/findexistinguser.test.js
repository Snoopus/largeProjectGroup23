const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
const EXISTING_EMAIL = 'jest.existing.user@test.com';
const NON_EXISTING_EMAIL = 'jest.non.existing.user@test.com';

beforeAll(async () => {
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert a user to verify existence
  await db.collection('Users').insertOne({
    login: EXISTING_EMAIL,
    password: 'Password123',
    FirstName: 'Exist',
    LastName: 'User',
    UserID: 99970,
    Role: 'student',
    classList: []
  });
});

afterAll(async () => {
  await db.collection('Users').deleteMany({ login: EXISTING_EMAIL });
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('findExistingUser with missing email returns 400', async () => {
  const response = await request(app)
    .post('/api/findExistingUser')
    .send({});

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('findExistingUser with invalid email format returns 400', async () => {
  const response = await request(app)
    .post('/api/findExistingUser')
    .send({ email: 'not-an-email' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid email format');
});

test('findExistingUser with non-existing email returns 404', async () => {
  const response = await request(app)
    .post('/api/findExistingUser')
    .send({ email: NON_EXISTING_EMAIL });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('User not found');
});

test('findExistingUser with existing email returns 200', async () => {
  const response = await request(app)
    .post('/api/findExistingUser')
    .send({ email: EXISTING_EMAIL });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});
