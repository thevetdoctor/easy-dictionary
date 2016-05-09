(function () {
  "use strict";

  function wordsApiReq(verb, url, callback) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function () {
      if (req.readyState === 4 && req.status === 200) {
        callback(JSON.parse(req.responseText));
      }
    }

    req.open(verb.toUpperCase(), url);
    req.setRequestHeader("X-Mashape-Key", secrets.apiKey);
    req.send();
  }

  var app = {};

  app.model = {
    db: function () {
      return new Firebase("https://easy-dictionary.firebaseio.com/");
    },
    apiUrl: "https://wordsapiv1.p.mashape.com/words/"
  };

  app.view = {
    form: document.querySelector("form"),
    word: document.querySelector("form input"),
    option: document.querySelector(".option")
  };

  app.controller = {
    returnResult: function (res, option) {
      console.log("Return result directly");
    },
    fetchAndSaveExternalResult: function (word, option) {
      console.log("Words Api queried")
      var reqUrl = `${app.model.apiUrl}${word}`,
          db = app.model.db(),
          data;
      
      wordsApiReq("get", reqUrl, function (res) {
        data = res;

        db.authWithPassword({
          email: secrets.mail,
          password: secrets.pass
        }, function (err, authData) {
          if (authData) db.child("words").child(word).set(data);
        }, { remember: "sessionOnly" });

      });

      // this.returnResult(data, option);
    },
    queryApis: function (word, option) {
      // Query firebase db for word
        // if word is found, return meaning of word (or synonym/antonym based on user choice)

        // if word isn't found, query wordsApi instead
          // Save word to firebase db
          // Return definitions to user

      var db = app.model.db(),
          words = db.child("words"),
          result;

      db.authWithPassword({
        email: secrets.mail,
        password: secrets.pass
      }, function (err, authData) {
        if (authData) {
          words.child(word).on("value", function (snapshot) {
            if (snapshot.val()) {
              app.controller.returnResult(snapshot.val(), option);
            } else {
              app.controller.fetchAndSaveExternalResult(word, option);
            }
          });
        }
      });

    },
    getUserWord: function () {
      app.view.form.addEventListener("submit", function (e) {
        e.preventDefault();
        var word = app.view.word.value.toLowerCase();

        app.view.word.value = "";

        app.controller.queryApis(word, app.view.option.textContent);
      }, false);
    }
  };

  app.init = function () {
    this.controller.getUserWord();
  };

  app.init();
}());