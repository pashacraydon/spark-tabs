'use strict';

let fixture = require('json!../test/fixtures/tablist.json');

import '../src/js/popup.js';
import { keys, radix, FILTER_HIDE_CLASS, SELECTED_CLASS, SUSPEND_AFTER_MINS_DEFAULT } from '../src/js/constants.js';
import { Tablist, Tab } from '../src/js/models';

function createList () {
  let history = [1578, 1558, 1586, 1590, 1546];

  this.list = new Tablist();
  $.each(fixture, (count, attrs) => {
    this.list.create(attrs);
    this.list.history.push(history[count]);
  });
}

describe("Popup Modal", function () {

  before(function () {
    this.removeSpy = sinon.spy(Tablist.prototype, 'remove');
    this.suspendCallbackSpy = sinon.spy(Tablist.prototype, 'suspendCallback');
    createList.call(this);
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
    this.fixture = $('.js-tabs-list').html();
  });

  after(function () {
    this.removeSpy.restore();
    this.suspendCallbackSpy.restore();
    this.list.destroy();
    chrome.reset();
  });

  beforeEach(function() {
    $('.js-tabs-list').html(this.fixture);
  });

  afterEach(function() {
    $('.js-tabs-list').html('');
  });

  it("should request the background tabs on startup.", function () {
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
    sinon.assert.calledOnce(chrome.runtime.getBackgroundPage);
  });

  it("should render a list of 5 tabs html.", function () {
    chai.assert.equal($('.js-tabs-list li.tab-item').length, 5);
  });

  it("should set the select option to the suspend after minutes value from storage.", function () {
    chrome.storage.sync.get.yield({ 'suspendAfterMins': 40 });
    chai.assert.equal($('.select-suspend option:selected').val(), 40);
  });

  describe("onSuspendClick()", function () {

    it("should get the tab.", function () {
      $('.js-tabs-list li:first .js-suspend')[0].click();
      chai.assert.equal(chrome.tabs.get.getCall(0).args[0], '1590');
    });

    it("should remove the tab.", function () {
      $('.js-tabs-list li:first .js-suspend')[0].click();
      chrome.tabs.get.yield(fixture[0]);
      chai.assert.equal(chrome.tabs.remove.getCall(0).args[0], '1590');
    });

    it("should add the tab it removed back to the list.", function (done) {
      $('.js-tabs-list li:first .js-suspend')[0].click();
      chrome.tabs.get.yield(fixture[0]);
      chrome.tabs.remove.yield();
      setTimeout(() => {
        sinon.assert.calledWith(this.suspendCallbackSpy, fixture[0]);
        done();
      }, 300);
    });

  });

  describe("onPinClick()", function () {

    it("should update the tab.", function () {
      $('.js-tabs-list li:first .js-pin')[0].click();
      var callback = chrome.tabs.update.getCall(0).args[2];
      sinon.assert.calledWith(chrome.tabs.update, 1590, { 'pinned': true }, callback);
    });

    it("callback should hide its pin icon.", function () {
      $('.js-tabs-list li:first .js-pin')[0].click();
      chrome.tabs.update.yield(1590, { 'pinned': true });
      chai.assert.isTrue($('.js-tabs-list li:first .js-pin').is(':hidden'));
    });

  });

  describe("onRemoveTabClick()", function () {

    it("should close the tab.", function () {
      $('.js-tabs-list li:first .js-close-tab')[0].click();
      sinon.assert.calledWith(this.removeSpy, 1590);
    });

    it("callback should remove the item from the UI.", function () {
      $('.js-tabs-list li:first .js-close-tab')[0].click();
      this.removeSpy.yield(1590);
      chai.assert.equal($('.js-tabs-list li.tab-item').length, 4);
    });

  });

  describe("onTitleClick()", function () {
    /*
    it("should create a new tab if it is suspended", function () {
      $('.js-tabs-list li.tab-item').addClass('suspended');
      $('.js-tabs-list li.tab-item .js-title')[0].click();
      sinon.assert.calledWith(chrome.tabs.create, { 'url': "https://github.com/acvetkov/sinon-chrome/releases" });
    }); */

  });

});

