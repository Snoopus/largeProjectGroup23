require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const setupAuthRoutes = require('./authRoutes');
const setupClassRoutes = require('./classRoutes');
const setupAttendanceRoutes = require('./attendanceRoutes');
const setupRecordsRoutes = require('./recordsRoutes');

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

// Setup authentication routes
setupAuthRoutes(app, client);

// Setup class management routes
setupClassRoutes(app, client);

// Setup attendance routes
setupAttendanceRoutes(app, client);

setupRecordsRoutes(app, client);


//app.listen(5000); // start Node + Express server on port 5000
// Only start server if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} and accessible from all network interfaces`);
  });
}


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