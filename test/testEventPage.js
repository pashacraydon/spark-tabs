'use strict';

import '../src/js/eventPage.js';
import { Tablist, Tab } from '../src/js/models';
import fixture from '../test/fixtures/tablist.js';

describe("Event callbacks", function () {

  beforeEach(function() {
    chrome.runtime.onInstalled.trigger({ 'reason': 'install' });
    chrome.tabs.query.yield(fixture);
  });

  afterEach(function() {
    window.list.tabs = [];
  });

  describe("chrome.runtime.onInstalled()", function () {

    it("should create a list of tabs.", function () {
      chai.assert.equal(window.list.tabs.length, 5);
    });

    it("should be built with favicon urls.", function () {
      chai.assert.equal(window.list.at(0).faviconRenderUrl, "https://assets-cdn.github.com/favicon.ico");
    });

  });

  describe("chrome.windows.onRemoved()", function () {

    it("should remove all tabs that match the current window.", function () {
      chrome.tabs.query.reset();
      chai.assert.equal(window.list.tabs.length, 5);
      chrome.windows.onRemoved.trigger(1);
      chrome.tabs.query.yield(fixture);
      // all fixture tabs have the same windowId except the last one
      chai.assert.equal(window.list.tabs.length, 1);
    });

  });

  describe("chrome.storage.onChanged()", function () {

    it("should update list settings on suspendAfterMins storage changes.", function () {
      let changes = {};
      changes.suspendAfterMinds = {
        'newValue': 40
      };

      chrome.storage.onChanged.trigger(changes);
      chai.assert.equal(window.list.settings.suspendAfterMins, 40);
    });

    it("should update list settings on whitelist storage changes.", function () {
      let changes = {};
      changes.whitelist = {
        'newValue': [
          "http://www.nytimes.com",
          "http://www.polygon.com"
        ]
      };

      chrome.storage.onChanged.trigger(changes);
      chai.assert.deepEqual(window.list.settings.whitelist, [
        "http://www.nytimes.com",
        "http://www.polygon.com"
      ]);
    });

  });

  describe("chrome.tabs.onRemoved()", function () {

    it("should remove tab from the list.", function () {
      let tab = window.list.first();
      chrome.tabs.onRemoved.trigger(tab.id);
      chai.assert.notEqual(window.list.first().id, tab.id);
    });

  });

  describe("chrome.tabs.onReplaced()", function () {

    it("should remove the replaced tab from the list.", function () {
      chai.assert.equal(window.list.get(1590).id, 1590);
      chrome.tabs.onReplaced.trigger(1234, 1590);
      chai.assert.equal(window.list.get(1590), undefined);
    });

    it("should add the new tab to the list.", function () {
      chrome.tabs.onReplaced.trigger(1234, 1590);
      chrome.tabs.get.yield({
        'url': 'http://www.bitly.com',
        'favIconUrl': 'http://www.bitley.com',
        'id': 1234
      });

      chai.assert.equal(window.list.get(1234).url, 'http://www.bitly.com');
    });

  });

});

