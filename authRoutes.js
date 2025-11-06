// Authentication routes for login and register

const postmark = require('postmark');

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
      // postmarkClient.sendEmail({
      //   "From": "sender@example.com",
      //   "To": "receiver@example.com",
      //   "Subject": "Test",
      //   "TextBody": "Hello from Postmark!"
      // });
      postmarkClient.sendEmailWithTemplate(message);

      const db = client.db(DB_NAME);

      await db.collection('emailCodes').insertOne(newEntry);

      res.status(200).json({ error: '' });
    } catch (e) {
      console.error('Error sending email code:', e);
      res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
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
}

module.exports = setupAuthRoutes;
