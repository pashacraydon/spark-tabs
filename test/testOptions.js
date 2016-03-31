'use strict';

import '../src/js/options.js';

describe("Options", function () {

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it("should set the select option to the suspend after minutes value from storage.", function () {
    chrome.storage.sync.get.yield({ 'suspendAfterMins': 40 });
    chai.assert.equal($('.select-suspend option:selected').val(), 40);
  });

});