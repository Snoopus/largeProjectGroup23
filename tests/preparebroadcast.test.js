const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestTeacher = {
  login: 'jestteacher6@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher6',
  UserID: 99998,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Broadcast Class',
  classCode: 'JEST601',
  section: 'A',
  daysOffered: ['Tuesday', 'Thursday'],
  startTime: '15:00',
  endTime: '16:00',
  duration: 60,
  instructorId: 99998,
  instructorName: 'Jest Teacher6',
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

  // Insert test data
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  
  jestTeacher.classList = [jestClassId];
  await db.collection('Users').insertOne(jestTeacher);
});

afterAll(async () => {
  // Clean up test data - only delete specific test user, classes, and any attendance records created
  await db.collection('Users').deleteMany({ 
    UserID: jestTeacher.UserID
  });
  await db.collection('Classes').deleteMany({ 
    instructorId: jestTeacher.UserID
  });
  // Clean up any Records created during preparebroadcast test
  await db.collection('Records').deleteMany({
    classId: jestClassId
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('preparebroadcast with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('preparebroadcast with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: '',
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('preparebroadcast with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: 12345
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('preparebroadcast with null objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: 12345,
      objectId: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('preparebroadcast with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: 12345,
      objectId: 'invalid-id-format'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('preparebroadcast with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('preparebroadcast with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/preparebroadcast')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});
