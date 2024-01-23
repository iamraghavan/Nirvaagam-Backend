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

    // Store login information in the database
    const userId = user[0].id;
    const loginTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const ipAddressForLogin = ipAddress;

    // Insert the login information into the database
    await db.query(
      'INSERT INTO login_history (user_id, login_time, last_login_time, ip_address) VALUES (?, ?, ?, ?)',
      [userId, loginTime, loginTime, ipAddressForLogin]
    );

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
    host: 'nirvaagam.egspgroup.in',
    port: 465,
    secure: true,
    auth: {
      user: 'noreply@nirvaagam.egspgroup.in',
      pass: '232003@Anbu',
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
