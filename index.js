const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const cors = require("cors");
// Import express-session
const moment = require("moment");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const randomize = require("randomatic");

const otpMap = new Map();

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(cors());

const axios = require("axios");

let ipAddress;

// Function to get public IP
const getPublicIP = async () => {
  try {
    const response = await axios.get("https://api64.ipify.org/?format=json");
    ipAddress = response.data.ip;
    console.log("Your public IP address:", ipAddress);
  } catch (error) {
    console.error("Error fetching public IP:", error.message);
  }
};

getPublicIP();

// MySQL connection configuration
const db = mysql.createPool({
  host: "195.179.236.1",
  user: "u888860508_admin",
  password: "232003@Anbu",
  database: "u888860508_nirvaagam",
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
      console.log("Connected to the database!");
      // Release the connection back to the pool
      connection.release();
    } else {
      console.error("Failed to connect to the database.");
    }
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
}
checkDatabaseConnection();

app.get("/ticket-stats", async (req, res) => {
  try {
    // Fetch ticket stats from the database
    const [stats] = await db.query(
      'SELECT COUNT(*) AS totalTickets, SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) AS completedTickets, SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) AS pendingTickets FROM tickets'
    );

    const { totalTickets, completedTickets, pendingTickets } = stats[0];

    res.json({ totalTickets, completedTickets, pendingTickets });
  } catch (error) {
    console.error("Error fetching ticket stats:", error.message);
    res.status(500).json({ error: "Error fetching ticket stats" });
  }
});


app.get("/ex-ticket-stats", async (req, res) => {
    try {
      // Fetch ticket stats from the database
      const [stats] = await db.query(
        'SELECT COUNT(*) AS totalTickets, SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) AS completedTickets, SUM(CASE WHEN status = "pen" THEN 1 ELSE 0 END) AS pendingTickets FROM product_requests'
      );
  
      const { totalTickets, completedTickets, pendingTickets } = stats[0];
  
      res.json({ totalTickets, completedTickets, pendingTickets });
    } catch (error) {
      console.error("Error fetching ticket stats:", error.message);
      res.status(500).json({ error: "Error fetching ticket stats" });
    }
  });
  


  

app.get("/tickets/:ticketId", async (req, res) => {
  try {
    // Extract the ticketId from the request parameters
    const { ticketId } = req.params;
console.log(ticketId);
    // Query the database to fetch the ticket with the given ID
    const [ticket] = await db.query(
      'SELECT * FROM tickets WHERE ticket_id = ?',
      [ticketId],
    );
console.log(ticket);
    // Check if the ticket was not found
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // If the ticket is found, send it in the response
    res.json(ticket);
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching ticket:", error.message);
    res.status(500).json({ error: "Error fetching ticket" });
  }
});

// Assuming you have an Express app instance named 'app'






// Assuming you have configured your email transport


app.post('/update-ticket-status/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { newStatus } = req.body;

    console.log('Updating ticket status:', ticketId, newStatus);

    // Update the ticket status in the database
    const [result] = await db.query(
      'UPDATE tickets SET status = ? WHERE ticket_id = ?',
      [newStatus, ticketId]
    );

    if (result.affectedRows > 0) {
      // If the status is 'closed', send an email
      if (newStatus === 'closed') {
        const [ticketDetails] = await db.query(
          'SELECT * FROM tickets WHERE ticket_id = ?',
          [ticketId]
        );

        // Check if ticketDetails is found
        if (ticketDetails.length === 0) {
          res.status(404).json({ success: false, message: 'Ticket not found' });
          return; // Important: Return to avoid sending multiple responses
        }

        // Fetch assigned_by user email from users table
        const [assignedByUser] = await db.query(
          'SELECT email FROM users WHERE name = ?',
          [ticketDetails[0].created_by]
        );

        console.log('Assigned by user:', assignedByUser);

        const mailOptions = {
          from: 'your-email@gmail.com',
          to: assignedByUser[0].email,
          subject: 'Ticket Closed',
          text: `Ticket ${ticketId} has been closed successfully.`
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      }

      res.status(200).json({ success: true, message: 'Ticket status updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Ticket not found' });
    }
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

  
  

app.get("/store-managers", async (req, res) => {
  try {
    // Fetch users with 'Store Manager' role from the database
    const [storeManagerUser] = await db.query(
      'SELECT id, name FROM users WHERE role = "store"'
    );

    console.log(storeManagerUser);

    res.json(storeManagerUser);
  } catch (error) {
    console.error("Error fetching store managers:", error.message);
    res.status(500).json({ error: "Error fetching store managers" });
  }
});




  



app.post('/unlock-user', async (req, res) => {
    console.log('Unlock endpoint called');
    const { email, password } = req.body;
  
    try {
      // Query the database for email and password verification
      const [rows] = await db.execute('SELECT role FROM users WHERE email = ? AND password = ?', [email, password]);
  
      if (rows.length === 0) {
        console.log('Invalid credentials');
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        const role = rows[0].role;
        console.log('User role:', role);
        res.status(200).json({ role });
      }
    } catch (error) {
      console.error('Error during database query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  


const welcomesendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      // Use your email service provider's configuration here
      service: "gmail",
      auth: {
        user: "raghavanofficials@gmail.com",
        pass: "winp bknr ojez iipm",
      },
    });

    const mailOptions = {
      from: "noreply@yourdomain.com",
      cc: "raghavanofficials@gmail.com",
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

// Your /add-user endpoint
app.post("/add-user", async (req, res) => {
  const { name, username, email, password, user_id, role } = req.body;

  try {
    // Check if any field is empty
    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Insert the user into the database
    await db.query(
      "INSERT INTO users (name, username, email, password, user_id, role) VALUES (?, ?, ?, ?, ?, ?)",
      [name, username, email, password, user_id, role],
    );

    // Send email to the created user
    const emailSubject = "Welcome to EGSP Nirvaagam App !";
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

    res.status(201).json({ success: true, message: "User added successfully" });
  } catch (error) {
    console.error("Error adding user:", error.message);
    res.status(500).json({ success: false, message: "Error adding user" });
  }
});

// Assuming you have an express app (app) and a MySQL pool (db) already defined

app.delete("/delete-user/:userEmail", async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    // First, delete rows from the tickets table
    await db.query("DELETE FROM tickets WHERE assigned_to = ?", [userEmail]);

    // Now, delete the user from the users table
    const result = await db.query("DELETE FROM users WHERE email = ?", [
      userEmail,
    ]);

    console.log("User deleted:", result);
    res
      .status(201)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});
app.delete('/delete-ticket/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
  
    try {
      // Fetch assigned person details from the users table
      const [[{ email: assignedPersonEmail }]] = await db.query('SELECT email FROM users WHERE id = (SELECT assigned_to FROM tickets WHERE ticket_id = ?)', [ticketId]);
  
      console.log("User deleted. Assigned person email:", assignedPersonEmail);
  
      if (!assignedPersonEmail) {
        console.error('Assigned person email is null or undefined.');
        res.status(500).json({ success: false, error: 'Assigned person email is null or undefined' });
        return;
      }
  
      console.log('Deleting ticket with ID:', ticketId);
      const result = await db.query('DELETE FROM tickets WHERE ticket_id = ?', [ticketId]);
      console.log('Ticket deleted:', result);
  
      // Send email to assigned person
      await transporter.sendMail({
        from: 'your-email@gmail.com',
        to: assignedPersonEmail,
        subject: 'Ticket Deletion Notification',
        text: 'Your assigned work has been deleted or canceled by the controller.',
      });
  
      res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Error deleting Ticket:', error);
      res.status(500).json({ success: false, error: 'Failed to delete Ticket' });
    }
  });
  
  
  

app.put("/edit-user/:userId", async (req, res) => {
  const userId = req.params.userId;
  const updatedUserData = req.body;

  try {
    // TODO: Add logic to update user data in the database
    const result = await db.query("UPDATE users SET ... WHERE id = ?", [
      userId,
    ]);

    console.log("User updated:", result);
    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});



  

app.post('/create-ticket', async (req, res) => {
  const { title, description, name, assigned_to, priority, due_date, location, ticketId } = req.body;

  try {
    // Insert the ticket into the database
    await db.query(
      'INSERT INTO tickets (title, description, status, created_by, assigned_to, priority, due_date, location, ticket_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, 'open', name, assigned_to, priority, due_date, location, ticketId],
    );

    // Get the assigned executive's email from the database
    const [executive] = await db.query(
      'SELECT email, name FROM users WHERE id = ?',
      [assigned_to],
    );

    if (executive.length === 1) {
      const executiveEmail = executive[0].email;
      const executiveName = executive[0].name;

      // Send email to the assigned executive
      sendEmail(
        executiveEmail,
        ticketId,
        'Nirvaagam - New Ticket Created',
        title,
        description,
        executiveName,
      );
    }

    res.status(201).json({ success: true, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating ticket:', error.message);
    res.status(500).json({ success: false, message: 'Error creating ticket' });
  }
});


app.post('/product-requests', async (req, res) => {
  const { product_name, quantity, created_by, store_assigned_to, productRequestId } = req.body;

  try {
    // Insert the product request into the database
    await db.query(
      'INSERT INTO product_requests (product_name, created_by, product_request_id, store_assigned_to, status) VALUES (?, ?, ?, ?, ?)',
      [product_name, created_by, productRequestId, store_assigned_to, 'open']
    );
console.log("Product Request Created")
    // Get the assigned executive's email from the database (assuming you have a 'users' table)
    const [executive] = await db.query(
      'SELECT email, name FROM users WHERE id = ?',
      [store_assigned_to]
    );

    if (executive.length === 1) {
      const executiveEmail = executive[0].email;
      const executiveName = executive[0].name;
let subject;
      // Assuming you have a function to send email
      sendEmailTemp(
        executiveEmail,
        product_name,
        subject = 'Nirvaagam - New Ticket Created 2',
        
        productRequestId,
        executiveName,
      );
    }

    res.status(201).json({ success: true, message: 'Product request created successfully' });
  } catch (error) {
    console.error('Error creating product request:', error.message);
    res.status(500).json({ success: false, message: 'Error creating product request' });
  }
});


const sendEmailTemp = async (to, product_name, subject, productRequestId, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "raghavanofficials@gmail.com",
        pass: "winp bknr ojez iipm",
      },
    });

    const mailOptions = {
      from: "noreply@nirvaagam.egspgroup.in",
      to,
      subject,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                                                                                              <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Product Reqeust ID : ${productRequestId}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <hr>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Product Details</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">${product_name}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>

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
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};


const sendEmail = async (to, ticketId, subject, title, description, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "raghavanofficials@gmail.com",
        pass: "winp bknr ojez iipm",
      },
    });

    const mailOptions = {
      from: "noreply@nirvaagam.egspgroup.in",
      to,
      subject,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">${title}</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Ticket Description :</p>
                                                                                              <p style="text-align: justify; font-size: 16px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">${description}</p>
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
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

// Assuming you have a route to fetch users
app.get("/executive-users", async (req, res) => {
  try {
    // Fetch users with 'Executive' role from the database
    const [executiveUsers] = await db.query(
      'SELECT id, name FROM users WHERE role = "Executive"',
    );

    res.json(executiveUsers);
  } catch (error) {
    console.error("Error fetching executive users:", error.message);
    res.status(500).json({ error: "Error fetching executive users" });
  }
});

app.get("/as-executive-users", async (req, res) => {
    try {
      // Fetch users with 'Executive' role from the database
      const [controllerexecutiveUsers] = await db.query(
        'SELECT id, name FROM users WHERE role = "controller"',
      );
  
      res.json(controllerexecutiveUsers);
    } catch (error) {
      console.error("Error fetching executive users:", error.message);
      res.status(500).json({ error: "Error fetching executive users" });
    }
  });

// Function to send email

app.get("/get-users", async (req, res) => {
  try {
    // Fetch all users from the database
    const [users] = await db.query("SELECT * FROM users");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Error fetching users" });
  }
});


app.get("/get-ticket", async (req, res) => {
    try {
      // Fetch all users from the database
      const [tickets] = await db.query("SELECT * FROM tickets");
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  app.get("/get-product-status", async (req, res) => {
    try {
      // Fetch all users from the database
      const [tickets] = await db.query("SELECT * FROM product_requests");
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      res.status(500).json({ error: "Error fetching users" });
    }
  });

const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "raghavanofficials@gmail.com",
    pass: "winp bknr ojez iipm",
  },
});

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Define storedOTPs
const storedOTPs = {};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query to check if the email and password match in the database
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    const [results] = await db.query(query, [email, password]);

    if (results.length > 0) {
      // If the user exists, generate and send an OTP
      const otp = randomize("0", 6);
      storedOTPs[email] = otp; // Store the OTP

      sendOtpEmail(email, otp);

      // Send a response indicating successful login
      res.status(200).json({ success: true });
    } else {
      // Send a response for invalid credentials
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    // Log the error and send a more detailed error response
    console.error("Error executing login query:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// Function to send OTP via email
function sendOtpEmail(email, otp) {
  // Configure nodemailer with your email provider settings
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "raghavanofficials@gmail.com",
      pass: "winp bknr ojez iipm",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Login OTP From Nirvaagam Application ",
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
                                                                                            <p style="line-height: 200%; font-size: 20px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><strong>Dont Share the OTP to Anyone</strong></p>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td class="esd-block-text">
                                                                                            <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Your One Time Password for Login</p>
                                                                                            <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                            <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">OTP : ${otp}</p>
                                                                                            <p style="text-align: justify; font-size: 19px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;"><br></p>
                                                                                            <p style="text-align: justify; font-size: 15px; font-family: 'courier new', courier, 'lucida sans typewriter', 'lucida typewriter', monospace;">Use this OTP to complete your login process.</p>
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
    
    </html>`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending OTP email: ", err);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
}

// Endpoint for OTP verification
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  // Retrieve stored OTP for the given email
  const storedOTP = storedOTPs[email];

  const userRole = await getRoleByEmail(email);

  if (storedOTP && storedOTP === otp) {
    // If OTP is valid, you can perform additional actions here
    res
      .status(200)
      .json({
        success: true,
        message: "OTP verified successfully",
        ...userRole,
      });
    sendLoginEmail();
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

async function getRoleByEmail(email) {
  try {
    const [user] = await db.query(
      "SELECT role, name, username, email FROM users WHERE email = ?",
      [email],
    );

    if (user.length === 1) {
      return {
        role: user[0].role,
        name: user[0].name,
        username: user[0].username,
        email: user[0].email,
      };
    } else {
      console.error("User not found for email:", email);
      return null;
    }
  } catch (error) {
    console.error("Error during getRoleByEmail:", error);
    throw error;
  }
}

app.listen(port, () => console.log(`Backend server running on port ${port}`));

// Function to send login email asynchronously
const sendLoginEmail = async (name, userEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.egspgroup.in",
      port: 465,
      secure: true,
      auth: {
        user: "helpdesk@egspgroup.in",
        pass: "232003@Anbu",
      },
    });

    const mailOptions = {
      from: "noreply@egspgroup.in",
      to: userEmail,
      subject: "Login to EGSP Groups Nirvaagam Application",
      text: `Dear ${name},\n\nYou have successfully logged in to EGSP Groups Nirvaagam Application.\n\nBest regards,\nEGSP Groups`,
    };

    // Send the email asynchronously
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};
