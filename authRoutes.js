// Authentication routes for login and register
const jwt = require('jsonwebtoken');
const postmark = require('postmark');
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
        const jwtsecret = process.env.JWT_SECRET;
        const token = jwt.sign(
          {
            id: user.UserID,
            firstName: user.FirstName,
            lastName: user.LastName,
            role: user.Role
          }, jwtsecret, { expiresIn: '3h' }
        );
        //token printing for debugging
        //console.log(token);

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

    const jwtsecret = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        id: id,
        firstName: firstName,
        lastName: lastName,
        role: roleLower
      }, jwtsecret, { expiresIn: '3h' }
    );

    //token printing for debugging
    //console.log(token);

    // Successful registration
    res.status(200).json({ token: token, error: '' });

  });

  app.post('/api/sendEmailCode', async (req, res, next) => {
    // incoming: email, templateChoice
    // outgoing: error

    const { email, templateChoice } = req.body;

    const newCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code
    const newEntry = { email, code: newCode, createdAt: new Date() };

    // Validate inputs
    if (!areInputsValid(email, templateChoice)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
    }

    let TemplateID;
    if (templateChoice === 'registration') {
      TemplateID = 42075033; // Registration template ID
    } else if (templateChoice === 'passwordReset') {
      TemplateID = 42061052; // Password reset template ID
    }
    else {
      TemplateID = 42075033; // Default to Registration template ID
    }

    try {
      var postmarkClient = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);
      var model = {
        product_name: "bHere@UCF",
        code: newCode,
        company_name: "bHere@UCF",
        company_address: "UCF, Orlando, FL",
        operating_system: "Window"
      }

      var message = new postmark.TemplatedMessage("notifications@email.ilovenarwhals.xyz", TemplateID , model, email);
    
      postmarkClient.sendEmailWithTemplate(message); //do not await

      const db = client.db(DB_NAME);

      await db.collection('emailCodes').insertOne(newEntry);

      res.status(200).json({ error: '' });
    } catch (e) {
      console.error('Error sending email code:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });

  app.post('/api/verifyEmailCode', async (req, res, next) => {
    // incoming: email, verificationCode
    // outgoing: error

    const { email, verificationCode } = req.body;

    if (!areInputsValid(email, verificationCode)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    try {
      const db = client.db(DB_NAME);
      const record = await db.collection('emailCodes').findOne({ email, code: verificationCode } );

      if (!record) {
        return res.status(400).json({ error: ERROR_MESSAGES.INVALID_SECRET });
      }
      
      if(record.code === verificationCode) {
        // Code matches, verification successful
        
        //Delete the used code
        await db.collection('emailCodes').deleteOne({ email, code: verificationCode });
        return res.status(200).json({ error: '' });
      }
    } catch (e) {
      console.error('Error verifying email code:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });


  app.post('/api/changepassword', async (req, res, next) => {
    // incoming: email, newPassword
    // outgoing: error

    const { email, newPassword } = req.body;

    // Validate inputs
    if (!areInputsValid(email, newPassword)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
    }

    try {
      const db = client.db(DB_NAME);

      const user = await db.collection(USERS).findOne({ login: email });
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      await db.collection(USERS).updateOne(
        { login: email },
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
      ].includes(token.error)) {
        return res.status(400).json({ contents: '', error: token });
      } else { // Token is valid, so we know the contents.
        return res.status(200).json({ contents: token, error: '' });
      }
      
    } catch (e) {
      res.status(500).json({ contents: '', error: ERROR_MESSAGES.SERVER_ERROR });
    } 
  });


  app.post('/api/findExistingUser', async (req, res, next) => {
    // incoming: email (required), userId (optional)
    // outgoing: error, blank if user exists

    const { email, userId } = req.body;

    // Validate email is provided
    if (!areInputsValid(email)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FIELDS });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
    }

    try {
      const db = client.db(DB_NAME);

      let query;
      // If both email and userId are provided, search for user with EITHER email OR userId
      if (userId && userId.trim() !== '') {
        query = { $or: [{ login: email }, { UserID: userId }] };
      } else {
        // If only email is provided, search by email only
        query = { login: email };
      }

      const user = await db.collection(USERS).findOne(query);
      if (!user) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      res.status(200).json({ error: '' });
    } catch (e) {
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  });
}

module.exports = setupAuthRoutes;
