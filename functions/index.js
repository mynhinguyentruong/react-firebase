const functions = require("firebase-functions");

const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const app = express();

const firebase = require('firebase/app');



const config = {
  apiKey: "AIzaSyDEi-vqRMHtm2zx8FZ31gumSCyN6QlkPlc",
  authDomain: "socialape-417c5.firebaseapp.com",
  projectId: "socialape-417c5",
  storageBucket: "socialape-417c5.appspot.com",
  messagingSenderId: "158940384440",
  appId: "1:158940384440:web:a8737cb5faa05b919bf84d",
  measurementId: "G-NR7H6YH8HR"
};


firebase.initializeApp(config);

const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth()

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

function isEmpty(string) {
  if (string.trim() === '') return true;
  return false;
}

function isEmail(email) {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  return false;
}

// Create Sign Up route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = 'Email must not be enpty'
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be valid'
  }

  if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'

  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

  if (Object.keys(errors).length > 0) return res.status(400).json(errors)

  let token, userId;
  // TODO: validate data
  createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        ...newUser,
        createdAt: new Date().toISOString(),
        userId
      };
      return admin.firestore().doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email is already in use'})
      }
      return res.status(500).json({ error: err.code});
    })
})

app.post('/login', (req, res) => {
  signInWithEmailAndPassword(auth, req.body.email, req.body.password)
    .then(userCredentials => {
      const user = userCredentials.user;
      return userCredentials.user.getIdToken();
    })
    .then(token => res.json({token}))
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        return res.status(403).json({ general: "Wrong credentials, please try again"})
      }
      return res.status(500).json({ error: err.code})
    })
})

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app)