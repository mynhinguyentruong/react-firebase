const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();



const config = {
  apiKey: "AIzaSyDEi-vqRMHtm2zx8FZ31gumSCyN6QlkPlc",
  authDomain: "socialape-417c5.firebaseapp.com",
  projectId: "socialape-417c5",
  storageBucket: "socialape-417c5.appspot.com",
  messagingSenderId: "158940384440",
  appId: "1:158940384440:web:a8737cb5faa05b919bf84d",
  measurementId: "G-NR7H6YH8HR"
};

const firebase = require('firebase');
firebase.initializeApp(config);

app.get('/screams', (req, res) => {
    admin
    .firestore()
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = []
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data()
        })
      })
      return res.json(screams)
    })
    .catch(err => console.log(err)) 

})
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// app.listen(8000)

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

app.post('/scream', (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle, 
    createdAt: new Date().toISOString()
  }

  admin.firestore().collection('screams').add(newScream).then(doc => {
    res.json({message: `document ${doc.id} created successfully`})
    .catch(err => {
      res.status(500).json({error: 'something went wrong'})
      console.error(err)
    })
  })
})

// Create Sign Up route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }
})

// https://baseurl.com/api/

exports.api = functions.https.onRequest(app)