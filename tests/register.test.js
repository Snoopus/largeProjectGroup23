const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');
});

afterAll(async () => {
  // Clean up any test users created during registration tests - only delete specific UserID
  await db.collection('Users').deleteMany({ 
    UserID: 99991
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

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

test('register with invalid email format returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'invalid-email',
      password: 'testpass',
      firstName: 'John',
      lastName: 'Doe',
      id: 12345,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid email format');
});

test('register with invalid role returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      firstName: 'John',
      lastName: 'Doe',
      id: 12345,
      role: 'administrator'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid role. Must be student or teacher');
});

test('register with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'jestregister@test.com',
      password: 'JestPass123',
      firstName: 'JestReg',
      lastName: 'User',
      id: 99991,
      role: 'student'
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});

test('register with duplicate email returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'jestregister@test.com',
      password: 'DifferentPass123',
      firstName: 'Different',
      lastName: 'User',
      id: 99992,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Email already exists');
});

test('register with duplicate UserID returns 400', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({
      email: 'differentemail@test.com',
      password: 'JestPass123',
      firstName: 'JestReg',
      lastName: 'User',
      id: 99991,
      role: 'student'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('User ID already exists');
});
