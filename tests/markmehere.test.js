const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;
let jestStudentObjId;
let jestAttendanceId;

// Test data
const jestStudent = {
  login: 'jeststudent2@test.com',
  password: 'JestStudentPass123',
  FirstName: 'Jest',
  LastName: 'Student2',
  UserID: 99999,
  Role: 'student',
  classList: []
};

const jestTeacher = {
  login: 'jestteacher7@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher7',
  UserID: 99987,
  Role: 'teacher',
  classList: []
};

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert student and get ObjectId
  const studentResult = await db.collection('Users').insertOne(jestStudent);
  jestStudentObjId = studentResult.insertedId;
  
  // Insert teacher and get ObjectId
  const teacherResult = await db.collection('Users').insertOne(jestTeacher);
  const teacherObjId = teacherResult.insertedId;
  
  // Create an attendance record for markmehere test
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
  
  // Create class with student and attendance
  const jestClass = {
    name: 'Jest Attendance Class',
    classCode: 'JEST701',
    section: 'A',
    daysOffered: ['Monday', 'Wednesday', 'Friday'],
    startTime: '08:00',
    endTime: '09:00',
    duration: 60,
    instructorId: 99987,
    instructorName: 'Jest Teacher7',
    studentList: [jestStudent.UserID], // Store NID directly
    currentAttendance: jestAttendanceId,
    secret: 'JEST-ATTEND-SECRET'
  };
  
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  
  // Update attendance record with class ID
  await db.collection('Records').updateOne(
    { _id: jestAttendanceId },
    { $set: { classId: jestClassId } }
  );
  
  // Update student's classList
  await db.collection('Users').updateOne(
    { _id: jestStudentObjId },
    { $set: { classList: [jestClassId] } }
  );
  
  // Update teacher's classList
  await db.collection('Users').updateOne(
    { _id: teacherObjId },
    { $set: { classList: [jestClassId] } }
  );
});

afterAll(async () => {
  // Clean up test data - only delete specific test users, classes, and attendance records
  await db.collection('Users').deleteMany({ 
    UserID: { $in: [jestStudent.UserID, jestTeacher.UserID] }
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

test('markmehere with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: '',
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with missing secret returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with empty secret returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: ''
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with null secret returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('markmehere with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      objectId: 'invalid-id-format',
      secret: 'ABC123'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('markmehere with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: 12345,
      objectId: '507f1f77bcf86cd799439011',
      secret: 'ABC123'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

test('markmehere with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: jestStudent.UserID,
      objectId: jestClassId.toString(),
      secret: 'JEST-ATTEND-SECRET'
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
});

test('markmehere with incorrect secret returns 403', async () => {
  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: jestStudent.UserID,
      objectId: jestClassId.toString(),
      secret: 'WRONG-SECRET'
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe('Invalid or expired code');
});

test('markmehere with student not in class returns 403', async () => {
  // Create a new student not in the class
  const outsideStudent = {
    login: 'outsidestudent@test.com',
    password: 'OutsidePass123',
    FirstName: 'Outside',
    LastName: 'Student',
    UserID: 99988,
    Role: 'student',
    classList: []
  };
  
  await db.collection('Users').insertOne(outsideStudent);

  const response = await request(app)
    .post('/api/markmehere')
    .send({
      userId: outsideStudent.UserID,
      objectId: jestClassId.toString(),
      secret: 'JEST-ATTEND-SECRET'
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe('User not enrolled in this class');

  // Cleanup
  await db.collection('Users').deleteOne({ UserID: outsideStudent.UserID });
});
