const request = require('supertest');
const app = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;
let jestClassId;

const jestStudent = {
  login: 'jeststudent_leave@test.com',
  password: 'JestStudentPass123',
  FirstName: 'Jest',
  LastName: 'StudentLeave',
  UserID: 99996,
  Role: 'student',
  classList: []
};

const jestTeacher = {
  login: 'jestteacher_leave@test.com',
  password: 'JestTeacherPass123',
  FirstName: 'Jest',
  LastName: 'TeacherLeave',
  UserID: 99997,
  Role: 'teacher',
  classList: []
};

const jestClass = {
  name: 'Jest Leave Class',
  classCode: 'JEST401',
  section: 'A',
  daysOffered: ['Friday'],
  startTime: '12:00',
  endTime: '13:00',
  duration: 60,
  instructorId: 99997,
  instructorName: 'Jest TeacherLeave',
  studentList: [99996],
  currentAttendance: null,
  secret: null
};

beforeAll(async () => {
  const url = process.env.MONGO_URL;
  client = new MongoClient(url);
  await client.connect();
  db = client.db('Project');

  await db.collection('Users').insertOne(jestStudent);
  await db.collection('Users').insertOne(jestTeacher);
  const classResult = await db.collection('Classes').insertOne(jestClass);
  jestClassId = classResult.insertedId;
  await db.collection('Users').updateOne(
    { UserID: jestStudent.UserID },
    { $push: { classList: jestClassId } }
  );
});

afterAll(async () => {
  await db.collection('Users').deleteMany({ UserID: { $in: [jestStudent.UserID, jestTeacher.UserID] } });
  await db.collection('Classes').deleteMany({ instructorId: jestTeacher.UserID });
  await client.close();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('leaveClass removes student from class and class from student', async () => {
  const response = await request(app)
    .post('/api/leaveClass')
    .send({
      userId: jestStudent.UserID,
      classId: jestClassId.toString()
    });
  expect(response.status).toBe(200);
  expect(response.body.error).toBe('');

  // Verify student is removed from class studentList
  const updatedClass = await db.collection('Classes').findOne({ _id: jestClassId });
  expect(updatedClass.studentList).not.toContain(jestStudent.UserID);

  // Verify class is removed from student's classList
  const updatedStudent = await db.collection('Users').findOne({ UserID: jestStudent.UserID });
  expect(updatedStudent.classList).not.toContainEqual(jestClassId);
});

test('leaveClass with invalid classId returns error', async () => {
  const response = await request(app)
    .post('/api/leaveClass')
    .send({
      userId: jestStudent.UserID,
      classId: 'invalidid'
    });
  expect(response.status).toBe(400);
  expect(response.body.error).toBeDefined();
});

test('leaveClass with non-student role returns error', async () => {
  const response = await request(app)
    .post('/api/leaveClass')
    .send({
      userId: jestTeacher.UserID,
      classId: jestClassId.toString()
    });
  expect(response.status).toBe(403);
  expect(response.body.error).toBeDefined();
});
