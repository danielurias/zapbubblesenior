const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const cors = require('cors');
const model = require('./model');

const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');

var app = express();
app.set('port', (process.env.PORT || 8080));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors({ credentials: true, origin: 'null' }));

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

aws.config.update({
  accessKeyId: "AKIAIEDVJZ5Z43PCONCQ",
  secretAccessKey: "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",
  region: 'us-west-1'
});

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'zapbubble',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        fileName: file.originalname
      });
    },
    key: function (req, file, cb) {
      let path = `${Date.now()}-${file.originalname}`;
      cb(null, path);
    }
  })
});

const singleUpload = upload.single('audio');

passport.use(new passportLocal.Strategy({
  usernameField: "userName",
  passwordField: "plainPassword"
}, function (userName, plainPassword, done) {
  model.User.findOne({userName: userName}).then(function (user) {
    if (!user) {
      done(null, false);
      return;
    }
    
    user.verifyPassword(plainPassword, function (result) {
      if (result) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }).catch(function (err) {
    done(err);
  });
}));

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (userId, done) {
  model.User.findOne({ _id: userId}).then(function (user) {
    done(null, user);
  }).catch(function (err) {
    done(err);
  });
});

app.post("/session", passport.authenticate("local"), function (req, res) {
  res.sendStatus(201);
});

app.get("/session", function (req, res) {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
});

app.delete('/session', function (req, res) {
  req.logout();
  res.sendStatus(200);
});

app.get('/posts/:postId', (req, res) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  var filter = {
    user: req.user._id
  };

  model.Audio.findOne({ _id: req.params.postId }, filter).then((audio) => {
    if (audio) {
      res.json(audio);
    } else {
      res.sendStatus(404);
    }
  }).catch((err) => {
    res.sendStatus(400);
  })
})

app.get('/public', (req, res) => {
  model.Audio.find().then((audios) => {
    console.log("files listed from DB:", audios);
    res.json(audios);
  });
});

app.get('/posts', (req, res) => {

  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  var filter = {
    user: req.user._id
  };

  model.Audio.find(filter).then((audios) => {
    console.log("files listed from DB:", audios);
    res.json(audios);
  });
});

app.delete('/posts/:postId', (req, res) => {
  
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  model.Audio.findOneAndDelete({ _id: req.params.postId, user: req.user._id }).then((audio) => {
      if (audio) {
          res.json(audio)
          console.log("File deleted")
      } else {
          res.sendStatus(403);
      }
  })
});

app.post('/posts', (req, res) => {

  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  singleUpload(req, res, function (err) {
    if (err) { 
      console.error('Error occurred:', err);
      return res.sendStatus(422);
    }

    var audio = new model.Audio({
      name: req.body.name,
      fileName: req.file.originalname,
      audioUrl: req.file.location,
      user: req.user._id,
      date: req.body.date
    });

    audio.save().then((audio) => {
      console.log('Entry created');
      res.status(201).json(audio);
    }).catch(function (err) {
      if (err.errors) {
        var messages = {};
        for (var e in err.errors) {
          messages[e] = err.errors[e].message;
        }
        res.status(422).json(messages);
      } else {
        res.sendStatus(500);
      }
    });
    console.log('Save to DB:', {
      name: req.body.name,
      fileName: req.file.originalname,
      audioUrl: req.file.location,
      user: req.user._id,
      date: req.body.date
    });
  });
});

app.post('/users', (req, res) => {
  console.log(req.body);
  var user = new model.User({
    userName: req.body.userName,
    firstName: req.body.firstName,
    lastName: req.body.lastName
  });

  user.setEncryptedPassword(req.body.plainPassword, function () {
    user.save().then((user) => {
      console.log('User created');
      res.status(201).json(user);
    }).catch(function (err) {
      if (err.errors) {
        var messages = {};
        for (var e in err.errors) {
          messages[e] = err.errors[e].message;
        }
        res.status(422).json(messages);
      } else if (err.code == 11000) {
        console.log('Erorer:', err);
        res.status(422).json({
          userName: "Already registered"
        });
      } else {
        res.sendStatus(500);
        console.log("Unkown error:", err);
      }
    });
  });
});

app.listen(app.get('port'), function () {
  console.log('Server is ready and listening.');
});

