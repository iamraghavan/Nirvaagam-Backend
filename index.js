const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
 // Import express-session
const moment = require('moment');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const otpMap = new Map();

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(cors());

const axios = require('axios');

let ipAddress;

// Function to get public IP
const getPublicIP = async () => {
  try {
    const response = await axios.get('https://api64.ipify.org/?format=json');
    ipAddress = response.data.ip;
    console.log('Your public IP address:', ipAddress);
  } catch (error) {
    console.error('Error fetching public IP:', error.message);
  }
};

getPublicIP();

// MySQL connection configuration
const db = mysql.createPool({
  host: '195.179.236.1',
  user: 'u888860508_admin',
  password: '232003@Anbu',
  database: 'u888860508_nirvaagam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkDatabaseConnection() {
  try {
    // Get a connection from the pool
    const connection = await db.getConnection();

    // Check if the connection is successful
    if (connection) {
      console.log('Connected to the database!');
      // Release the connection back to the pool
      connection.release();
    } else {
      console.error('Failed to connect to the database.');
    }
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  }
}
checkDatabaseConnection();


const welcomesendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      // Use your email service provider's configuration here
      service: 'gmail',
      auth: {
        user: 'raghavanofficials@gmail.com',
        pass: 'winp bknr ojez iipm',
      },
    });

    const mailOptions = {
      from: 'noreply@yourdomain.com',
      cc : 'raghavanofficials@gmail.com',
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

// Your /add-user endpoint
app.post('/add-user', async (req, res) => {
  const { name, username, email, password, user_id, role } = req.body;

  try {
    // Check if any field is empty
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Insert the user into the database
    await db.query(
      'INSERT INTO users (name, username, email, password, user_id, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, username, email, password, user_id, role]
    );

    // Send email to the created user
    const emailSubject = 'Welcome to EGSP Nirvaagam App !';
    const emailHtml = `
      <p>Hi ${name},</p>
      <p>Your account has been created successfully with the following details:</p>
      <ul>
        <li>Username: ${username}</li>
        <li>User ID: ${user_id}</li>
        <li>Password: ${password}</li>
      </ul>
      <p>Thank you for joining us!</p>
    `;

    await welcomesendEmail(email, emailSubject, emailHtml);

    res.status(201).json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error.message);
    res.status(500).json({ success: false, message: 'Error adding user' });
  }
});







// Assuming you have an express app (app) and a MySQL pool (db) already defined

app.delete("/delete-user/:userEmail", async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    // First, delete rows from the tickets table
    await db.query("DELETE FROM tickets WHERE assigned_to = ?", [userEmail]);

    // Now, delete the user from the users table
    const result = await db.query("DELETE FROM users WHERE email = ?", [userEmail]);

    console.log("User deleted:", result);
    res.status(201).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});



app.put('/edit-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const updatedUserData = req.body;

  try {
    // TODO: Add logic to update user data in the database
   const result = await db.query('UPDATE users SET ... WHERE id = ?', [userId]);

    console.log('User updated:', result);
    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});


app.post('/create-ticket', async (req, res) => {
  const { title, description, created_by, assigned_to, ticketId } = req.body;

  try {
    // Insert the ticket into the database
    await db.query(
      'INSERT INTO tickets (title, description, status, created_by, assigned_to, ticket_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, 'Open', created_by, assigned_to, ticketId]
    );

    // Get the assigned executive's email from the database
    const [executive] = await db.query('SELECT email, name FROM users WHERE id = ?', [assigned_to]);


    if (executive.length === 1) {
      const executiveEmail = executive[0].email;
      const executiveName = executive[0].name;

      // Send email to the assigned executive
      sendEmail(executiveEmail, ticketId, 'Nirvaagam - New Ticket Created', title, description, executiveName);
    }

    res.status(201).json({ success: true, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating ticket:', error.message);
    res.status(500).json({ success: false, message: 'Error creating ticket' });
  }
});



const sendEmail = async (to, ticketId, subject, title, description, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'raghavanofficials@gmail.com',
        pass: 'winp bknr ojez iipm',
      },
    });

    const mailOptions = {
      from: 'noreply@nirvaagam.egspgroup.in',
      to,
      subject,
      html : `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
      
      <head>
          <meta charset="UTF-8">
          <meta content="width=device-width, initial-scale=1" name="viewport">
          <meta name="x-apple-disable-message-reformatting">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta content="telephone=no" name="format-detection">
          <title></title>
          <!--[if (mso 16)]>
          <style type="text/css">
          a {text-decoration: none;}
          </style>
          <![endif]-->
          <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
          <!--[if gte mso 9]>
      <xml>
          <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      </head>
      
      <body>
          <div dir="ltr" class="es-wrapper-color">
              <!--[if gte mso 9]>
            <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
              <v:fill type="tile" color="#f6f6f6"></v:fill>
            </v:background>
          <![endif]-->
              <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                  <tbody>
                      <tr>
                          <td class="esd-email-paddings" valign="top">
                              <table class="es-content esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                  <tbody>
                                      <tr>
                                          <td class="esd-stripe" align="center">
                                              <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-structure es-p5t es-p20r es-p20l" align="left" bgcolor="#222222" style="background-color: #222222;">
                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="center" class="esd-block-image" style="font-size: 0px;"><a target="_blank" href="https://bumblebees.co.in"><img class="adapt-img" src="https://mcolfw.stripocdn.email/content/guids/CABINET_39254364a214f8068da04f2ed695900b7184bdb10d1b1fcfa5d66b206aab1e38/images/group_12.png" alt="Bumble Bees" style="display: block;" width="560" title="Bumble Bees"></a></td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                              <table class="es-footer" cellspacing="0" cellpadding="0" align="center">
                                  <tbody>
                                      <tr>
                                          <td class="esd-stripe" align="center">
                                              <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-structure es-p20t es-p20r es-p20l" align="left">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="left" class="esd-block-text">
                                                                                              <p style="line-height: 200%; font-size: 20px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><strong>Dear ${name},</strong></p>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td class="esd-block-text">
                                                                                              <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">New ticket created! Please check your dashboard for details</p>
                                                                                              <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Ticket ID : ${ticketId}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <hr>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Ticket Title :</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">{title}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Ticket Description :</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">{description}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Login To your Dashboard</p>
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td align="left" class="esd-block-button es-p10t">
                                                                                              <!--[if mso]><a href="https://egspgroup.in" target="_blank" hidden>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://egspgroup.in" 
                      style="height:46px; v-text-anchor:middle; width:227px" arcsize="50%" stroke="f"  fillcolor="#333333">
          <w:anchorlock></w:anchorlock>
          <center style='color:#ffffff; font-family:"courier new", courier, "lucida sans typewriter", "lucida typewriter", monospace; font-size:16px; font-weight:400; line-height:16px;  mso-text-raise:1px'>Login Nirvaagam</center>
        </v:roundrect></a>
      <![endif]-->
                                                                                              <!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-width: 0px; border-color: #2cb543; background: #333333;"><a href="https://egspgroup.in" class="es-button es-button-1706170304156" target="_blank" style="font-family: &quot;courier new&quot;, courier, &quot;lucida sans typewriter&quot;, &quot;lucida typewriter&quot;, monospace; background: #333333; padding: 15px 20px 10px; mso-border-alt: 10px solid #333333">Login Nirvaagam</a></span>
                                                                                              <!--<![endif]-->
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td class="esd-structure es-p20t es-p20r es-p20l" align="left">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="left" class="esd-block-text">
                                                                                              <p style="font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace; font-size: 16px;">Best regards,</p>
                                                                                              <p style="font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace; font-size: 16px;">Raghavan - Developer ( EGSP Group&nbsp;)</p>
                                                                                              <p style="font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace; font-size: 16px;">Phone : +91 99425 02245</p>
                                                                                              <p style="font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace; font-size: 16px;">2020 - 2024 © EGSP Groups -All rights reserved</p>
                                                                                              <p style="display: none;"><br></p>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                              <table cellpadding="0" cellspacing="0" class="es-content esd-footer-popover" align="center">
                                  <tbody>
                                      <tr>
                                          <td class="esd-stripe" align="center">
                                              <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" width="600">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-structure" align="left">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="600" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="center" class="esd-block-spacer es-p5t es-p5b es-p20r es-p20l" style="font-size: 0px;">
                                                                                              <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td style="border-bottom: 1px solid #cccccc; background:none; height:1px; width:100%; margin:0px 0px 0px 0px;"></td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td class="esd-structure es-p5t es-p20r es-p20l" align="left">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="center" class="esd-block-text">
                                                                                              <p style="font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">This message was sent from EGS Pillay Group, Nagapattinam</p>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td class="esd-structure" align="left">
                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td width="600" class="esd-container-frame" align="center" valign="top">
                                                                              <table cellpadding="0" cellspacing="0" width="100%">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td align="center" class="esd-block-spacer es-p10t es-p10b es-p20r es-p20l" style="font-size: 0px;">
                                                                                              <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td style="border-bottom: 1px solid #cccccc; background:none; height:1px; width:100%; margin:0px 0px 0px 0px;"></td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </body>
      
      </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};






// Assuming you have a route to fetch users
app.get('/executive-users', async (req, res) => {
  try {
    // Fetch users with 'Executive' role from the database
    const [executiveUsers] = await db.query('SELECT id, name FROM users WHERE role = "Executive"');

    res.json(executiveUsers);
  } catch (error) {
    console.error('Error fetching executive users:', error.message);
    res.status(500).json({ error: 'Error fetching executive users' });
  }
});



// Function to send email




app.get('/get-users', async (req, res) => {
  try {
    // Fetch all users from the database
    const [users] = await db.query('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Error fetching users' });
  }
});



const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'raghavanofficials@gmail.com',
    pass: 'winp bknr ojez iipm',
  },
});

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials
  try {
    const [user] = await db.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (user.length === 1) {
      // Generate and store OTP
      const otp = generateOTP();
      storeOTP(email, otp);

      // Send OTP via email
      sendOTPEmail(email, otp);

      // Respond with success
      res.json({ success: true, message: 'OTP sent to email' });
    } else {
      // Respond with failure
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


async function getRoleByEmail(email) {
  try {
    const [user] = await db.query('SELECT role, name, username, email FROM users WHERE email = ?', [email]);

    if (user.length === 1) {
      // Return the user's role and additional information
      return {
        role: user[0].role,
        name: user[0].name,
        username: user[0].username,
        email: user[0].email,
      };
    } else {
      // Handle the case where the user is not found
      console.error('User not found for email:', email);
      return null; // or throw an error, depending on your error-handling strategy
    }
  } catch (error) {
    console.error('Error during getRoleByEmail:', error);
    throw error; // Handle the error appropriately in your application
  }
}

app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Validate OTP
  try {
    const storedOTP = getStoredOTP(email);

    if (storedOTP && !isOTPExpired(storedOTP) && !isOTPUsed(storedOTP, otp)) {
      // Mark the OTP as used
      markOTPAsUsed(storedOTP, otp);

      // Get user role and additional information
      const userRole = await getRoleByEmail(email);

      if (userRole !== null) {
        // OTP verification successful
        res.status(200).json({ success: true, ...userRole }); // Spread userRole object
        console.log(userRole.role + ' Logged In');
      } else {
        // User not found, handle the case appropriately
        res.json({ success: false, message: 'User not found' });
      }
    } else {
      // OTP verification failed
      res.json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




// Function to generate a secure OTP
function generateOTP() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Function to store OTP
const storedOTPs = {};

function storeOTP(email, otp) {
  storedOTPs[email] = { otp, timestamp: Date.now(), used: [] };
}

// Function to retrieve stored OTP
function getStoredOTP(email) {
  return storedOTPs[email];
}

// Function to mark OTP as used
function markOTPAsUsed(storedOTP, otp) {
  storedOTP.used.push(otp);
}

// Function to check if OTP is expired
function isOTPExpired(storedOTP) {
  const currentTime = Date.now();
  const otpTimestamp = storedOTP.timestamp;
  const timeDifference = currentTime - otpTimestamp;
  const otpExpirationTime = 60 * 1000; // 1 minute

  return timeDifference > otpExpirationTime;
}

// Function to check if OTP has been used
function isOTPUsed(storedOTP, otp) {
  return storedOTP.used.includes(otp);
}

// Function to send OTP via email
function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: 'your_email_address',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}



app.listen(port, () => console.log(`Backend server running on port ${port}`));

// Function to send login email asynchronously
const sendLoginEmail = async (name, userEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.egspgroup.in',
      port: 465,
      secure: true,
      auth: {
        user: 'helpdesk@egspgroup.in',
        pass: '232003@Anbu',
      },
    });

    const mailOptions = {
      from: 'noreply@egspgroup.in',
      to: userEmail,
      subject: 'Login to EGSP Groups Nirvaagam Application',
      text: `Dear ${name},\n\nYou have successfully logged in to EGSP Groups Nirvaagam Application.\n\nBest regards,\nEGSP Groups`,
    };

    // Send the email asynchronously
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};
