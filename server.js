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

  var error = '';

  const { login, password } = req.body;

  var id = -1;
  var fn = '';
  var ln = '';
  var role = '';

  // Validate inputs
  if (!areInputsValid(login, password)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ id:id, firstName:fn, lastName:ln, error:error, role: role });
  }

  try {
    const db = client.db('Project');
    const results = await db.collection('Users').find({login:login,password:password}).toArray();

    if( results.length > 0 )
    {
      id = results[0].UserID;
      fn = results[0].FirstName;
      ln = results[0].LastName;
      role = results[0].Role;
    }

    var ret = { id:id, firstName:fn, lastName:ln, error:'', role: role};
    res.status(200).json(ret);

  } catch (e) {
    error = e.toString();
    res.status(500).json({ id:id, firstName:fn, lastName:ln, error:error, role: role });
  }
});


app.post('/api/register', async (req, res, next) =>
{
  // incoming: email, password, firstName, lastName, id, role
  // outgoing: error

  const { email, password, firstName, lastName, id, role } = req.body;

  // Validate inputs
  if (!areInputsValid(email, password, firstName, lastName, id, role)) {
    const error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  const newUser = {
    login:email, 
    password:password, 
    FirstName:firstName, 
    LastName:lastName, 
    UserID:id, 
    Role:role,
    classList: []
  };

  var error = '';

  try {
    const db = client.db('Project');

    // Check if user with this email already exists
    const existing_email = await db.collection('Users').findOne({login: email});
    
    // Check if user with this UserID already exists
    const existing_nid = await db.collection('Users').findOne({UserID: id});

    if (existing_email) {
      error = 'Email already exists';
      return res.status(400).json({ error });
    }

    if (existing_nid) {
      error = 'User ID already exists';
      return res.status(400).json({ error });
    }

    // If no existing users found, proceed with registration
    const result = await db.collection('Users').insertOne(newUser);
    
    // Successful registration
    res.status(200).json({ error: '' });

  } catch (e) {
    error = e.toString();
    res.status(500).json({ error });
  }
});


app.post('/api/createclass', async (req, res, next) => {
  // incoming: name, duration, instructorId, section, daysOffered, startTime, endTime, classCode
  // outgoing: error, classId

  const { name, duration, instructorId, section, daysOffered, startTime, endTime, classCode } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(name, duration, instructorId, section, daysOffered, startTime, endTime, classCode)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  try {
    const db = client.db('Project');

    const instructor = await db.collection('Users').findOne({UserID: instructorId, Role: TEACHER});

    if (!instructor) {
      error = `Instructor not found`;
      return res.status(404).json({ error });
    }

    const instructorName = `${instructor.FirstName} ${instructor.LastName}`;

    // Check if a class with this name already exists
    const existingClass = await db.collection('Classes').findOne({
      name: name,
      section: section
    });

    if (existingClass) {
      error = 'Class with this name and section already exists';
      return res.status(400).json({ error });
    }

    const newClass = {
      name: name,
      classCode: classCode,
      section: section,
      daysOffered: daysOffered,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      instructorId: instructorId,
      instructorName: instructorName,
      studentList: [],
      currentAttendance: null, 
      deviceName: null,
      secret: null,
    };

    // Insert the new class
    const result = await db.collection('Classes').insertOne(newClass);

    // Store the inserted document's ObjectID
    const classId = result.insertedId;
    
    // Add class to instructor's classList
    await db.collection('Users').updateOne(
      { UserID: instructorId },
      { $push: { classList: classId } }
    );

    // Successful creation
    res.status(200).json({ 
      error: '',
      classId: classId.toString()
    });

  } catch (e) {
    error = e.toString();
    res.status(500).json({ error });
  }
});

app.post('/api/fetchclasses', async (req, res, next) => {
  // incoming: userId
  // outgoing: classes, error

  const { userId } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(userId)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error, classes: [] });
  }

  try {
    const db = client.db('Project');
    let classes = [];

    const user = await db.collection('Users').findOne({UserID: userId});

    if (!user) {
      error = `User not found ${userId}`;
      return res.status(404).json({ error, classes: [] });
    }

    const classIds = user.classList || [];

    // Fetch all classes in a single query using $in operator
    if (classIds.length > 0) {
      // Convert all classIds to ObjectId instances
      const objectIds = classIds.map(id => new ObjectId(id));
      classes = await db.collection('Classes').find({ _id: { $in: objectIds } }).toArray();
    }

    res.status(200).json({ 
      error: '',
      classes: classes
    });

  } catch (e) {
    error = e.toString();
    res.status(500).json({ error, classes: [] });
  }
});

app.post('/api/joinclass', async (req, res, next) => {
  // incoming: userId, classCode, section
  // outgoing: error

  const { userId, classCode, section } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(userId, classCode, section)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  try {
    const db = client.db('Project');

    // Find the class by classCode
    const classToJoin = await db.collection('Classes').findOne({ classCode: classCode, section: section });
    if (!classToJoin) {
      error = 'Class not found';
      return res.status(404).json({ error });
    }

    const user = await db.collection('Users').findOne({UserID: userId});
    if (!user) {
      error = `User not found ${userId}`;
      return res.status(404).json({ error });
    }

    if (user.Role !== STUDENT) {
      error = 'Only students can join classes';
      return res.status(403).json({ error });
    }

    // Check if userId is already in the studentList
    const isUserInClass = classToJoin.studentList.some(student => student.UserID === user._id);

    if (isUserInClass) {
      error = 'User already in class';
      return res.status(400).json({ error });
    }

    // Add user to class studentList
    await db.collection('Classes').updateOne(
      { _id: classToJoin._id },
      { $push: { studentList: { UserID: user._id } } }
    );

    // Add class to user's classList
    await db.collection('Users').updateOne(
      { UserID: userId },
      { $push: { classList: classToJoin._id } }
    );


    res.status(200).json({ error: '' });

  } catch (e) {
    error = e.toString()
    res.status(500).json({ error })
  }

});


app.post('/api/preparebroadcast', async (req, res, next) => {
  // incoming: userId, classCode, section, deviceName
  // outgoing: error

  const { userId, classCode, section, deviceName } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(userId, classCode, section, deviceName)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  try {
    const db = client.db('Project');

    const classToBroadcast = await db.collection('Classes').findOne({ classCode: classCode, section: section });
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
      { _id: classToBroadcast._id },
      { $set: { deviceName: deviceName } }
    );

    res.status(200).json({ error: '' });

  } catch (e) {
    error = e.toString()
    res.status(500).json({ error })
  }

});


app.post('/api/endbroadcast', async (req, res, next) => {
  // incoming: userId, classCode, section
  // outgoing: error

  const { userId, classCode, section } = req.body;

  let error = '';

  // Validate inputs
  if (!areInputsValid(userId, classCode, section)) {
    error = 'Invalid or missing fields';
    return res.status(400).json({ error });
  }

  try {
    const db = client.db('Project');

    const classToEnd = await db.collection('Classes').findOne({ classCode: classCode, section: section });
    if (!classToEnd) {
      error = 'Class not found';
      return res.status(404).json({ error });
    }

    // Realistically, better user verification should be performed here (JWT may handle)
    if (classToEnd.instructorId !== userId) {
      error = 'Only the instructor can end a broadcast';
      return res.status(403).json({ error });
    }

    classToEnd.deviceName = null;

    // FINALIZE RECORD HERE ONCE RECORD SCHEMA HAS BEEN DETERMINED

    await db.collection('Classes').updateOne(
      { _id: classToEnd._id },
      { $set: { deviceName: null } }
    );

    res.status(200).json({ error: '' });
  } catch (e) {
    error = e.toString()
    res.status(500).json({ error })
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