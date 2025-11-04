const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
let jestTeacherId;

// Test teacher data
const jestTeacher = {
  login: 'jestteacher@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher',
  UserID: 99992,
  Role: 'teacher',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert test teacher
  const teacherResult = await db.collection('Users').insertOne(jestTeacher);
  jestTeacherId = teacherResult.insertedId;
});

afterAll(async () => {
  // Clean up test data - only delete specific test user and classes with specific instructor
  await db.collection('Users').deleteMany({ 
    UserID: jestTeacher.UserID
  });
  await db.collection('Classes').deleteMany({ 
    instructorId: jestTeacher.UserID
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('createclass with missing name returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'JEST101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with empty section returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Computer Science 101',
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: '',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'JEST101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with null duration returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Computer Science 101',
      duration: null,
      instructorId: jestTeacher.UserID,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'JEST101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with missing classCode returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Computer Science 101',
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with nonexistent instructor returns 404', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Computer Science 101',
      duration: 60,
      instructorId: 99999,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'CS101'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Instructor not found');
});

test('createclass with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Test Class',
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'JEST101'
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.classId).toBeDefined();
});

test('createclass with duplicate class code and section returns 400', async () => {
  // First, create a class
  await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Duplicate Test',
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: 'B',
      daysOffered: ['Tuesday', 'Thursday'],
      startTime: '10:00',
      endTime: '11:00',
      classCode: 'JEST102'
    });

  // Try to create the same class again
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Jest Duplicate Test 2',
      duration: 60,
      instructorId: jestTeacher.UserID,
      section: 'B',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'JEST102'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Class with this code and section already exists');
});
