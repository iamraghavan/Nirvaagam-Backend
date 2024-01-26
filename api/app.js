const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const randomize = require('randomatic');

const cors = require('cors');

const app = express();
const port = 4000;



// Enable CORS for all routes
app.use(cors());

// Create a MySQL connection
const db = mysql.createConnection({
  host: '195.179.236.1',
  user: 'u888860508_admin',
  password: '232003@Anbu',
  database: 'u888860508_nirvaagam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.use(bodyParser.json());

// Placeholder to store generated OTPs (for demonstration purposes)
const storedOTPs = {}; // Define storedOTPs

// Endpoint for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Query to check if the email and password match in the database
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing login query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length > 0) {
      // If the user exists, generate and send an OTP
      const otp = randomize('0', 6);
      storedOTPs[email] = otp; // Store the OTP

      sendOtpEmail(email, otp);

      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Function to send OTP via email
function sendOtpEmail(email, otp) {
  // Configure nodemailer with your email provider settings
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'raghavanofficials@gmail.com',
      pass: 'winp bknr ojez iipm',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Login OTP',
    text: `Your OTP for login is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending OTP email: ', err);
    } else {
      console.log('Email sent: ', info.response);
    }
  });
}

// Endpoint for OTP verification
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  // Retrieve stored OTP for the given email
  const storedOTP = storedOTPs[email];

  if (storedOTP && storedOTP === otp) {
    // If OTP is valid, you can perform additional actions here
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
