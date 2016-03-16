'use strict';

import Tablist from './Tablist';
import { template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

// chrome.runtime.getBackgroundPage pulls in the window object
window.list = new Tablist();

function Tab (attrs) {
	this.attrs = attrs;
	this.id = attrs.id;
	this.created = new Date();
	this.el = template(attrs);
}

function onTabUpdated (tab) {
	if (!list.get(tab.id)) {
		var item = new Tab(tab);
		list.add(item);
	}
	else {
		list.update(tab);
	}
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
	list.history.push(activeInfo.tabId);
	var prevTabIndex = (list.history.length === 1) ? (list.history.length - 1) : (list.history.length - 2),
		prevTabId = list.history[prevTabIndex];

	setTimeout(function () {
		var prevActiveTab = list.get(prevTabId);
		if (prevActiveTab) {
			list.set(prevActiveTab.id, { 'updated': new Date() });
		}
	}, 200);
});

chrome.tabs.onHighlighted.addListener(function (info) {
	var self = this;
	$.each(info.tabIds, function (index, tabId) {
		chrome.tabs.get(tabId, function (tab) {
			onTabUpdated.call(self, tab);
		});
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	onTabUpdated.call(this, tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		onTabUpdated.call(this, tab);
	});
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	list.destroyTab(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated.call(this, tab);
	});
});

chrome.tabs.onRemoved.addListener(function (tabId, tab) {
	list.destroyTab(tabId);
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
	list.settings.suspendAfterMins = changes.suspendAfterMins.newValue;
});

chrome.storage.sync.get('suspendAfterMins', function (items) {
	list.settings.suspendAfterMins = (items.suspendAfterMins || SUSPEND_AFTER_MINS_DEFAULT);
});

