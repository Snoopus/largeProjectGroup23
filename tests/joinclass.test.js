const request = require('supertest');
const app = require('../server');

test('joinclass with missing userId returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      classCode: 'CS101',
      section: 'A'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with empty classCode returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: 11111,
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
      userId: 11111,
      classCode: 'CS101',
      section: null
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with missing section returns 400', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: 11111,
      classCode: 'CS101'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid or missing fields');
});

test('joinclass with nonexistent class returns 404', async () => {
  const response = await request(app)
    .post('/api/joinclass')
    .send({
      userId: 11111,
      classCode: 'NONEXISTENT',
      section: 'A'
    });

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Class not found');
});

// Close MongoDB connection after all tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
