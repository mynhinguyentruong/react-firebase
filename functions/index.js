const functions = require("firebase-functions");


const express = require('express');
const app = express();
const cors = require('cors')
app.use(cors())

const { db, admin } = require('./utils/admin')


const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')
const { uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users')

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

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream',FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);

app.delete('/scream/:screamId', FBAuth, deleteScream);

app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.post('/scream/:screamId', FBAuth, commentOnScream);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// app.listen(8000)

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Middleware function
function FBAuth(req, res, next) {
  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No token found')
    return res.status(403).json({ error: 'You must provide a valid token' })
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return admin.firestore().collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      req.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    })
    .catch(err => {
      console.error('Error while verifying token', err);
      return res.status(403).json(err);
    })
}


// Post one scream


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

  const noImg = `no-img.png`;

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
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/socialape-417c5.appspot.com/o/${noImg}?alt=media`,
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

app.post('/user', FBAuth, addUserDetails);
app.post('/user/image', FBAuth, uploadImage);

app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);

app.post('/notifications', FBAuth, markNotificationsRead)

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app)

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{docId}')
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      })
      
  })

exports.createNotificationOnLike = functions.firestore.document('likes/{docId}')
  .onCreate(snapshot => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
      .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type:  'like',
              read: false,
              screamId: doc.id
        })}
      })
      .catch(err => {console.error(err);})
  })

exports.createNotificationOnComment = functions.firestore.document('comments/{docId}')
  .onCreate(snapshot => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
      .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type:  'comment',
              read: false,
              screamId: doc.id
        })}
      })
      .catch(err => {
        console.error(err);
        return;
      })
  })

exports.onUserImageChange = functions.firestore.document('users/{userId}')
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
      .collection('screams')
      .where('userHandle', '==', change.before.data().handle)
      .get()
      .then(data => {
        data.forEach(doc => {
          const scream = db.doc(`/screams/${doc.id}`);
          batch.update(scream, { userImage: change.after.data().imageUrl});
        });
        return batch.commit()
      })
    }
    
  })

exports.onScreamDelete = functions.firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then(data => {
        data.forEach(doc => batch.delete(db.doc(`/comments/${doc.id}`)))
        return db.collection('likes').where('screamId', '==', screamId).get();
      })
      .then(data => {
        data.forEach(doc => batch.delete(db.doc(`/likes/${doc.id}`)))
        return db.collection('notifications').where('screamId', '==', screamId).get();
      })
      .then(data => {
        data.forEach(doc => batch.delete(db.doc(`/notifications/${doc.id}`)));
        return batch.commit();
      })
      .catch(err => console.error(err))
  })