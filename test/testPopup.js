import { keys, radix, FILTER_HIDE_CLASS, SELECTED_CLASS, SUSPEND_AFTER_MINS_DEFAULT } from '../src/js/constants.js';

import { tabsFixture } from '../test/fixtures/tablistFixture.js';
import * as p from '../src/js/popup.js';

import { Tablist, Tab } from '../src/js/Tablist';


function createList () {
  let history = [1578, 1558, 1586, 1590, 1546];

  this.list = new Tablist();
  $.each(tabsFixture, (count, tab) => {
    this.list.add(tab);
    this.list.history.push(history[count]);
  });
}

describe('Test popup modal', function () {

  before(function() {
    createList.call(this);
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
  });

  after(function() {
    this.list.destroy();
    chrome.reset();
    $('.js-tabs-list').html('');
  });

  it('should request the background tabs on startup.', function () {
    chrome.runtime.getBackgroundPage.yield({ 'list': this.list });
    sinon.assert.calledOnce(chrome.runtime.getBackgroundPage);
  });

  it('should render a list of 5 tabs html.', function () {
    chai.assert.equal($('.js-tabs-list li.tab-item').length, 5);
  });

  it('should set the select option to the suspend after minutes value from storage.', function () {
    chrome.storage.sync.get.yield({ 'suspendAfterMins': 40 });
    chai.assert.equal($('.select-suspend option:selected').val(), 40);
  });

});

