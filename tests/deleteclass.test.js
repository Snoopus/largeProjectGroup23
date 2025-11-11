const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;
let jestRecordId;

const jestTeacher = {
  login: 'jestteacher_delete@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'TeacherDelete',
  UserID: 99998,
  Role: 'teacher',
  classList: []
};

const jestStudent = {
  login: 'jeststudent_delete@test.com',
  password: 'JestStudentPass123',
  FirstName: 'Jest',
  LastName: 'StudentDelete',
  UserID: 99999,
  Role: 'student',
  classList: []
};

const jestClass = {
  name: 'Jest Delete Class',
  classCode: 'JEST501',
  section: 'A',
  daysOffered: ['Thursday'],
  startTime: '15:00',
  endTime: '16:00',
  duration: 60,
  instructorId: 99998,
  instructorName: 'Jest TeacherDelete',
  studentList: [99999],
  currentAttendance: null,
  secret: null
};

const jestRecord = {
  classId: null, // to be set after class creation
  pingsCollected: { '99999': 3 },
  totalPings: 5,
  startTime: new Date()
};

beforeAll(async () => {
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  await db.collection('Users').insertOne(jestTeacher);
  await db.collection('Users').insertOne(jestStudent);
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  await db.collection('Users').updateOne(
    { UserID: jestTeacher.UserID },
    { $push: { classList: jestClassId } }
  );
  await db.collection('Users').updateOne(
    { UserID: jestStudent.UserID },
    { $push: { classList: jestClassId } }
  );
  jestRecord.classId = jestClassId;
  const recordResult = await db.collection('Records').insertOne(jestRecord);
  jestRecordId = recordResult.insertedId;
});

afterAll(async () => {
  await db.collection('Users').deleteMany({ UserID: { $in: [jestTeacher.UserID, jestStudent.UserID] } });
  await db.collection('Classes').deleteMany({ instructorId: jestTeacher.UserID });
  await db.collection('Records').deleteMany({ classId: jestClassId });
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('deleteClass removes class, students, teacher, and records', async () => {
  const response = await request(app)
    .post('/api/deleteClass')
    .send({
      userId: jestTeacher.UserID,
      classId: jestClassId.toString()
    });
  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');

  // Verify class is deleted
  const deletedClass = await db.collection('Classes').findOne({ _id: jestClassId });
  expect(deletedClass).toBeNull();

  // Verify class removed from teacher's classList
  const updatedTeacher = await db.collection('Users').findOne({ UserID: jestTeacher.UserID });
  expect(updatedTeacher.classList).not.toContainEqual(jestClassId);

  // Verify class removed from student's classList
  const updatedStudent = await db.collection('Users').findOne({ UserID: jestStudent.UserID });
  expect(updatedStudent.classList).not.toContainEqual(jestClassId);

  // Verify records deleted
  const deletedRecord = await db.collection('Records').findOne({ _id: jestRecordId });
  expect(deletedRecord).toBeNull();
});

test('deleteClass with non-teacher role returns error', async () => {
  const response = await request(app)
    .post('/api/deleteClass')
    .send({
      userId: jestStudent.UserID,
      classId: jestClassId.toString()
    });
  expect(response.status).toBe(403);
  expect(response.body.error).toBeDefined();
});

test('deleteClass with invalid classId returns error', async () => {
  const response = await request(app)
    .post('/api/deleteClass')
    .send({
      userId: jestTeacher.UserID,
      classId: 'invalidid'
    });
  expect(response.status).toBe(400);
  expect(response.body.error).toBeDefined();
});
