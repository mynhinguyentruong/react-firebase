const { db } = require('../utils/admin')

const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth()

exports.signup = (req, res) => {
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
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email is already in use'})
      }
      return res.status(500).json({ error: err.code});
    })
}