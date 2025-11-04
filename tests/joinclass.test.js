const request = require('supertest');
const app = require('../server');
const { MongoClient } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestStudent = {
  login: 'jeststudent@test.com',
  password: 'JestStudentPass123',
  FirstName: 'Jest',
  LastName: 'Student',
  UserID: 99993,
  Role: 'student',
  classList: []
};

const jestTeacher = {
  login: 'jestteacher2@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher2',
  UserID: 99994,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Join Class',
  classCode: 'JEST201',
  section: 'A',
  daysOffered: ['Monday', 'Wednesday'],
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  instructorId: 99994,
  instructorName: 'Jest Teacher2',
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
  await db.collection('Users').insertOne(jestStudent);
  await db.collection('Users').insertOne(jestTeacher);
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
});

afterAll(async () => {
  // Clean up test data - only delete specific test users and classes
  await db.collection('Users').deleteMany({ 
    UserID: { $in: [jestStudent.UserID, jestTeacher.UserID] }
  });
  await db.collection('Classes').deleteMany({ 
    instructorId: jestTeacher.UserID
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('joinclass with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      classCode: 'JEST201',
      section: 'A'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with empty classCode returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: '',
      section: 'A'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with null section returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: 'JEST201',
      section: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with missing section returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: 'JEST201'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: 'NONEXISTENT',
      section: 'A'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('joinclass with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: 'JEST201',
      section: 'A'
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});

test('joinclass with already enrolled student returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestStudent.UserID,
      classCode: 'JEST201',
      section: 'A'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('User already enrolled in this class');
});

test('joinclass with teacher role returns 403', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: jestTeacher.UserID,
      classCode: 'JEST201',
      section: 'A'
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe('Only students can join classes');
});
