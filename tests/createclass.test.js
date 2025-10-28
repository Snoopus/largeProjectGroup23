const request = require('supertest');
const app = require('../server');

test('createclass with missing name returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      duration: 60,
      instructorId: 99999,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'CS101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with empty section returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Computer Science 101',
      duration: 60,
      instructorId: 99999,
      section: '',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'CS101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with null duration returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Computer Science 101',
      duration: null,
      instructorId: 99999,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'CS101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with missing classCode returns 400', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Computer Science 101',
      duration: 60,
      instructorId: 99999,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('createclass with nonexistent instructor returns 404', async () => {
  const response = await request(app)
    .post('/api/createclass')
    .send({
      name: 'Computer Science 101',
      duration: 60,
      instructorId: 99999,
      section: 'A',
      daysOffered: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:00',
      classCode: 'CS101'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Instructor not found');
});

// Close MongoDB connection after all tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
