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
	}, 300);
});

chrome.tabs.onHighlighted.addListener(function (info) {
	$.each(info.tabIds, function (index, tabId) {
		chrome.tabs.get(tabId, function (tab) {
			onTabUpdated(tab);
		});
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	if (change.status !== "loading") {
		onTabUpdated(tab);
	}
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		onTabUpdated(tab);
	});
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	list.destroyTab(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated(tab);
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

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason === "install") {
		chrome.tabs.query({ 'currentWindow': true }, function (tabs) {
			_.each(tabs, function (tab) {
				onTabUpdated(tab);
			});
		});
	}
});

