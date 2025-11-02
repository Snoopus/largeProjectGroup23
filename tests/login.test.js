const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;

// Test user data
const jestUser = {
  login: 'jestlogin@test.com',
  password: 'JestPassword123',
  FirstName: 'Jest',
  LastName: 'LoginUser',
  UserID: 99990,
  Role: 'student',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert test user for successful login test
  await db.collection('Users').insertOne(jestUser);
});

afterAll(async () => {
  // Clean up test data - only delete the specific test user created in beforeAll
  await db.collection('Users').deleteMany({ 
    UserID: jestUser.UserID
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('login with missing login returns 400', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ password: 'testpass' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

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

test('login with invalid credentials returns 401', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ login: 'wrong@example.com', password: 'wrongpass' });

  expect(response.status).toBe(401);
  expect(response.body.id).toBe(-1);
  expect(response.body.firstName).toBe('');
  expect(response.body.lastName).toBe('');
  expect(response.body.role).toBe('');
  expect(response.body.error).toBe('Invalid credentials');
});

test('login with valid credentials returns 200', async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ 
      login: jestUser.login, 
      password: jestUser.password 
    });

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(jestUser.UserID);
  expect(response.body.firstName).toBe(jestUser.FirstName);
  expect(response.body.lastName).toBe(jestUser.LastName);
  expect(response.body.role).toBe(jestUser.Role);
});
