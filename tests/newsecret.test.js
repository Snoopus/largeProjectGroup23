const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;
let jestAttendanceId;

// Test data
const jestTeacher = {
  login: 'jestteacher5@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher5',
  UserID: 99997,
  Role: 'teacher',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert teacher first to get ObjectId
  const teacherResult = await db.collection('Users').insertOne(jestTeacher);
  const teacherObjId = teacherResult.insertedId;
  
  // Create an attendance record for newsecret test
  const attendanceRecord = {
    classId: null, // Will be updated after class is created
    instructorId: teacherObjId,
    startTime: new Date(),
    active: false,
    totalPings: 0,
    pingsCollected: {}
  };
  const attendanceResult = await db.collection('Records').insertOne(attendanceRecord);
  jestAttendanceId = attendanceResult.insertedId;

  // Create class with attendance record
  const jestClass = {
    name: 'Jest New Secret Class',
    classCode: 'JEST501',
    section: 'A',
    daysOffered: ['Monday', 'Wednesday'],
    startTime: '13:00',
    endTime: '14:00',
    duration: 60,
    instructorId: 99997,
    instructorName: 'Jest Teacher5',
    studentList: [],
    currentAttendance: jestAttendanceId,
    secret: null
  };
  
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  
  // Update attendance record with class ID
  await db.collection('Records').updateOne(
    { _id: jestAttendanceId },
    { $set: { classId: jestClassId } }
  );
  
  // Update teacher's classList
  await db.collection('Users').updateOne(
    { _id: teacherObjId },
    { $set: { classList: [jestClassId] } }
  );
});

afterAll(async () => {
  // Clean up test data - only delete specific test user, classes, and attendance records
  await db.collection('Users').deleteMany({ 
    UserID: jestTeacher.UserID
  });
  await db.collection('Classes').deleteMany({ 
    instructorId: jestTeacher.UserID
  });
  await db.collection('Records').deleteMany({
    _id: jestAttendanceId
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('newsecret with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: '',
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with missing secret returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with empty secret returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: ''
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with null secret returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('newsecret with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      objectId: 'invalid-id-format',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('newsecret with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('newsecret with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/newsecret')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString(),
      secret: 'JEST-NEW-SECRET'
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});
