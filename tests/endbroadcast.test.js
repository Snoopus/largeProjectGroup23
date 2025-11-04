const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;
let jestAttendanceId;

// Test data
const jestTeacher = {
  login: 'jestteacher8@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher8',
  UserID: 99989,
  Role: 'teacher',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // First, insert teacher to get their ObjectId
  const teacherResult = await db.collection('Users').insertOne(jestTeacher);
  const teacherObjId = teacherResult.insertedId;
  
  // Create an attendance record
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
    name: 'Jest End Broadcast Class',
    classCode: 'JEST801',
    section: 'A',
    daysOffered: ['Monday', 'Wednesday'],
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    instructorId: 99989,
    instructorName: 'Jest Teacher8',
    studentList: [],
    currentAttendance: jestAttendanceId,
    secret: 'JEST-END-SECRET'
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

test('endbroadcast with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('endbroadcast with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: '',
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('endbroadcast with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: 12345
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('endbroadcast with null objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: 12345,
      objectId: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('endbroadcast with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: 12345,
      objectId: 'invalid-id-format'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('endbroadcast with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('endbroadcast with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});

test('endbroadcast with non-instructor user returns 403', async () => {
  // First prepare a new broadcast
  const teacherResult = await db.collection('Users').findOne({ UserID: jestTeacher.UserID });
  const newAttendanceRecord = {
    classId: jestClassId,
    instructorId: teacherResult._id,
    startTime: new Date(),
    active: false,
    totalPings: 0,
    pingsCollected: {}
  };
  const newAttendanceResult = await db.collection('Records').insertOne(newAttendanceRecord);
  
  await db.collection('Classes').updateOne(
    { _id: jestClassId },
    { $set: { currentAttendance: newAttendanceResult.insertedId } }
  );

  // Create a different teacher
  const otherTeacher = {
    login: 'otherteacher4@test.com',
    password: 'OtherTeacherPass123',
    FirstName: 'Other',
    LastName: 'Teacher4',
    UserID: 99983,
    Role: 'teacher',
    classList: []
  };
  
  await db.collection('Users').insertOne(otherTeacher);

  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: otherTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe('Only the instructor can perform this action');

  // Cleanup
  await db.collection('Users').deleteOne({ UserID: otherTeacher.UserID });
  await db.collection('Records').deleteOne({ _id: newAttendanceResult.insertedId });
  await db.collection('Classes').updateOne(
    { _id: jestClassId },
    { $set: { currentAttendance: null } }
  );
});

test('endbroadcast when no active attendance returns 400', async () => {
  const response = await request(app)
    .post('/api/endbroadcast')
    .send({
      userId: jestTeacher.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('No active attendance session to end');
});
