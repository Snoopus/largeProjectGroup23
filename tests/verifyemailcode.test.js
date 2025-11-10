const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
const TEST_EMAIL = 'jest.verify.code@test.com';
let storedCode;

beforeAll(async () => {
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert a code manually similar to sendEmailCode route logic
  storedCode = Math.floor(100000 + Math.random() * 900000).toString();
  await db.collection('emailCodes').insertOne({ email: TEST_EMAIL, code: storedCode, createdAt: new Date() });
});

afterAll(async () => {
  await db.collection('emailCodes').deleteMany({ email: TEST_EMAIL });
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('verifyEmailCode with missing email returns 400', async () => {
  const response = await request(app)
    .post('/api/verifyEmailCode')
    .send({ verificationCode: storedCode });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('verifyEmailCode with missing verificationCode returns 400', async () => {
  const response = await request(app)
    .post('/api/verifyEmailCode')
    .send({ email: TEST_EMAIL });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('verifyEmailCode with wrong code returns 400', async () => {
  const response = await request(app)
    .post('/api/verifyEmailCode')
    .send({ email: TEST_EMAIL, verificationCode: '111111' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or expired code');
});

test('verifyEmailCode with valid code returns 200 and deletes record', async () => {
  const response = await request(app)
    .post('/api/verifyEmailCode')
    .send({ email: TEST_EMAIL, verificationCode: storedCode });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');

  const record = await db.collection('emailCodes').findOne({ email: TEST_EMAIL, code: storedCode });
  expect(record).toBeNull();
});
