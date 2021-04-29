const bcrypt = require('bcrypt');
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://web4200:de53zYlMC2bg5lHh@cluster0.8fyqb.mongodb.net/final?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

const audioSchema = mongoose.Schema({
  name: {
    type: String,
  },
  fileName: {
    type: String,
  },
  audioUrl: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String
  }
});

const Audio = mongoose.model('Audio', audioSchema);

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String, 
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  encryptedPassword: {
    type: String,
    required: true
  }
});

userSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.encryptedPassword;
  return obj;
};

userSchema.methods.setEncryptedPassword = function (plainPassword, callback) {
  bcrypt.hash(plainPassword, 12).then(hash => {
    this.encryptedPassword = hash;
    callback();
  });
};

userSchema.methods.verifyPassword = function (plainPassword, callback) {
  bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
    callback(result);
  });
};

const User = mongoose.model('User', userSchema);

module.exports = {
  Audio: Audio,
  User: User
};






