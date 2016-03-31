'use strict';

import '../src/js/eventPage.js';
import { Tablist, Tab } from '../src/js/models';
import fixture from '../test/fixtures/tablist.js';

describe("Event callbacks", function () {

  beforeEach(function() {
  });

  afterEach(function() {
  });

  describe("chrome.runtime.onInstalled()", function () {

    it("should create a list of tabs.", sinon.test(function () {
      chrome.runtime.onInstalled.trigger({ 'reason': 'install' });
      chrome.tabs.query.yield(fixture);
      chai.assert.equal(window.list.tabs.length, 5);
    }));

    it("should be built with favicon urls.", sinon.test(function () {
      chai.assert.equal(window.list.at(0).faviconRenderUrl, "https://assets-cdn.github.com/favicon.ico");
    }));

  });

  describe("chrome.windows.onRemoved()", function () {

    it("should remove all tabs that match the current window.", sinon.test(function () {
      chrome.tabs.query.reset();
      chai.assert.equal(window.list.tabs.length, 5);
      chrome.windows.onRemoved.trigger(1);
      chrome.tabs.query.yield(fixture);
      // all fixture tabs have the same windowId except the last one
      chai.assert.equal(window.list.tabs.length, 1);
    }));

  });


});