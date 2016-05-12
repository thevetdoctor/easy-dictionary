(function () {
  "use strict";

  function wordsApiReq(verb, url, callback) {
    let req = new XMLHttpRequest();

    req.onreadystatechange = function () {
      if (req.readyState === 4 && req.status === 200) {
        callback(JSON.parse(req.responseText));
      } else if (req.status === 404 && req.readyState === 4) {
        callback({result: "No definition found", word: url.split("/").slice(-1).join("")});
      }
    }

    req.open(verb.toUpperCase(), url);
    req.setRequestHeader("X-Mashape-Key", secrets.apiKey);
    req.send();
  }

  let app = {};

  app.model = {
    db: function () {
      return new Firebase("https://easy-dictionary.firebaseio.com/");
    },
    authUser: function () {
      this.db().authWithPassword({
        email: secrets.mail,
        password: secrets.pass
      }, function (err, authData) {
        if (authData) app.controller.getUserWord();
      }, { remember: "sessionOnly" });
    },
    capitalize: function (word) {
      return word[0].toUpperCase().concat(word.slice(1));
    },
    removeChildren: function (elem) {
      while(elem.firstChild) {
        elem.removeChild(elem.firstChild);
      }
    },
    count: function (elem, arr) {
      let reps = 0;
      arr.forEach(function (item) {
        if (item === elem) reps += 1;
      });

      return reps;
    },
    uniq: function (arr) {
      let res = new Set();

      arr.forEach((item) => res.add(item));

      return Array.from(res);
    },
    apiUrl: "https://wordsapiv1.p.mashape.com/words/"
  };

  app.view = {
    form: document.querySelector("form"),
    word: document.querySelector("form input"),
    option: document.querySelector(".option"),
    resultPane: document.querySelector(".results"),
    wordContainer: document.querySelector(".word-container"),
    pronunciation: document.querySelector(".pronunciation"),
    definitions: document.querySelector(".definitions ol")
  };

  app.controller = {
    show: function (option, data, frag) {
      let optionResults = [];

      data.results.forEach(function (item) {
        if (item[option]) {
          item[option].forEach(function (val) {
            optionResults.push(val);
          });
        } 
      });

      optionResults = app.model.uniq(optionResults);

      optionResults.forEach(function (item) {
        let li = document.createElement("li"),
            p = document.createElement("p");

        p.textContent = item;

        li.appendChild(p);
        frag.appendChild(li);
      });
    },
    returnResult: function (res, option) {
      let frag = document.createDocumentFragment(),
          optionResults = [];

      if (res.result === "No definition found") {
        app.view.resultPane.style.border = "0";
        app.model.removeChildren(app.view.definitions);
        app.view.wordContainer.textContent = res.word;
        app.view.pronunciation.textContent = "No results found!";
      }

      app.view.wordContainer.textContent = app.model.capitalize(res.word);
      app.view.pronunciation.textContent = `/${res.pronunciation.all}/`;

      if (option === "definition") {
        res.results.forEach(function (item) {
          let li = document.createElement("li"),
              h5 = document.createElement("h5"),
              p = document.createElement("p");

            h5.textContent = item.definition;
            p.textContent = item.partOfSpeech;

            li.appendChild(h5);
            li.appendChild(p);

            frag.appendChild(li);   
        });
      }

      if (option === "synonyms") {
        this.show("synonyms", res, frag);
      }

      if (option === "antonyms") {
        this.show("antonyms", res, frag);
      }

      app.model.removeChildren(app.view.definitions);
      app.view.resultPane.style.border = "1px solid #eee";
      app.view.definitions.appendChild(frag);
      return;
    },
    fetchAndSaveExternalResult: function (word, option) {
      let reqUrl = `${app.model.apiUrl}${word}`,
          db = app.model.db();
      
      wordsApiReq("get", reqUrl, function (res) {
        db.child("words").child(word).set(res);

        app.controller.returnResult(res, option);
      });
      
    },
    queryApis: function (word, option) {
      let db = app.model.db(),
          words = db.child("words"),
          result;

      words.child(word).once("value", function (snapshot) {
        if (snapshot.val()) {
          app.controller.returnResult(snapshot.val(), option);
        } else {
          app.controller.fetchAndSaveExternalResult(word, option);
        }
      });
    },
    getUserWord: function () {
      app.view.form.addEventListener("submit", function (e) {
        e.preventDefault();
        let word = app.view.word.value.toLowerCase();

        app.view.word.value = "";

        app.controller.queryApis(word, app.view.option.textContent);
      }, false);
    }
  };

  app.init = function () {
    this.model.authUser();
  };

  app.init();
}());