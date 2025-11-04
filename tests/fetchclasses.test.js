const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestTeacher = {
  login: 'jestteacher3@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher3',
  UserID: 99995,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Fetch Class',
  classCode: 'JEST301',
  section: 'A',
  daysOffered: ['Tuesday', 'Thursday'],
  startTime: '14:00',
  endTime: '15:00',
  duration: 60,
  instructorId: 99995,
  instructorName: 'Jest Teacher3',
  studentList: [],
  currentAttendance: null,
  secret: null
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert test teacher with class
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  
  jestTeacher.classList = [jestClassId];
  await db.collection('Users').insertOne(jestTeacher);
});

afterAll(async () => {
  // Clean up test data - only delete specific test user and classes
  await db.collection('Users').deleteMany({ 
    UserID: jestTeacher.UserID
  });
  await db.collection('Classes').deleteMany({ 
    instructorId: jestTeacher.UserID
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

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

test('fetchclasses with valid userId returns 200', async () => {
  const response = await request(app)
    .post('/api/fetchclasses')
    .send({ userId: jestTeacher.UserID });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.classes).toBeDefined();
  expect(Array.isArray(response.body.classes)).toBe(true);
});
