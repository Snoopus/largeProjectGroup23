require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//const url = '';
//Go to drivers and get connection string for MongoDB
//You have to set incoming ip address to all, 0.0.0.0/0

const STUDENT = 'student';
const TEACHER = 'teacher';

// Database constants
const DB_NAME = 'Project';
const COLLECTION_USERS = 'Users';
const COLLECTION_CLASSES = 'Classes';

// Error messages
const ERROR_MESSAGES = {
  INVALID_FIELDS: 'Invalid or missing fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized access',
  EMAIL_EXISTS: 'Email already exists',
  USER_ID_EXISTS: 'User ID already exists',
  INSTRUCTOR_NOT_FOUND: 'Instructor not found',
  CLASS_EXISTS: 'Class with this code and section already exists',
  CLASS_NOT_FOUND: 'Class not found',
  USER_NOT_FOUND: 'User not found',
  STUDENTS_ONLY: 'Only students can join classes',
  ALREADY_IN_CLASS: 'User already enrolled in this class',
  INSTRUCTOR_ONLY: 'Only the instructor can perform this action',
  INVALID_SECRET: 'Invalid or expired code',
  NOT_IN_CLASS: 'User not enrolled in this class',
  SERVER_ERROR: 'An error occurred. Please try again later',
  ATTENDANCE_ACTIVE: 'An attendance session is already active',
  ATTENDANCE_INACTIVE: 'No active attendance session to end',
  SECRET_ACTIVE: 'A secret session is already active',
  SECRET_INACTIVE: 'No active secret session to end',
  INVALID_ROLE: 'Invalid role. Must be student or teacher',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_OBJECT_ID: 'Invalid class ID format'
};

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate ObjectId format
function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

// const client = new MongoClient(url);
const url = process.env.MONGO_URL;
const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//client.connect();

// Only run server setup if not in test environment
if (process.env.NODE_ENV !== 'test') {
  async function run() {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }
  run().catch(console.dir);
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

// Helper function to validate inputs
// Returns true if all provided values are valid (not null, undefined, or empty string)
function areInputsValid(...values) {
  return values.every(value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });
}

//app.listen(5000); // start Node + Express server on port 5000
// Only start server if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} and accessible from all network interfaces`);
  });
}



app.post('/api/login', async (req, res, next) => 
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error, role

  const { login, password } = req.body;

  const id = -1;
  const fn = '';
  const ln = '';
  const role = '';

  // Validate inputs
  if (!areInputsValid(login, password)) {
    return res.status(400).json({ 
      id, 
      firstName: fn, 
      lastName: ln, 
      error: ERROR_MESSAGES.INVALID_FIELDS, 
      role 
    });
  }

  try {
    const db = client.db(DB_NAME);
    const results = await db.collection(COLLECTION_USERS).find({login, password}).toArray();

    if (results.length > 0) {
      const user = results[0];
      return res.status(200).json({ 
        id: user.UserID, 
        firstName: user.FirstName, 
        lastName: user.LastName, 
        error: '', 
        role: user.Role
      });
    }

    // Invalid credentials
    res.status(401).json({ 
      id, 
      firstName: fn, 
      lastName: ln, 
      error: ERROR_MESSAGES.INVALID_CREDENTIALS, 
      role 
    });

  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ 
      id, 
      firstName: fn, 
      lastName: ln, 
      error: ERROR_MESSAGES.SERVER_ERROR, 
      role 
    });
  }
});


app.post('/api/register', async (req, res, next) =>
{
  // incoming: email, password, firstName, lastName, id, role
  // outgoing: error

  const { email, password, firstName, lastName, id, role } = req.body;

  // Validate inputs
  if (!areInputsValid(email, password, firstName, lastName, id, role)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
  }

  // Validate role is either student or teacher
  if (role !== STUDENT && role !== TEACHER) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_ROLE });
  }

  const newUser = {
    login: email, 
    password, 
    FirstName: firstName, 
    LastName: lastName, 
    UserID: id, 
    Role: role,
    classList: []
  };

  try {
    const db = client.db(DB_NAME);

    // Check if user with this email already exists
    const existingEmail = await db.collection(COLLECTION_USERS).findOne({login: email});
    
    // Check if user with this UserID already exists
    const existingNid = await db.collection(COLLECTION_USERS).findOne({UserID: id});

    if (existingEmail) {
      return res.status(400).json({ error: ERROR_MESSAGES.EMAIL_EXISTS });
    }

    if (existingNid) {
      return res.status(400).json({ error: ERROR_MESSAGES.USER_ID_EXISTS });
    }

    // If no existing users found, proceed with registration
    await db.collection(COLLECTION_USERS).insertOne(newUser);
    
    // Successful registration
    res.status(200).json({ error: '' });

  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});


app.post('/api/createclass', async (req, res, next) => {
  // incoming: name, duration, instructorId, section, daysOffered, startTime, endTime, classCode
  // outgoing: error, classId

  const { name, duration, instructorId, section, daysOffered, startTime, endTime, classCode } = req.body;

  // Validate inputs
  if (!areInputsValid(name, duration, instructorId, section, daysOffered, startTime, endTime, classCode)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  try {
    const db = client.db(DB_NAME);

    const instructor = await db.collection(COLLECTION_USERS).findOne({UserID: instructorId, Role: TEACHER});

    if (!instructor) {
      return res.status(404).json({ error: ERROR_MESSAGES.INSTRUCTOR_NOT_FOUND });
    }

    const instructorName = `${instructor.FirstName} ${instructor.LastName}`;

    // Check if a class with this classCode already exists
    const existingClass = await db.collection(COLLECTION_CLASSES).findOne({
      classCode,
      section
    });

    if (existingClass) {
      return res.status(400).json({ error: ERROR_MESSAGES.CLASS_EXISTS });
    }

    const newClass = {
      name,
      classCode,
      section,
      daysOffered,
      startTime,
      endTime,
      duration,
      instructorId,
      instructorName,
      studentList: [],
      currentAttendance: null, 
      secret: null,
    };

    // Insert the new class
    const result = await db.collection(COLLECTION_CLASSES).insertOne(newClass);

    // Store the inserted document's ObjectID
    const classId = result.insertedId;
    
    // Add class to instructor's classList
    await db.collection(COLLECTION_USERS).updateOne(
      { UserID: instructorId },
      { $push: { classList: classId } }
    );

    // Successful creation
    res.status(200).json({ 
      error: '',
      classId: classId.toString()
    });

  } catch (e) {
    console.error('Create class error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

app.post('/api/fetchclasses', async (req, res, next) => {
  // incoming: userId
  // outgoing: classes, error

  const { userId } = req.body;

  // Validate inputs
  if (!areInputsValid(userId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS, classes: [] });
  }

  try {
    const db = client.db(DB_NAME);
    let classes = [];

    const user = await db.collection(COLLECTION_USERS).findOne({UserID: userId});

    if (!user) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND, classes: [] });
    }

    const classIds = user.classList || [];

    // Fetch all classes in a single query using $in operator
    if (classIds.length > 0) {
      // Convert all classIds to ObjectId instances, filtering out invalid ones
      const objectIds = classIds
        .filter(id => isValidObjectId(id))
        .map(id => new ObjectId(id));
      
      if (objectIds.length > 0) {
        classes = await db.collection(COLLECTION_CLASSES)
          .find({ _id: { $in: objectIds } })
          .project({ studentList: 0, secret: 0 })
          .toArray();
      }
    }

    res.status(200).json({ 
      error: '',
      classes
    });

  } catch (e) {
    console.error('Fetch classes error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR, classes: [] });
  }
});

app.post('/api/joinclass', async (req, res, next) => {
  // incoming: userId, classCode, section
  // outgoing: error

  const { userId, classCode, section } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, classCode, section)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  try {
    const db = client.db(DB_NAME);

    // Find the class by classCode
    const classToJoin = await db.collection(COLLECTION_CLASSES).findOne({ 
      classCode, 
      section 
    });
    if (!classToJoin) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    const user = await db.collection(COLLECTION_USERS).findOne({UserID: userId});
    if (!user) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    if (user.Role !== STUDENT) {
      return res.status(403).json({ error: ERROR_MESSAGES.STUDENTS_ONLY });
    }

    // Ensure studentList exists and check if user is already enrolled
    const studentList = classToJoin.studentList || [];
    const isUserInClass = studentList.some(student => student.UserID && student.UserID.equals(user._id));

    if (isUserInClass) {
      return res.status(400).json({ error: ERROR_MESSAGES.ALREADY_IN_CLASS });
    }

    // Add user to class studentList
    await db.collection(COLLECTION_CLASSES).updateOne(
      { _id: classToJoin._id },
      { $push: { studentList: { UserID: user._id } } }
    );

    // Add class to user's classList
    await db.collection(COLLECTION_USERS).updateOne(
      { UserID: userId },
      { $push: { classList: classToJoin._id } }
    );

    res.status(200).json({ error: '' });

  } catch (e) {
    console.error('Join class error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }

});

/*
# Prepare Broadcast which has deviceName AND secret (not one only)
app.post('/api/preparebroadcast', async (req, res, next) => {
  // incoming: userId, objectId, deviceName
  // outgoing: error

  const { userId, objectId, deviceName } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(userId, objectId, deviceName)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  try {
    const db = client.db('Project');

    const classToBroadcast = await db.collection('Classes').findOne({ _id: objectId });
    if (!classToBroadcast) {
      error = 'Class not found';
      return res.status(404).json({ error });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToBroadcast.instructorId !== userId) {
      error = 'Only the instructor can prepare a broadcast';
      return res.status(403).json({ error });
    }

    classToBroadcast.deviceName = deviceName;
    
    // CREATE NEW RECORD HERE ONCE RECORD SCHEMA HAS BEEN DETERMINED

    await db.collection('Classes').updateOne(
      { _id: objectId },
      { $set: { deviceName: deviceName } }
    );

    res.status(200).json({ error: '' });

  } catch (e) {
    error = e.toString()
    res.status(500).json({ error })
  }

});
*/


app.post('/api/preparebroadcast', async (req, res, next) => {
  // incoming: userId, objectId
  // outgoing: error

  const { userId, objectId } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate ObjectId format
  if (!isValidObjectId(objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
  }

  try {
    const db = client.db(DB_NAME);

    const classToBroadcast = await db.collection(COLLECTION_CLASSES).findOne({ _id: new ObjectId(objectId) });
    if (!classToBroadcast) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToBroadcast.instructorId !== userId) {
      return res.status(403).json({ error: ERROR_MESSAGES.INSTRUCTOR_ONLY });
    }
    
    if (classToBroadcast.currentAttendance) {
      return res.status(400).json({ error: ERROR_MESSAGES.ATTENDANCE_ACTIVE });
    }
    
    // CREATE NEW RECORD HERE ONCE RECORD SCHEMA HAS BEEN DETERMINED

    res.status(200).json({ error: '' });

  } catch (e) {
    console.error('Prepare broadcast error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }

});


app.post('/api/endbroadcast', async (req, res, next) => {
  // incoming: userId, objectId
  // outgoing: error

  const { userId, objectId } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate ObjectId format
  if (!isValidObjectId(objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
  }

  try {
    const db = client.db(DB_NAME);

    // Convert objectId string to ObjectId
    const classToEnd = await db.collection(COLLECTION_CLASSES).findOne({ _id: new ObjectId(objectId) });
    if (!classToEnd) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToEnd.instructorId !== userId) {
      return res.status(403).json({ error: ERROR_MESSAGES.INSTRUCTOR_ONLY });
    }

    if (classToEnd.currentAttendance === null) {
      return res.status(400).json({ error: ERROR_MESSAGES.ATTENDANCE_INACTIVE });
    }

    // classToEnd.deviceName = null;
    classToEnd.secret = null;

    // FINALIZE RECORD HERE ONCE RECORD SCHEMA HAS BEEN DETERMINED

    // await db.collection(COLLECTION_CLASSES).updateOne(
    //   { _id: new ObjectId(objectId) },
    //   { $set: { deviceName: null } }
    // );

    await db.collection(COLLECTION_CLASSES).updateOne(
      { _id: new ObjectId(objectId) },
      { $set: { secret: null } }
    );

    res.status(200).json({ error: '' });
  } catch (e) {
    console.error('End broadcast error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});


app.post('/api/newsecret', async (req, res, next) => {
  // incoming: userId, objectId, secret
  // outgoing: error

  const { userId, objectId, secret } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, objectId, secret)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate ObjectId format
  if (!isValidObjectId(objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
  }

  try {
    const db = client.db(DB_NAME);

    // Convert objectId string to ObjectId
    const classToUpdate = await db.collection(COLLECTION_CLASSES).findOne({ _id: new ObjectId(objectId) });
    if (!classToUpdate) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToUpdate.instructorId !== userId) {
      return res.status(403).json({ error: ERROR_MESSAGES.INSTRUCTOR_ONLY });
    }

    if (classToUpdate.secret) {
      return res.status(400).json({ error: ERROR_MESSAGES.SECRET_ACTIVE });
    }

    await db.collection(COLLECTION_CLASSES).updateOne(
      { _id: new ObjectId(objectId) },
      { $set: { secret } }
    );

    res.status(200).json({ error: '' });
  } catch (e) {
    console.error('New secret error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});


app.post('/api/removesecret', async (req, res, next) => {
  // incoming: userId, objectId
  // outgoing: error

  const { userId, objectId } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate ObjectId format
  if (!isValidObjectId(objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
  }

  try {
    const db = client.db(DB_NAME);

    const classToUpdate = await db.collection(COLLECTION_CLASSES).findOne({ _id: new ObjectId(objectId) });

    if (!classToUpdate) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToUpdate.instructorId !== userId) {
      return res.status(403).json({ error: ERROR_MESSAGES.INSTRUCTOR_ONLY });
    }

    if (!classToUpdate.secret) {
      return res.status(400).json({ error: ERROR_MESSAGES.SECRET_INACTIVE });
    }

    await db.collection(COLLECTION_CLASSES).updateOne(
      { _id: new ObjectId(objectId) },
      { $set: { secret: null } }
    );

    res.status(200).json({ error: '' });
  } catch (e) {
    console.error('Remove secret error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});


app.post('/api/markmehere', async (req, res, next) => {
  // incoming: userId, objectId, secret
  // outgoing: error

  const { userId, objectId, secret } = req.body;

  // Validate inputs
  if (!areInputsValid(userId, objectId, secret)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
  }

  // Validate ObjectId format
  if (!isValidObjectId(objectId)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
  }

  try {
    const db = client.db(DB_NAME);

    const classToUpdate = await db.collection(COLLECTION_CLASSES).findOne({ _id: new ObjectId(objectId) });
    if (!classToUpdate) {
      return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    const userToMarkPresent = await db.collection(COLLECTION_USERS).findOne({UserID: userId});
    if (!userToMarkPresent) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }
    if (userToMarkPresent.Role !== STUDENT) {
      return res.status(403).json({ error: ERROR_MESSAGES.STUDENTS_ONLY });
    }
    
    // Ensure studentList exists and check if user is enrolled
    const studentList = classToUpdate.studentList || [];
    const isUserInClass = studentList.some(student => student.UserID && student.UserID.equals(userToMarkPresent._id));
    if (!isUserInClass) {
      return res.status(403).json({ error: ERROR_MESSAGES.NOT_IN_CLASS });
    }

    // Check if there's an active secret
    if (!classToUpdate.secret) {
      return res.status(403).json({ error: ERROR_MESSAGES.SECRET_INACTIVE });
    }

    // Check if secret matches (strict equality and case-sensitive)
    if (classToUpdate.secret !== secret || typeof classToUpdate.secret !== typeof secret) {
      return res.status(403).json({ error: ERROR_MESSAGES.INVALID_SECRET });
    }

    // UPDATE RECORD WITH STUDENT BEING HERE

    res.status(200).json({ error: '' });
  } catch (e) {
    console.error('Mark here error:', e);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});


process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down server...');
  client.close();
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down server...');
  client.close();
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});


module.exports = app; // Export the Express app for testing purposes