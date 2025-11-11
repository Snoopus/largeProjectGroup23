// Authentication routes for login and register
const jwt = require('jsonwebtoken');
const {
  areInputsValid,
  isValidEmail,
  validateJWT,
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
        const token = jwt.sign(
          {
            id: user.UserID,
            firstName: user.FirstName,
            lastName: user.LastName,
            role: user.Role
          }, 'superSecret', { expiresIn: '3h' }
        );

        return res.status(200).json({ 
          id: user.UserID, 
          firstName: user.FirstName, 
          lastName: user.LastName, 
          error: '', 
          role: user.Role,
          token: token
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
      
    } catch (e) {
      console.error('Registration error:', e);
      return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }

    const token = jwt.sign(
      {
        id: id,
        firstName: firstName,
        lastName: lastName,
        role: roleLower
      }, 'superSecret', { expiresIn: '3h' }
    );

    // Successful registration
    res.status(200).json({ token: token, error: '' });

  });


  app.post('/api/changepassword', async (req, res, next) => {
    // incoming: userId (NID), newPassword
    // outgoing: error

    const { userId, newPassword } = req.body;

    // Validate inputs
    if (!areInputsValid(userId, newPassword)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    try {
      const db = client.db(DB_NAME);

      const user = await db.collection(USERS).findOne({UserID: userId});
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      await db.collection(USERS).updateOne(
        { UserID: userId },
        { $set: { password: newPassword } }
      );

      res.status(200).json({ error: '' });
    } catch (e) {
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });


  app.post('/api/checkjwt', async (req, res, next) => {
    //incoming: possibleJWT
    //outgoing: contents, error

    const { possibleJWT } = req.body;

    try {
      
      token = validateJWT(possibleJWT);
      if ([
        ERROR_MESSAGES.JWT_MISSING,
        ERROR_MESSAGES.JWT_INVALID,
        ERROR_MESSAGES.JWT_EXPIRED
      ].includes(token)) {
        return res.status(400).json({ contents: '', error: token });
      } else { // Token is valid, so we know the contents.
        return res.status(200).json({ contents: token, error: '' });
      }
      
    } catch (e) {
      res.status(500).json({ contents: '', error: ERROR_MESSAGES.SERVER_ERROR });
    } 

  });
}

module.exports = setupAuthRoutes;
