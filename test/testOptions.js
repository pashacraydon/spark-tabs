'use strict';

import '../src/js/options.js';

describe("Options", function () {

  beforeEach(function() {
    this.list = new Tablist();

    $.each(fixture, (count, attrs) => {
      this.list.create(attrs);
    });
  });

  afterEach(function() {
    this.list.destroy();
  });

  it("should set the select option to the suspend after minutes value from storage.", function () {
    chrome.storage.sync.get.yield({ 'suspendAfterMins': 40 });
    chai.assert.equal($('.select-suspend option:selected').val(), 40);
  });

});