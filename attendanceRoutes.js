// Attendance and broadcast routes

const { ObjectId } = require('mongodb');
const {
  areInputsValid,
  isValidObjectId,
  STUDENT,
  DB_NAME,
  USERS,
  CLASSES,
  RECORDS,
  ERROR_MESSAGES,
  ATTENDANCE_THRESHOLD
} = require('./utils');

// Helper function to create a new attendance record
function newRecord(classId, instructorId) {
  return {
    classId: new ObjectId(classId),
    instructorId: new ObjectId(instructorId),
    startTime: new Date(),
    active: false,
    totalPings: 0,
    pingsCollected: {}
  };
}

// Setup attendance routes
function setupAttendanceRoutes(app, client) {

  app.post('/api/preparebroadcast', async (req, res, next) => {
    // incoming: userId (NID), objectId (of the class)
    // outgoing: error

    const { userId, objectId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, objectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate ObjectId format
    if (!isValidObjectId(objectId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      const classToBroadcast = await db.collection(CLASSES).findOne({ _id: new ObjectId(objectId) });
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
      
      const instructor = await db.collection(USERS).findOne({ UserID: userId });
      if (!instructor) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      // CREATE NEW RECORD 
      const attendanceRecord = newRecord(classToBroadcast._id, instructor._id);
      const result = await db.collection(RECORDS).insertOne(attendanceRecord);

      const attendanceId = result.insertedId;

      await db.collection(CLASSES).updateOne(
        { _id: new ObjectId(objectId) },
        { $set: { currentAttendance: attendanceId } }
      );

      res.status(200).json({ error: '' });

    } catch (e) {
      console.error('Prepare broadcast error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });


  app.post('/api/endbroadcast', async (req, res, next) => {
    // incoming: userId (NID), objectId (of the class)
    // outgoing: error

    const { userId, objectId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, objectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate ObjectId format
    if (!isValidObjectId(objectId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      // Convert objectId string to ObjectId
      const classToEnd = await db.collection(CLASSES).findOne({ _id: new ObjectId(objectId) });
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

      const record = await db.collection(RECORDS).findOne({ _id: classToEnd.currentAttendance });
      if (!record) {
        return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
      }

      // for (const studentId in record.pingsCollected) {
      //   const pings = record.pingsCollected[studentId];
      //   if (pings / record.totalPings >= ATTENDANCE_THRESHOLD) {
      //     // Mark attendance for this student

      //   }
      // }

      await db.collection(CLASSES).updateOne(
        { _id: new ObjectId(objectId) },
        { $set: { 
          secret: null, 
          currentAttendance: null 
        }}
      );

      res.status(200).json({ error: '' });
    } catch (e) {
      console.error('End broadcast error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });


  app.post('/api/newsecret', async (req, res, next) => {
    // incoming: userId (NID), objectId (of the class), secret
    // outgoing: error

    const { userId, objectId, secret } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, objectId, secret)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate ObjectId format
    if (!isValidObjectId(objectId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      // Convert objectId string to ObjectId
      const classToUpdate = await db.collection(CLASSES).findOne({ _id: new ObjectId(objectId) });
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

      await db.collection(CLASSES).updateOne(
        { _id: new ObjectId(objectId) },
        { $set: { secret } }
      );

      // Increment currentAttendance's totalPings
      await db.collection(RECORDS).updateOne(
        { _id: new ObjectId(classToUpdate.currentAttendance) },
        { $inc: { totalPings: 1 } }
      );

      res.status(200).json({ error: '' });
    } catch (e) {
      console.error('New secret error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });


  app.post('/api/removesecret', async (req, res, next) => {
    // incoming: userId (NID), objectId (of the class)
    // outgoing: error

    const { userId, objectId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, objectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate ObjectId format
    if (!isValidObjectId(objectId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      const classToUpdate = await db.collection(CLASSES).findOne({ _id: new ObjectId(objectId) });

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

      await db.collection(CLASSES).updateOne(
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
    // incoming: userId (NID), objectId (of the class), secret
    // outgoing: error

    const { userId, objectId, secret } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, objectId, secret)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate ObjectId format
    if (!isValidObjectId(objectId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      const classToUpdate = await db.collection(CLASSES).findOne({ _id: new ObjectId(objectId) });
      if (!classToUpdate) {
        return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
      }

      // Realistically, better user verification should be performed here (JWT may handle)
      const userToMarkPresent = await db.collection(USERS).findOne({UserID: userId});
      if (!userToMarkPresent) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }
      if (userToMarkPresent.Role.toLowerCase() !== STUDENT) {
        return res.status(403).json({ error: ERROR_MESSAGES.STUDENTS_ONLY });
      }
      
      // Ensure studentList exists and check if user is enrolled
      const studentList = classToUpdate.studentList || [];
      const isUserInClass = studentList.includes(userId);
      
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
      const attendanceId = classToUpdate.currentAttendance;
      if (!attendanceId) {
        return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
      }
      const attendanceRecord = await db.collection(RECORDS).findOne({ _id: attendanceId });
      if (!attendanceRecord) {
        return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
      }

      // Update attendance record with student being here
      const studentId = userToMarkPresent.UserID;

      await db.collection(RECORDS).updateOne(
        { _id: attendanceId },
        { 
          $inc: { [`pingsCollected.${studentId}`]: 1 }
        }
      );

      res.status(200).json({ error: '' });
    } catch (e) {
      console.error('Mark here error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });

}

module.exports = setupAttendanceRoutes;
