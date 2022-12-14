const busboy = require('busboy');
const { db, admin } = require('../utils/admin')

const { reduceUserDetails } = require('../utils/validators')

// const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
// const auth = getAuth()

// exports.signup = (req, res) => {
//   const newUser = {
//     email: req.body.email,
//     password: req.body.password,
//     confirmPassword: req.body.confirmPassword,
//     handle: req.body.handle
//   };

//   let errors = {};

//   if (isEmpty(newUser.email)) {
//     errors.email = 'Email must not be enpty'
//   } else if (!isEmail(newUser.email)) {
//     errors.email = 'Must be valid'
//   }

//   if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
//   if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'

//   if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

//   if (Object.keys(errors).length > 0) return res.status(400).json(errors)

//   let token, userId;
//   // TODO: validate data
//   createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
//     .then(data => {
//       userId = data.user.uid;
//       return data.user.getIdToken();
//     })
//     .then(idToken => {
//       token = idToken;
//       const userCredentials = {
//         ...newUser,
//         createdAt: new Date().toISOString(),
//         userId
//       };
//       return db.doc(`/users/${newUser.handle}`).set(userCredentials);
//     })
//     .then(() => res.status(201).json({ token }))
//     .catch(err => {
//       console.error(err);
//       if (err.code === 'auth/email-already-in-use') {
//         return res.status(400).json({ email: 'Email is already in use'})
//       }
//       return res.status(500).json({ error: err.code});
//     })
// }



// Add user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`users/${req.user.handle}`).update(userDetails)
    .then(() => res.json({ message: "User details added successfully"}))
    .catch(err => {
      console.error(err);
      return  res.status(500).json({ error: err.code })
    })
}

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db.collection('likes').where('userHandle', '==', req.user.handle).get();
      }
    })
    .then(data => {
      userData.likes = [];
      data?.forEach(doc => userData.likes.push(doc.data));
      return db
        .collection('notifications')
        .where('recipient', '==', req.user.handle)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    })
    .then(data => {
      userData.notifications = [];
      data.forEach(doc => {
        userData.notifications.push({
          ...doc.data(),
          notificationId: doc.id
        })
      })
      return res.json(userData)
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code })
    })
}

//Get any user's details
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        userData = doc.data();
        return db.collection('screams').where('userHandle', '==', req.params.handle)
          .orderBy('createdAt', 'desc')
          .get()
      } else return res.status(404).json({ error: 'User not found' })
    })
    .then(data => {
      userData.screams = [];
      data.forEach(doc => userData.screams.push({
        ...doc.data(),
        screamId: doc.id
      }))
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    })
}

// Upload a profile image for user
exports.uploadImage = (req, res) => {
  // const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  console.log(bb)
  // const busboy = new BusBoy({ headers: req. headers});

  let imageFileName;
  let imageToBeUploaded = {};

  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
   
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    imageFileName = `${Math.round(Math.random()*1000000000000)}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimeType};
    file.pipe(fs.createWriteStream(filepath));
  })

  bb.on('finish', () => {
    admin.storage().bucket().upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: imageToBeUploaded.mimeType
        }
      }
    })
    .then(() => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/socialape-417c5.appspot.com/o/${imageFileName}?alt=media`
      return db.doc(`/users/${req.user.handle}`).update({ imageUrl});
    })
    .then(() => {
      return res.json({ message: 'Image uploaded successfully'});
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code});
    });
  });
  bb.end(req.rawBody);
}

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach(notifId => {
    const notification = db.doc(`/notifications/${notifId}`);
    batch.update(notification, { read: true });
  });
  batch.commit()
    .then(() => res.json({ message: 'Notifications marked read'}))
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code })
    })
}