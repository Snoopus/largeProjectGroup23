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
//app.listen(5000); // start Node + Express server on port 5000
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and accessible from all network interfaces`);
});

app.post('/api/addcard', async (req, res, next) =>
{
  // incoming: userId, color
  // outgoing: error
	
  const { userId, card } = req.body;

  const newCard = {Card:card,UserId:userId};
  var error = '';

  try
  {
    const db = client.db('Project');
    const result = await db.collection('Cards').insertOne(newCard);
  }
  catch(e)
  {
    error = e.toString();
  }


  var ret = { error: error };
  res.status(200).json(ret);
});


app.post('/api/login', async (req, res, next) => 
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error

  var error = '';

  const { login, password } = req.body;

  const db = client.db('Project');
  const results = await db.collection('Users').find({login:login,password:password}).toArray();

  var id = -1;
  var fn = '';
  var ln = '';
  var role = '';

  if( results.length > 0 )
  {
    id = results[0].UserID;
    fn = results[0].FirstName;
    ln = results[0].LastName;
    role = results[0].Role;
  }

  var ret = { id:id, firstName:fn, lastName:ln, error:'', role: role};
  res.status(200).json(ret);
});


app.post('/api/register', async (req, res, next) =>
{
  // incoming: email, password, firstName, lastName, id, role
  // outgoing: error

  const { email, password, firstName, lastName, id, role } = req.body;

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
  // incoming: name, duration, instructorId, section, daysOffered, startTime, endTime
  // outgoing: error, class ObjectID

  const { name, duration, instructorId, section, daysOffered, startTime, endTime, classCode } = req.body;

  let error = '';

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
    console.log("New class created with ID:", classId);
    
    // Add class to instructor's classList
    await db.collection('Users').updateOne(
      { UserID: instructorId },
      { $push: { classList: classId } }
    );

    // Successful creation
    res.status(200).json({ 
      error: ''
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

  try {
    const db = client.db('Project');
    let classes = [];

    const user = await db.collection('Users').findOne({UserID: userId});

    if (!user) {
      error = `User not found ${userId}`;
      return res.status(404).json({ error, classes: [] });
    }

    const role = user.Role;

    if (role === TEACHER) {
      // If teacher, find classes where instructorId matches
      classes = await db.collection('Classes').find({
        instructorId: userId
      }).toArray();
    } else if (role === STUDENT) {
      // If student, find classes where userId is in studentList
      classes = await db.collection('Classes').find({
        'studentList.UserID': userId
      }).toArray();
    } else {
      error = `Invalid role ${role}`;
      return res.status(400).json({ error, classes: [] });
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
  // incoming: userId, name, section
  // outgoing: error

  const { userId, name, section } = req.body;

  let error = '';

  try {
    const db = client.db('Project');

    // Find the class by name
    const classToJoin = await db.collection('Classes').findOne({ name: name, section: section });
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
    const isUserInClass = classToJoin.studentList.some(student => student.UserID === userId);

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


process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down server...');
  client.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down server...');
  client.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


