const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
const TEST_EMAIL = 'jest.email.code@test.com';

beforeAll(async () => {
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');
});

afterAll(async () => {
  // Cleanup any codes created for the test email
  await db.collection('emailCodes').deleteMany({ email: TEST_EMAIL });
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('sendEmailCode with missing email returns 400', async () => {
  const response = await request(app)
    .post('/api/sendEmailCode')
    .send({ templateChoice: 'registration' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('sendEmailCode with invalid email format returns 400', async () => {
  const response = await request(app)
    .post('/api/sendEmailCode')
    .send({ email: 'not-an-email', templateChoice: 'registration' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid email format');
});

test('sendEmailCode with missing templateChoice returns 400', async () => {
  const response = await request(app)
    .post('/api/sendEmailCode')
    .send({ email: TEST_EMAIL });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('sendEmailCode with valid data returns 200 and stores code', async () => {
  const response = await request(app)
    .post('/api/sendEmailCode')
    .send({ email: TEST_EMAIL, templateChoice: 'registration' });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');

  const record = await db.collection('emailCodes').findOne({ email: TEST_EMAIL });
  expect(record).toBeTruthy();
  expect(typeof record.code).toBe('string');
  expect(record.code).toMatch(/^\d{6}$/);
  expect(record.createdAt instanceof Date).toBe(true);
});
