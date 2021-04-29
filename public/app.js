postId = null;

function createUserOnServer(user) {
  var userData = "userName=" + encodeURIComponent(user.userName);
  userData += "&firstName=" + encodeURIComponent(user.firstName);
  userData += "&lastName=" + encodeURIComponent(user.lastName);
  userData += "&plainPassword=" + encodeURIComponent(user.plainPassword);

  return fetch("https://fast-temple-56003.herokuapp.com/users", {
    method: "POST",
    body: userData,
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

function loginUserOnServer(user) {
  var userData = "userName=" + encodeURIComponent(user.userName);
  userData += "&plainPassword=" + encodeURIComponent(user.pass);

  return fetch("https://fast-temple-56003.herokuapp.com/session", {
    method: "POST",
    body: userData,
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

function logoutUserOnServer() {
  return fetch("https://fast-temple-56003.herokuapp.com/session", {
    method: "DELETE",
    credentials: "include",
  });
}

function deleteSoundFromServer(postId) {
  return fetch("https://fast-temple-56003.herokuapp.com/posts/" + postId, {
		method: "DELETE",
    credentials: "include",
	});
}

function getAudiosFromServer() {
  return fetch("https://fast-temple-56003.herokuapp.com/posts" , {
    credentials: "include"
  });
}

function getPublicSoundsFromServer() {
  return fetch("https://fast-temple-56003.herokuapp.com/public" , {
    credentials: "include"
  });
}

function getNameFromServer() {
  return fetch("https://fast-temple-56003.herokuapp.com/session" , {
    credentials: "include"
  });
}

let sendFileToServer = function (name, date, file) {
    var data = new FormData();
    data.append('name', name);
    data.append('date', date)
    data.append('audio', file);
  
    fetch('https://fast-temple-56003.herokuapp.com/posts', {
      method: 'POST',
      body: data,
      credentials: "include"
    }).then(function () {
      console.log('file sent');
    });
  };
  
  let app = new Vue({
    el: '#app',
    data: {
      date: "",
      userName: '',
      userfName: '',
      userlName: '',
      userPassword: '',
      user: '',
      pass: '',
      name: '',
      file: null,
      url: '',
      audios: [],
      sounds: [],
      errorMessages: [],
      errorRegister: [],
      errorLogin: [],
      activeColor: {
        color: 'red',
      },
      login: true,
      before: false,
      search: "",
      displayName: "",
    },
    methods: {
      validateRegister: function () {
        this.errorRegister = [];
  
        if (this.userfName.length == 0) {
          this.errorRegister.push("* Enter your first name.");
        }
        if (this.userlName.length == 0) {
          this.errorRegister.push("* Enter your last name.");
        }
        if (this.userName.length == 0) {
          this.errorRegister.push("* Enter a username.");
        }
        if (this.userName.length < 4) {
          this.errorRegister.push("* User name needs to be 4 characters or more.");
        }
        if (this.userPassword.length == 0) {
          this.errorRegister.push("* Enter a password.");
        }
        if (this.userPassword.length < 6) {
          this.errorRegister.push("* Password needs to be 6 characters or more.");
        }
        return this.errorRegister == 0;
      },
      validateLogin: function () {
        this.errorLogin = [];
  
        if (this.userName.length == 0) {
          this.errorLogin.push("* Enter a valid username.");
        }
        if (this.userPassword.length == 0) {
          this.errorLogin.push("* Enter a valid password.");
        }
        return this.errorLogin == 0;
      },
      validateName: function () {
        this.errorMessages = [];
  
        if (this.name.length == 0) {
          this.errorMessages.push("* Please name your upload.");
        } if (this.date.length == 0) {
          this.errorMessages.push("* Please enter a date.");
        }

        return this.errorMessages == 0;
      },
      createUser: function () {
        if (!this.validateRegister()) {
          return;
        }
        createUserOnServer({
          userName: this.userName,
          firstName: this.userfName,
          lastName: this.userlName,
          plainPassword: this.userPassword
        }).then((response) => {
          if (response.status == 201) {
            alert("Account Created");
          } else {
            alert("username already exists");
          }
        });
        this.userName = "";
        this.userfName = "";
        this.userlName = "";
        this.userPassword = "";
      },
      loginUser: function() {
        loginUserOnServer({
          userName: this.user,
          pass: this.pass
        }).then((response) => {
          if (response.status == 201) {
            this.loadAudios();
          } else {
            alert(`Enter a valid username or password.`);
          }
        });
        this.user = "";
        this.pass = "";
      },
      logoutUser: function () {
        if (confirm("Are you sure you want to logout?")) {
          logoutUserOnServer().then((response) => {
            if (response.status === 200) {
              this.login = true;
              this.before = false;
              this.audios = [];
            } else {
              alert('Not logged in.');
            }
        });
        }
      },
      selectFile: function (event) {
        this.file = event.target.files[0];
      },
      sendFile: function () {
        if (!this.validateName()) {
          return;
        }
        sendFileToServer(this.name, this.date, this.file);
        alert("File Uploaded. Please refresh page.");
        this.loadAudios();
        this.name = "";
        this.date = "";
        this.file = "";
      },
      deleteSound: function (audio) {
        if (confirm("Are you sure you want to delete sound?")) {
          console.log("File deleted:", audio);
          deleteSoundFromServer(audio._id).then((response) => {
          if (response.status == 200) {
            this.loadAudios();
          } else {
            alert("Loading sounds failed.");
          }
        });
        }
      },
      loadSounds: function () {
        getPublicSoundsFromServer().then((response) => {
          response.json().then((data) => {
            console.log("sounds loaded from server:", data);
            this.sounds = data;
          });
        });
      },
      loadAudios: function () {
        getAudiosFromServer().then((response) => {
          response.json().then((data) => {
            console.log("sounds loaded from server:", data);
            this.audios = data;
            this.login = false;
            this.before = true;
            this.myUser();
          });
        });
      },
      myUser: function () {
        getNameFromServer().then((response) => {
          response.json().then((data) => {
            this.displayName = data.firstName;
            console.log(data)
          })
        });
      }
    },
    created: function () {
      this.loadAudios();
      this.loadSounds();
    },
    computed: {
      filteredAudios: function () {
        return this.audios.filter((audio) => {
          return audio.name.toLowerCase().match(this.search.toLowerCase());
        });
      },
      filteredSounds: function () {
        return this.sounds.filter((sound) => {
          return sound.name.toLowerCase().match(this.search.toLowerCase());
        });
      }
    }
  });


  