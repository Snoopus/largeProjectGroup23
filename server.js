require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ServerApiVersion } = require('mongodb');
//const url = '';
//Go to drivers and get connection string for MongoDB
//You have to set incoming ip address to all, 0.0.0.0/0

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
const server = app.listen(5000, () => {
  console.log('Server running on port 5000');
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

  if( results.length > 0 )
  {
    id = results[0].UserID;
    fn = results[0].FirstName;
    ln = results[0].LastName;
    teacher = results[0].teacher;
  }

  var ret = { id:id, firstName:fn, lastName:ln, error:'', teacher: teacher};
  res.status(200).json(ret);
});


app.post('/api/register', async (req, res, next) =>
{
  // incoming: email, password, firstName, lastName, id
  // outgoing: error

  const { email, password, firstName, lastName, id, role } = req.body;

  const newUser = {login:email, password:password, FirstName:firstName, LastName:lastName, UserID:id, Role:role};
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


app.post('/api/searchcards', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = '';

  const { userId, search } = req.body;

  var _search = search.trim();
  
  const db = client.db('Project');
  const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push( results[i].Card );
  }
  
  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
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


