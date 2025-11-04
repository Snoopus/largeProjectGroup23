const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestTeacher = {
  login: 'jestteacher4@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher4',
  UserID: 99996,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Secret Class',
  classCode: 'JEST401',
  section: 'A',
  daysOffered: ['Monday', 'Wednesday'],
  startTime: '11:00',
  endTime: '12:00',
  duration: 60,
  instructorId: 99996,
  instructorName: 'Jest Teacher4',
  studentList: [],
  currentAttendance: null,
  secret: 'JEST-SECRET-123'
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

test('removesecret with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('removesecret with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: '',
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('removesecret with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: 12345
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('removesecret with null objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: 12345,
      objectId: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('removesecret with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: 12345,
      objectId: 'invalid-id-format'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('removesecret with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('removesecret with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});

test('removesecret with non-instructor user returns 403', async () => {
  // First set a secret again
  await db.collection('Classes').updateOne(
    { _id: jestClassId },
    { $set: { secret: 'JEST-SECRET-456' } }
  );

  // Create a different teacher
  const otherTeacher = {
    login: 'otherteacher3@test.com',
    password: 'OtherTeacherPass123',
    FirstName: 'Other',
    LastName: 'Teacher3',
    UserID: 99984,
    Role: 'teacher',
    classList: []
  };
  
  await db.collection('Users').insertOne(otherTeacher);

  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: otherTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe('Only the instructor can perform this action');

  // Cleanup - remove secret and user
  await db.collection('Classes').updateOne(
    { _id: jestClassId },
    { $set: { secret: null } }
  );
  await db.collection('Users').deleteOne({ UserID: otherTeacher.UserID });
});

test('removesecret when no active secret returns 400', async () => {
  const response = await request(app)
    .post('/api/removesecret')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('No active secret session to end');
});
