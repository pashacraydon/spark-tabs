'use strict';

import '../src/js/eventPage.js';


describe("Event callbacks", function () {

  beforeEach(function() {
  });

  afterEach(function() {
  });

  describe("chrome.windows.onRemoved()", function () {

    it("should build the html of the tabs.", function () {
      chrome.windows.onRemoved.yield(1);
    });

  });


});