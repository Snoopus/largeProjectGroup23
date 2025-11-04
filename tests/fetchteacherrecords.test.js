const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;

// Test data
const jestTeacher = {
  login: 'jestteacher10@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'Teacher10',
  UserID: 99910,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Teacher Records Class',
  classCode: 'JEST1001',
  section: 'A',
  daysOffered: ['Monday', 'Wednesday'],
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  instructorId: 99910,
  instructorName: 'Jest Teacher10',
  studentList: ['99911'],
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
  
  // Insert test teacher
  jestTeacher.classList = [jestClassId];
  await db.collection('Users').insertOne(jestTeacher);

  // Insert test attendance records
  const record1 = {
    classId: jestClassId,
    instructorId: new ObjectId(),
    startTime: new Date('2025-11-01T10:00:00Z'),
    active: false,
    totalPings: 5,
    pingsCollected: {
      '99911': 4
    }
  };
  
  const record2 = {
    classId: jestClassId,
    instructorId: new ObjectId(),
    startTime: new Date('2025-11-03T10:00:00Z'),
    active: false,
    totalPings: 3,
    pingsCollected: {
      '99911': 3
    }
  };

  const result1 = await db.collection('Records').insertOne(record1);
  const result2 = await db.collection('Records').insertOne(record2);
  jestRecords.push(result1.insertedId, result2.insertedId);
});

afterAll(async () => {
  // Clean up test data
  await db.collection('Users').deleteMany({ 
    UserID: jestTeacher.UserID
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

test('fetchteacherrecords with missing objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({});

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchteacherrecords with empty objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({ objectId: '' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchteacherrecords with null objectId returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({ objectId: null });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('fetchteacherrecords with invalid objectId format returns 400', async () => {
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({ objectId: 'invalid-id-format' });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid class ID format');
});

test('fetchteacherrecords with valid objectId returns 200', async () => {
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({ objectId: jestClassId.toString() });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.records).toBeDefined();
  expect(Array.isArray(response.body.records)).toBe(true);
  expect(response.body.records.length).toBe(2);
  
  // Verify record structure
  const record = response.body.records[0];
  expect(record).toHaveProperty('classId');
  expect(record).toHaveProperty('startTime');
  expect(record).toHaveProperty('totalPings');
  expect(record).toHaveProperty('pingsCollected');
});

test('fetchteacherrecords with nonexistent class returns empty array', async () => {
  const fakeClassId = new ObjectId();
  const response = await request(app)
    .post('/api/fetchteacherrecords')
    .send({ objectId: fakeClassId.toString() });

  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');
  expect(response.body.records).toBeDefined();
  expect(Array.isArray(response.body.records)).toBe(true);
  expect(response.body.records.length).toBe(0);
});
