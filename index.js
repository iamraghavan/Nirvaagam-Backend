const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
 // Import express-session
const moment = require('moment');
const nodemailer = require('nodemailer');

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


app.post("/add-user", (req, res) => {
  const user = req.body;

  // Insert the user into the database
  const sql = "INSERT INTO `users` SET ?";
  db.query(sql, user, (err, result) => {
    if (err) {
      console.error("Error adding user:", err);
      res.json({ success: false, error: "Failed to add user" });
    } else {
      console.log("User added:", result);
      res.status(201).json({ success: true, message: "User added successfully" });
    }
  });
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

app.post('/create-ticket', async (req, res) => {
  const { title, description, created_by, assigned_to, ticketId } = req.body;

  try {
    // Insert the ticket into the database
    await db.query(
      'INSERT INTO tickets (title, description, status, created_by, assigned_to, ticket_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, 'Open', created_by, assigned_to, ticketId]
    );

    // Get the assigned executive's email from the database
    const [executive] = await db.query('SELECT email FROM users WHERE id = ?', [assigned_to]);

    if (executive.length === 1) {
      const executiveEmail = executive[0].email;
      const executiveName = executive[0].name;

      // Send email to the assigned executive
      sendEmail(executiveEmail, `Nirvaagam - New Ticket Created ${name}  Assign the Tickets to Supervisor`, `A new ticket (${ticketId}) has been assigned to you.`);
    }

    res.status(201).json({ success: true, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating ticket:', error.message);
    res.status(500).json({ success: false, message: 'Error creating ticket' });
  }
});

// Function to send email
const sendEmail = async (to, subject, text) => {
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
      html : `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
          <!--[if gte mso 9]>
          <xml>
              <o:OfficeDocumentSettings>
              <o:AllowPNG/>
              <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
          <title>Ticket Created</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Manrope', sans-serif; min-height: 100vh; background: #EBFAFA;">
          <center>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #EBFAFA;">
                  <tbody>
                      <tr>
                          <td align="center">
                              <table width="690" border="0" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td style="padding: 35px;">
                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                  <tbody>
                                                      <tr>
                                                          <td style="border-radius: 8px;" bgcolor="#ffffff">
                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td>
                                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td style="text-align:center; padding: 70px 15px 32px;">
                                                                                              <a href="#" target="_blank">
                                                                                                  <img src="https://kurudhi-assets.s3.ap-south-1.amazonaws.com/logo-dark.svg" border="0" alt="Logo">
                                                                                              </a>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td style="font-size:28px; line-height:40px; font-weight: bold; color:#2D3436; min-width:auto !important; text-align:center; letter-spacing: -0.02em; padding-bottom: 16px;">
                                                                                              Ticket Created
                                                                                              <br>
                                                                                              <span style="font-size: 18px; color: #636E72;">Ticket ID: ${ticketId}</span>
                                                                                          </td>
                                                                                      </tr>


                                                                                      <td align="center" style="padding-bottom: 32px;">
                                                                                                <table border="0" cellspacing="0" cellpadding="0" style="min-width: 200px;">
                                                                                                    <tbody><tr>
                                                                                                        <td style="font-size:14px; line-height:16px; text-align:center; min-width:auto !important;">
                                                                                                            <a href="#" target="_blank" style="color:#0010F7; background: #ffffff; border: 1px solid #0010F7; border-radius:8px; display: block; padding: 12px 22px; text-decoration:none;">
                                                                                                                Login Nirvaagam
                                                                                                            </a>
                                                                                                        </td>

                                                                                                        
                                                                                                    </tr>
                                                                                                </tbody></table>
                                                                                            </td>
                                                                                     
                                                                                      <tr>
                                                                                          <td style="padding: 0 45px;">
                                                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td style="padding-bottom: 22px;">
                                                                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                                                                  <tbody>
                                                                                                                      <tr>
                                                                                                                          <td style="text-align:center; padding-bottom: 32px;">
                                                                                                                              <!-- Your ticket details or additional content here -->
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
                                                                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td style="border-top: 1px solid #DFE6E9; min-width:auto !important; text-align:center; padding-top: 32px;">
                                                                                              <img src="https://kurudhi-assets.s3.ap-south-1.amazonaws.com/logo-dark.svg" border="0" alt="Logo">
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                          <td style="font-size:12px; color:#B2BEC3; min-width:auto !important; line-height: 12px; text-align:center; padding-top: 32px;">
                                                                                              EGSP Groups | Nivraagam Application
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
          </center>
      </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};




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





// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials
  const [user] = await db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password]
  );

  if (user.length === 1) {
    const role = user[0].role;
    const name = user[0].name;
    const username = user[0].username;

    // Show browser alert
    res.json({ success: true, name, role, username });

    

    // Send login email asynchronously
    sendLoginEmail(name, user[0].email);
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

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
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error.message);
      res.status(500).json({ success: false, message: 'Error sending email' });
    } else {
      console.log('Email sent:', info.response);
      res.json({ success: true, message: 'Email sent successfully' });
    }
  });
});




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
