// Class management routes for createclass, fetchclasses, and joinclass

const { ObjectId } = require('mongodb');
const {
  areInputsValid,
  isValidObjectId,
  STUDENT,
  TEACHER,
  DB_NAME,
  USERS,
  CLASSES,
  RECORDS,
  ERROR_MESSAGES
} = require('./utils');

// Setup class management routes
function setupClassRoutes(app, client) {

  app.post('/api/createclass', async (req, res, next) => {
    // incoming: name, duration, instructorId (NID), section, daysOffered, startTime, endTime, classCode
    // outgoing: error, classId

    const { name, duration, instructorId, section, daysOffered, startTime, endTime, classCode } = req.body;

    // Validate inputs
    if (!areInputsValid(name, duration, instructorId, section, daysOffered, startTime, endTime, classCode)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    try {
      const db = client.db(DB_NAME);

      const instructor = await db.collection(USERS).findOne({UserID: instructorId});

      if (!instructor || instructor.Role.toLowerCase() !== TEACHER) {
        return res.status(404).json({ error: ERROR_MESSAGES.INSTRUCTOR_NOT_FOUND });
      }

      const instructorName = `${instructor.FirstName} ${instructor.LastName}`;

      // Check if a class with this classCode already exists
      const existingClass = await db.collection(CLASSES).findOne({
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
      const result = await db.collection(CLASSES).insertOne(newClass);

      // Store the inserted document's ObjectID
      const classId = result.insertedId;
      
      // Add class to instructor's classList
      await db.collection(USERS).updateOne(
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
    // incoming: userId (NID)
    // outgoing: classes, error

    const { userId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS, classes: [] });
    }

    try {
      const db = client.db(DB_NAME);
      let classes = [];

      const user = await db.collection(USERS).findOne({UserID: userId});

      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND, classes: [] });
      }

      const classIds = user.classList || [];

      // Fetch all classes in a single query using $in operator
      if (classIds.length > 0) {
        // Convert all classIds to ObjectId instances, filtering out invalid ones
        const objectIds = classIds
          .filter(id => isValidObjectId(id, ObjectId))
          .map(id => new ObjectId(id));
        
        if (objectIds.length > 0) {
          classes = await db.collection(CLASSES)
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
    // incoming: userId (NID), classCode, section
    // outgoing: error

    const { userId, classCode, section } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, classCode, section)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    try {
      const db = client.db(DB_NAME);

      // Find the class by classCode
      const classToJoin = await db.collection(CLASSES).findOne({ 
        classCode, 
        section 
      });
      if (!classToJoin) {
        return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
      }

      const user = await db.collection(USERS).findOne({UserID: userId});
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      if (user.Role.toLowerCase() !== STUDENT) {
        return res.status(403).json({ error: ERROR_MESSAGES.STUDENTS_ONLY });
      }

      // Ensure studentList exists and check if user is already enrolled
      const studentList = classToJoin.studentList || [];
      const isUserInClass = studentList.includes(userId);

      if (isUserInClass) {
        return res.status(400).json({ error: ERROR_MESSAGES.ALREADY_IN_CLASS });
      }

      // Add user to class studentList (storing NID directly)
      await db.collection(CLASSES).updateOne(
        { _id: classToJoin._id },
        { $push: { studentList: userId } }
      );

      // Add class to user's classList
      await db.collection(USERS).updateOne(
        { UserID: userId },
        { $push: { classList: classToJoin._id } }
      );

      res.status(200).json({ error: '' });

    } catch (e) {
      console.error('Join class error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });

  app.post('/api/leaveClass', async (req, res, next) => {
    // incoming: userId (NID), class ObjectId
    // outgoing: error

    const { userId, classId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, classId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate classId format
    if (!isValidObjectId(classId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      // Find the class by classId (convert string to ObjectId)
      const classObjectId = new ObjectId(classId);
      const classToLeave = await db.collection(CLASSES).findOne({ _id: classObjectId });
      if (!classToLeave) {
        return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
      }

      const user = await db.collection(USERS).findOne({UserID: userId});
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      if (user.Role.toLowerCase() !== STUDENT) {
        return res.status(403).json({ error: ERROR_MESSAGES.STUDENTS_ONLY });
      }

      // Remove user from class's studentList
      await db.collection(CLASSES).updateOne(
        { _id: classToLeave._id },
        { $pull: { studentList: userId } }
      );

      // Remove class from user's classList
      await db.collection(USERS).updateOne(
        { UserID: userId },
        { $pull: { classList: classObjectId } }
      );

      res.status(200).json({ error: '' });

    } catch (e) {
      console.error('Leave class error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });

  app.post('/api/deleteClass', async (req, res, next) => {
    // incoming: userId (NID - must be teacher), classId (ObjectId string)
    // outgoing: error

    const { userId, classId } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, classId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    // Validate and convert classId to ObjectId
    if (!isValidObjectId(classId, ObjectId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
    }

    try {
      const db = client.db(DB_NAME);

      // Verify user exists and is a teacher BEFORE doing any operations
      const user = await db.collection(USERS).findOne({ UserID: userId });
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      if (user.Role.toLowerCase() !== TEACHER) {
        return res.status(403).json({ error: 'Only teachers can delete classes' });
      }

      // Find the class by classId
      const classObjectId = new ObjectId(classId);
      const classToDelete = await db.collection(CLASSES).findOne({ _id: classObjectId });
      if (!classToDelete) {
        return res.status(404).json({ error: ERROR_MESSAGES.CLASS_NOT_FOUND });
      }

      // Get the list of student IDs from the class
      const studentList = classToDelete.studentList || [];

      // Remove the class from all students' classList
      if (studentList.length > 0) {
        await db.collection(USERS).updateMany(
          { UserID: { $in: studentList } },
          { $pull: { classList: classObjectId } }
        );
      }

      // Remove the class from the teacher's classList
      await db.collection(USERS).updateOne(
        { UserID: userId },
        { $pull: { classList: classObjectId } }
      );

      // Finally, delete the class document itself
      await db.collection(CLASSES).deleteOne({ _id: classObjectId });

      // Delete all records associated with this class
      await db.collection(RECORDS).deleteMany({ classId: classObjectId });

      res.status(200).json({ error: '' });

    } catch (e) {
      console.error('Delete class error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });

}



module.exports = setupClassRoutes;
