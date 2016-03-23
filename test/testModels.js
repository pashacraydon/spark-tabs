'use strict';

import { Tablist, Tab } from '../src/js/models';
import { tabsFixture } from '../test/fixtures/tablistFixture.js';

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

describe('Test Tablist', function () {

  before(function () {
  });

  after(function () {
  });

  beforeEach(function() {
    this.addSpy = sinon.spy(Tablist.prototype, 'add');
    this.updateSpy = sinon.spy(Tablist.prototype, 'update');
    this.setSpy = sinon.spy(Tablist.prototype, 'set');

    this.list = new Tablist();
    $.each(tabsFixture, (count, tab) => {
      this.list.add(tab);
    });
  });

  afterEach(function() {
    this.addSpy.restore();
    this.updateSpy.restore();
    this.setSpy.restore();

    this.list.destroy();
    this.list = [];
  });

  it('render() should build the html of the tabs.', function () {
    var el = this.list.render();
    chai.assert.equal($(el).length, 5);
  });

  it('get(id) should return the tab from its id.', function () {
    var tab = this.list.get(1590);
    chai.assert.equal(tab.id, 1590);
  });

  it('add(tab) should push a new tab into the tabs list.', function () {
    var tab = new Tab();
    tab.id = 12345;
    this.list.add(tab);
    chai.assert.equal(this.list.last().id, 12345);
    tab.destroy();
  });

  it('at(index) should return the tab at the index in the array list.', function () {
    var tab = this.list.at(0);
    chai.assert.equal(tab.id, 1590);
  });

  it('suspend(tab) should get the tab if it has expired.', function () {
    var tab = this.list.at(0),
      callback;
    this.list.set(tab.id, { 'updated': addMinutes(new Date(), 21) });
    this.list.suspend.call(this.list, tab);
    callback = chrome.tabs.get.getCall(0).args[1];
    sinon.assert.calledWith(chrome.tabs.get, 1590, callback);
  });

  it('suspend(tab) should remove the tab if it has expired.', function (done) {
    var tab = this.list.at(0),
      callback;
    this.list.set(tab.id, { 'updated': addMinutes(new Date(), 21) });
    this.list.suspend.call(this.list, tab);
    chrome.tabs.get.yield(tab);

    setTimeout(() => {
      callback = chrome.tabs.remove.getCall(0).args[1];
      sinon.assert.calledWith(chrome.tabs.remove, 1590, callback);
      done();
    }, 300);
  });

  it('suspendCallback(tab) should add the tab back to the list.', function (done) {
    var tab = this.list.at(0);
    this.list.set(tab.id, { 'updated': addMinutes(new Date(), 21) });
    this.list.suspend.call(this.list, tab);
    chrome.tabs.get.yield(tab);

    setTimeout(() => {
      tab.suspended = true;
      sinon.assert.calledWith(this.addSpy, tab);
      done();
    }, 300);
  });
});
