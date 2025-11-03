// Records routes for retrieving user's or students' records

const { ObjectId } = require('mongodb');
const {
  areInputsValid,
  isValidObjectId,
  DB_NAME,
  RECORDS,
  ERROR_MESSAGES
} = require('./utils');

function setupRecordsRoutes(app, client) {

    app.post('/api/fetchteacherrecords', async (req, res, next) => {
        // incoming: objectId (class ID)
        // outgoing: error, records
        try {
            const { objectId } = req.body;

            if (!areInputsValid(objectId)) {
                return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
            }

            // Validate ObjectId format
            if (!isValidObjectId(objectId, ObjectId)) {
                return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
            }

            const db = client.db(DB_NAME);

            const records = await db.collection(RECORDS).find({ classId: new ObjectId(objectId) }).toArray();

            return res.status(200).json({ error: '', records });
            
        } catch (error) {
            console.error('Fetch teacher records error:', error);
            return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
        }
    });


    app.post('/api/fetchstudentrecords', async (req, res, next) => {
        // incoming: userId (NID), objectId (class ID)
        // outgoing: error, records (array of { attendancePercentage: float, startTime: Date })
        try {
            const { userId, objectId } = req.body;

            if (!areInputsValid(userId, objectId)) {
                return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
            }

            // Validate ObjectId format
            if (!isValidObjectId(objectId, ObjectId)) {
                return res.status(400).json({ error: ERROR_MESSAGES.INVALID_OBJECT_ID });
            }

            const db = client.db(DB_NAME);

            const records = await db.collection(RECORDS).find({ classId: new ObjectId(objectId) }).toArray();

            // Filter records that have the student's NID in pingsCollected
            const filteredRecords = records.filter(record => 
                record.pingsCollected && record.pingsCollected.hasOwnProperty(userId)
            );

            // Map to array of attendance percentages and start times
            const attendanceData = filteredRecords.map(record => ({
                attendancePercentage: record.totalPings > 0 
                    ? record.pingsCollected[userId] / record.totalPings 
                    : 0.0,
                startTime: record.startTime
            }));

            return res.status(200).json({ error: '', records: attendanceData });
        } catch (error) {
            return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
        }
    });
}

module.exports = setupRecordsRoutes;