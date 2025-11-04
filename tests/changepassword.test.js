const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;

// Test user data
const jestUser = {
  login: 'jestchangepass@test.com',
  password: 'OriginalPassword123',
  FirstName: 'Jest',
  LastName: 'ChangePass',
  UserID: 99950,
  Role: 'student',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert test user for password change tests
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

test('changepassword with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      newPassword: 'NewPassword123' 
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: '',
      newPassword: 'NewPassword123' 
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with null userId returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: null,
      newPassword: 'NewPassword123' 
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with missing newPassword returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: jestUser.UserID
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with empty newPassword returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: jestUser.UserID,
      newPassword: '' 
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with null newPassword returns 400', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: jestUser.UserID,
      newPassword: null 
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('changepassword with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/changepassword')
    .send({ 
      userId: jestUser.UserID,
      newPassword: 'UpdatedPassword456' 
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});
