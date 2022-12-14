let db = {
  users: [
    {
      userId: "jRo791ePFVPBFt5POOhM3RRTBSn1",
      email: "user@gmail.com",
      handle: "user",
      createdAt: "2022-08-24T19:00:20.520Z",
      imgageUrl: "",
      bio: "",
      website: "",
      location: ""
    }
  ],
  screams: [
    {
      userHandle: 'user',
      body: 'this is scream body',
      createdAt: '2022-08-24T14:29:43.948Z',
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments: [
    {
      userHandle: 'user',
      screamId: "",
      body: "comment it here",
      createdAt: "2022-08-24T19:00:20.520Z"
    }
  ],
  notifications: [
    {
      recipient: 'user',
      sender: 'john',
      read: 'true | false',
      screamId: 'kdjsfgdksuufhgkdsufky',
      type: 'like | comment',
      createdAt: '2019-03-15T10:59:52.798Z'
    }
  ]
}

const userDetails = {
  // Redux data
  credentials: {
    userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
    email: 'user@email.com',
    handle: 'user',
    createdAt: '2019-03-15T10:59:52.798Z',
    imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
    bio: 'Hello, my name is user, nice to meet you',
    website: 'https://user.com',
    location: 'Lonodn, UK'
  },
  likes: [
    {
      userHandle: 'user',
      screamId: 'hh7O5oWfWucVzGbHH2pa'
    },
    {
      userHandle: 'user',
      screamId: '3IOnFoQexRcofs5OhBXO'
    }
  ]
};