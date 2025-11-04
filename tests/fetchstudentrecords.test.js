const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestStudent = {
  login: 'jeststudent11@test.com',
  password: 'JestStudentPass123',
  FirstName: 'Jest',
  LastName: 'Student11',
  UserID: 99920,
  Role: 'student',
  classList: []
};

const jestClass = {
  name: 'Jest Student Records Class',
  classCode: 'JEST1101',
  section: 'A',
  daysOffered: ['Tuesday', 'Thursday'],
  startTime: '14:00',
  endTime: '15:00',
  duration: 60,
  instructorId: 99999,
  instructorName: 'Jest Instructor',
  studentList: ['99920'],
  currentAttendance: null,
  secret: null
};

const jestRecords = [];

beforeAll(async () => {
  // Connect to database
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  // Insert test class
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  
  // Insert test student
  jestStudent.classList = [jestClassId];
  await db.collection('Users').insertOne(jestStudent);

  // Insert test attendance records
  const record1 = {
    classId: jestClassId,
    instructorId: new ObjectId(),
    startTime: new Date('2025-11-01T14:00:00Z'),
    active: false,
    totalPings: 10,
    pingsCollected: {
      '99920': 8
    }
  };
  
  const record2 = {
    classId: jestClassId,
    instructorId: new ObjectId(),
    startTime: new Date('2025-11-03T14:00:00Z'),
    active: false,
    totalPings: 5,
    pingsCollected: {
      '99920': 3
    }
  };

  const record3 = {
    classId: jestClassId,
    instructorId: new ObjectId(),
    startTime: new Date('2025-11-02T14:00:00Z'),
    active: false,
    totalPings: 7,
    pingsCollected: {
      '99921': 5  // Different student - should be filtered out
    }
  };

  const result1 = await db.collection('Records').insertOne(record1);
  const result2 = await db.collection('Records').insertOne(record2);
  const result3 = await db.collection('Records').insertOne(record3);
  jestRecords.push(result1.insertedId, result2.insertedId, result3.insertedId);
});

afterAll(async () => {
  // Clean up test data
  await db.collection('Users').deleteMany({ 
    UserID: jestStudent.UserID
  });
  await db.collection('Classes').deleteMany({ 
    _id: jestClassId
  });
  await db.collection('Records').deleteMany({
    _id: { $in: jestRecords }
  });
  
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('fetchstudentrecords with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchstudentrecords with empty userId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: '',
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchstudentrecords with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchstudentrecords with null objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID,
      objectId: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchstudentrecords with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID,
      objectId: 'invalid-id-format'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('fetchstudentrecords with valid data returns 200', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.records).toBeDefined();
  expect(Array.isArray(response.body.records)).toBe(true);
  expect(response.body.records.length).toBe(2);  // Should only return records for this student
  
  // Verify record structure contains studentPings and totalPings
  const record = response.body.records[0];
  expect(record).toHaveProperty('studentPings');
  expect(record).toHaveProperty('totalPings');
  expect(record).toHaveProperty('startTime');
  expect(typeof record.studentPings).toBe('number');
  expect(typeof record.totalPings).toBe('number');
});

test('fetchstudentrecords returns correct ping counts', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID,
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.records.length).toBe(2);
  
  // Check that the records contain the correct ping data
  const record1 = response.body.records.find(r => r.totalPings === 10);
  const record2 = response.body.records.find(r => r.totalPings === 5);
  
  expect(record1).toBeDefined();
  expect(record1.studentPings).toBe(8);
  expect(record1.totalPings).toBe(10);
  
  expect(record2).toBeDefined();
  expect(record2.studentPings).toBe(3);
  expect(record2.totalPings).toBe(5);
});

test('fetchstudentrecords with nonexistent student returns empty array', async () => {
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: 99999999,  // Non-existent student
      objectId: jestClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.records).toBeDefined();
  expect(Array.isArray(response.body.records)).toBe(true);
  expect(response.body.records.length).toBe(0);
});

test('fetchstudentrecords with nonexistent class returns empty array', async () => {
  const fakeClassId = new ObjectId();
  const response = await request(app)
    .post('/api/fetchstudentrecords')
    .send({
      userId: jestStudent.UserID,
      objectId: fakeClassId.toString()
    });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.records).toBeDefined();
  expect(Array.isArray(response.body.records)).toBe(true);
  expect(response.body.records.length).toBe(0);
});
