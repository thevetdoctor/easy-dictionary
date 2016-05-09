(function () {
  "use strict";

  var app = {};

  app.view = {
    options: document.querySelector(".options"),
    option: document.querySelector(".option")
  };

  app.controller = {
    handleChange: function () {
      var main = app;

      main.view.options.addEventListener("change", function () {
        main.view.option.textContent = this.value;
      }, false);
    }
  };

  app.init = function () {
    this.controller.handleChange();
  };

  app.init();
}());