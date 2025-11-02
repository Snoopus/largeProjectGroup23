// Authentication routes for login and register

const {
  areInputsValid,
  isValidEmail,
  STUDENT,
  TEACHER,
  DB_NAME,
  USERS,
  ERROR_MESSAGES
} = require('./utils');

// Setup authentication routes
function setupAuthRoutes(app, client) {
  
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
      const results = await db.collection(USERS).find({login, password}).toArray();

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
    // incoming: email, password, firstName, lastName, id (NID), role
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

    // Validate role is either student or teacher (case-insensitive)
    const roleLower = role.toLowerCase();
    if (roleLower !== STUDENT && roleLower !== TEACHER) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_ROLE });
    }

    const newUser = {
      login: email, 
      password, 
      FirstName: firstName, 
      LastName: lastName, 
      UserID: id, 
      Role: roleLower,
      classList: []
    };

    try {
      const db = client.db(DB_NAME);

      // Check if user with this email already exists
      const existingEmail = await db.collection(USERS).findOne({login: email});
      
      // Check if user with this UserID already exists
      const existingNid = await db.collection(USERS).findOne({UserID: id});

      if (existingEmail) {
        return res.status(400).json({ error: ERROR_MESSAGES.EMAIL_EXISTS });
      }

      if (existingNid) {
        return res.status(400).json({ error: ERROR_MESSAGES.USER_ID_EXISTS });
      }

      // If no existing users found, proceed with registration
      await db.collection(USERS).insertOne(newUser);
      
      // Successful registration
      res.status(200).json({ error: '' });

    } catch (e) {
      console.error('Registration error:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });
}

module.exports = setupAuthRoutes;
