'use strict';

import fixture from '../test/fixtures/tablist.js';

import '../src/js/popup.js';
import * as c from '../src/js/constants.js';
import { keys, radix, FILTER_HIDE_CLASS, SELECTED_CLASS, SUSPEND_AFTER_MINS_DEFAULT } from '../src/js/constants.js';
import { Tablist, Tab } from '../src/js/models';

function createList () {
  let history = [1578, 1558, 1586, 1590, 1546];

  this.list = new Tablist();
  $.each(fixture, (count, attrs) => {
    this.list.create(attrs);
    this.list._history.push(history[count]);
  });
}

describe("Popup Modal", function () {

  before(function () {
    this.removeSpy = sinon.spy(Tablist.prototype, 'remove');
    createList.call(this);
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
  });

  after(function () {
    this.removeSpy.restore();
    this.list.destroy();
    chrome.reset();
  });

  it("should request the background tabs on startup.", function () {
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
    sinon.assert.calledOnce(chrome.runtime.getBackgroundPage);
  });

  it("should render the html for all the tabs in its window.", function () {
    chrome.tabs.query.yield(fixture);
    // 4 fixture tabs have the same windowId, the 5th one is different
    chai.assert.equal($('.js-tabs-list li.tab-item').length, 4);
  });

  describe("onPinClick()", function () {

    it("should update the tab.", function () {
      let expectedTabId = 1590;
      $('.js-tabs-list li:first .js-pin')[0].click();
      var callback = chrome.tabs.update.getCall(0).args[2];
      sinon.assert.calledWith(chrome.tabs.update, expectedTabId, { 'pinned': true }, callback);
    });

  });

  describe("onRemoveTabClick()", function () {

    it("should close the tab.", function () {
      let expectedTabId = 1590;
      $('.js-tabs-list li:first .js-close-tab')[0].click();
      sinon.assert.calledWith(this.removeSpy, expectedTabId);
    });

    it("callback should remove the item from the UI.", function () {
      $('.js-tabs-list li:first .js-close-tab')[0].click();
      this.removeSpy.yield(1590);
      chai.assert.equal($('.js-tabs-list li.tab-item').length, 3);
    });

  });

  describe("onTitleClick()", function () {

    it("should create a new tab if it is suspended", function () {
      let expectedUrl = "https://github.com/Microsoft/TypeScript/issues/2726";
      $('.js-tabs-list li.tab-item').addClass(c.SUSPENDED_CLASS);
      $('.js-tabs-list li.tab-item .js-title')[0].click();
      let callback = chrome.tabs.create.getCall(0).args[1];
      sinon.assert.calledWith(chrome.tabs.create, { 'url': expectedUrl }, callback);
    });

  });

  describe("onBodyKeyup()", function () {

    beforeEach(function() {
      this.$tabLi = $('.js-tabs-list li.tab-item');
    });

    afterEach(function() {
      $('.js-tabs-list').find('.' + c.SELECTED_CLASS).removeClass(c.SELECTED_CLASS);
    });

    it("should select next item down in the list on ↓ key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.DOWN_KEY }));
      let $selectedItem = $('.js-tabs-list').find('li.' + c.SELECTED_CLASS);
      let index = this.$tabLi.index($selectedItem);
      chai.assert.equal(index, 1);
    });

    it("should select next item down in the list on J key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.J_KEY }));
      let $selectedItem = $('.js-tabs-list').find('li.' + c.SELECTED_CLASS);
      let index = this.$tabLi.index($selectedItem);
      chai.assert.equal(index, 1);
    });

    it("should select next item up in the list on ↑ key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.UP_KEY }));
      let $selectedItem = $('.js-tabs-list').find('li.' + c.SELECTED_CLASS);
      let index = this.$tabLi.index($selectedItem);
      chai.assert.equal(index, 0);
    });

    it("should select next item up in the list on K key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.K_KEY }));
      let $selectedItem = $('.js-tabs-list').find('li.' + c.SELECTED_CLASS);
      let index = this.$tabLi.index($selectedItem);
      chai.assert.equal(index, 0);
    });

    it("should pin selected items on the P key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.K_KEY }));
      $('body').trigger($.Event('keyup', { keyCode: c.keys.P_KEY }));
      let callback = chrome.tabs.update.getCall(0).args[2];
      sinon.assert.calledWith(chrome.tabs.update, 1590, { 'pinned': true}, callback);
    });

    it("should throw out selected tabs on the C key.", function () {
      $('body').trigger($.Event('keyup', { keyCode: c.keys.K_KEY }));
      $('body').trigger($.Event('keyup', { keyCode: c.keys.C_KEY }));
      let callback = this.removeSpy.getCall(0).args[1];
      sinon.assert.calledWith(this.removeSpy, 1590, callback);
    });

  });

  describe("onResetFilter()", function () {

    beforeEach(function() {
      $('[type="search"]').val('python');
    });

    afterEach(function() {
      $('[type="search"]').val('');
    });

    it("should remove text in the filter input field.", function () {
      $('.js-reset-filter')[0].click();
      chai.assert.equal($('[type="search"]').val(), '');
    });

    it("should unhide all items.", function () {
      $('.js-reset-filter')[0].click();
      chai.assert.equal($('.' + FILTER_HIDE_CLASS).length, 0);
    });

    it("should remove no results messaging.", function () {
      $('[type="search"]').val('zzzzzzzzzz').trigger('keyup');
      chai.assert.equal($('.no-results').length, 1);
      $('.js-reset-filter')[0].click();
      chai.assert.equal($('.no-results').length, 0);
    });
  });

  describe("onCloseAllTabsClick()", function () {

    it("should close (suspend) all tabs but the first one.", function () {
      $('.js-tabs-list').find('.' + c.SUSPENDED_CLASS).removeClass(c.SUSPENDED_CLASS);
      chrome.tabs.get.reset();
      chrome.tabs.remove.reset();
      $('.js-close-all-tabs')[0].click();

      chrome.tabs.get.yield(fixture[1]);
      chrome.tabs.remove.yield(fixture[1]);

      chrome.tabs.get.onCall(1).stub.yield(fixture[2]);
      chrome.tabs.remove.onCall(1).stub.yield(fixture[2]);

      chrome.tabs.get.onCall(2).stub.yield(fixture[3]);
      chrome.tabs.remove.onCall(2).stub.yield(fixture[3]);

      chrome.tabs.get.onCall(3).stub.yield(fixture[4]);
      chrome.tabs.remove.onCall(3).stub.yield(fixture[4]);

      chai.assert.equal($('.js-tabs-list li.tab-item').not('.' + c.SUSPENDED_CLASS).length, 1);
    });

  });

});



