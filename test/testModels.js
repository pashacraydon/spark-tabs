'use strict';

import { Tablist, Tab } from '../src/js/models';
import fixture from '../test/fixtures/tablist.js';

function addMinutes(minutes) {
    var date = new Date();
    return new Date(date.getTime() + minutes*60000);
}

describe("Tablist", function () {

  beforeEach(function() {
    this.addSpy = sinon.spy(Tablist.prototype, 'add');
    this.updateSpy = sinon.spy(Tablist.prototype, 'update');
    this.setSpy = sinon.spy(Tablist.prototype, 'set');

    this.list = new Tablist();

    $.each(fixture, (count, attrs) => {
      this.list.create(attrs);
    });
  });

  afterEach(function() {
    this.addSpy.restore();
    this.updateSpy.restore();
    this.setSpy.restore();
    this.list.destroy();
    chrome.reset();
  });

  describe("render()", function () {

    it("should build the html of the tabs.", function () {
      this.list.render().done(function (el) {
        chai.assert.equal($(el).length, 5);
      });
    });

  });

  describe("get(id)", function () {

    it("should return the tab from its id.", function () {
      var tab = this.list.get(1590);
      chai.assert.equal(tab.id, 1590);
    });

  });

  describe("add(tab)", function () {

    it("should push a new tab into the tabs list.", function () {
      var tab = new Tab();
      tab.id = 12345;
      this.list.add(tab);
      chai.assert.equal(this.list.last().id, 12345);
      tab.destroy();
    });

  });

  describe("create(attrs)", function () {

    it("should create a new Tab instance.", function () {
      let attrs = fixture[0];
      this.list.create(attrs);
      chai.assert.isTrue(this.list.at(0) instanceof Tab);
    });

    it("should add the new Tab instance to the tabs array in the list.", function () {
      let attrs = fixture[0];
      this.list.create(attrs);
      chai.assert.equal(attrs.id, 1590);
      chai.assert.equal(this.list.at(0).id, 1590);
    });

  });

  describe("at(index)", function () {

    it("should return the tab at the index in the array list.", function () {
      var tab = this.list.at(0);
      chai.assert.equal(tab.id, 1590);
    });

  });

  describe("suspend(tab)", function () {

   it("should get the tab if it has expired.", function () {
      var tab = this.list.at(0),
        callback;
      this.list.set(tab.id, { 'updated': addMinutes(21) });
      this.list.suspend.call(this.list, tab);
      callback = chrome.tabs.get.getCall(0).args[1];
      sinon.assert.calledWith(chrome.tabs.get, 1590, callback);
    });

    it("should remove the tab if it has expired.", function () {
      var tab = this.list.at(0),
        callback;
      this.list.set(tab.id, { 'updated': addMinutes(21) });
      this.list.suspend.call(this.list, tab);
      chrome.tabs.get.yield(tab);
      sinon.assert.calledWith(chrome.tabs.remove, 1590);
    });

    it("should add the tab back to the list.", function (done) {
      var tab = this.list.at(0);
      this.list.set(tab.id, { 'updated': addMinutes(21) });
      this.list.suspend.call(this.list, tab);
      chrome.tabs.get.yield(tab);

      setTimeout(() => {
        tab.suspended = true;
        sinon.assert.calledWith(this.addSpy, tab);
        done();
      }, 300);
    });

    describe("sort()", function () {

      beforeEach(function() {
        this.tab1 = this.list.at(0);
        this.tab2 = this.list.at(1);
        this.tab3 = this.list.at(2);
        this.tab4 = this.list.at(3);
        this.tab5 = this.list.at(4);
      });

      afterEach(function () {
        this.tab1 = {};
        this.tab2 = {};
        this.tab3 = {};
        this.tab4 = {};
        this.tab5 = {};
      });

      it("should sort its tabs by recent activity.", function () {
        this.list.set(this.tab1.id, { 'updated': addMinutes(21) });
        this.list.set(this.tab2.id, { 'updated': addMinutes(32) });
        this.list.set(this.tab3.id, { 'updated': addMinutes(16) });
        this.list.set(this.tab4.id, { 'updated': addMinutes(56) });
        this.list.set(this.tab5.id, { 'updated': addMinutes(2) });

        this.list.sort();

        chai.assert.equal(this.list.at(0).id, this.tab4.id);
        chai.assert.equal(this.list.at(1).id, this.tab2.id);
        chai.assert.equal(this.list.at(2).id, this.tab1.id);
        chai.assert.equal(this.list.at(3).id, this.tab3.id);
        chai.assert.equal(this.list.at(4).id, this.tab5.id);
      });

    });

    describe("getTimeAgo(tab)", function () {

      it("should return the minutes ago of a tabs updated attribute.", function () {
        let tab = this.list.at(0),
          time_ago;

        this.list.set(tab.id, { 'updated': addMinutes(21) });
        time_ago = this.list.getTimeAgo(tab);
        chai.assert.equal(time_ago.mins, 21);
      });

      it("should return the hours ago of a tabs updated attribute.", function () {
        let tab = this.list.at(0),
          time_ago;

        this.list.set(tab.id, { 'updated': addMinutes(72) });
        time_ago = this.list.getTimeAgo(tab);
        chai.assert.equal(time_ago.hours, 1);
      });

      it("should return a friendly formatted version of the minutes ago.", function () {
        let tab = this.list.at(0),
          time_ago;

        this.list.set(tab.id, { 'updated': addMinutes(21) });
        time_ago = this.list.getTimeAgo(tab);
        chai.assert.equal(time_ago.friendly, '21m ago');
      });

      it("should return a friendly formatted version of the hours ago.", function () {
        let tab = this.list.at(0),
          time_ago;

        this.list.set(tab.id, { 'updated': addMinutes(82) });
        time_ago = this.list.getTimeAgo(tab);
        chai.assert.equal(time_ago.friendly, '1h 22m ago');
      });

    });

  });
});
