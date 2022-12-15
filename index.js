const functions = require("firebase-functions");
const sendgrid = require("@sendgrid/mail");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

sendgrid.setApiKey(process.env.SEND_GRID_API);

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into 
// Firestore under the path /users/:documentId
exports.addUser = functions.https.onRequest(async (req, res) => {
  
  const data = { name : req.query.name , phone: req.query.phone, email : req.query.email, address:req.query.address };
  // Push the new user into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection(process.env.COLLECTION_NAME).add(data);
  // Send back a user that we've successfully written the user
  res.json({result: `User with ID: ${writeResult.id} added.`});
  //{"result":"User with ID: Pdgo2l8GQdUaWJrKcOfl added."}
});

// Listens for new users added to /users/:documentId/ and creates an
exports.sendMailer = functions.firestore.document('/`${process.env.COLLECTION_NAME}`/{documentId}').onCreate((snap, context) => {
    // Grab the current value of what was written to Firestore.
    const { name, phone, email, address} = snap.data();
    // name: "nakao" email:"takus.superdev@gmail.com" address:"tokyo" phone:"192292929"
    //you can use Sendgrid or Nodemailer...
    //1. Sendgrid
    const msg = {
      to: email, // Change to your recipient
      from: process.env.SENDER, // Change to your verified sender
      subject: "Hi",
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>The HTML5 Herald</title>
          <meta name="description" content="The HTML5 Herald">
          <meta name="author" content="SitePoint">
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
          <link rel="stylesheet" href="css/styles.css?v=1.0">
        </head>
        <body>
          <div class="img-container" style="display: flex;justify-content: center;align-items: center;border-radius: 5px;overflow: hidden; font-family: 'helvetica', 'ui-sans';">
                <div class="container" style="margin-left: 20px;margin-right: 20px;">
                  <h3>${req.body.email}</h3>
                  <div style="font-size: 16px;">  
                    <p>Name:${name}</p>
                    <p>Phone Number:${phone}</p>
                    <p>Address:${address}</p>
                  </div>
                </div>
          </div>
        </body>
        </html>`,
    };
    sendgrid
      .send(msg)
      .then(res.status(200).json("success"))
      .catch((error) => {
        console.error(error);
      });
      
    //2. Nodemailer

    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER,
        pass: "nakao",
      },
    });
    
    let mailDetails = {
      from: process.env.SENDER,
      to: "takus.superdev@gmail.com",
      subject: "Hi",
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>The HTML5 Herald</title>
        <meta name="description" content="The HTML5 Herald">
        <meta name="author" content="SitePoint">
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <link rel="stylesheet" href="css/styles.css?v=1.0">
      </head>
      <body>
        <div class="img-container" style="display: flex;justify-content: center;align-items: center;border-radius: 5px;overflow: hidden; font-family: 'helvetica', 'ui-sans';">
              <div class="container" style="margin-left: 20px;margin-right: 20px;">
                <h3>${req.body.email}</h3>
                <div style="font-size: 16px;">  
                  <p>Name:${name}</p>
                  <p>Phone Number:${phone}</p>
                  <p>Address:${address}</p>
                </div>
              </div>
        </div>
      </body>
      </html>`,
    };
    
    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent successfully");
      }
    });
    
});