'use strict';

import { Tablist, Tab } from './Tablist';
import { template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

// chrome.runtime.getBackgroundPage pulls in the window object
window.list = new Tablist();

function onTabUpdated (tab) {
	if (tab.status === "loading") return false;
	if (tab.title === "New Tab") return false;

	if (!list.get(tab.id)) {
		var item = new Tab();
		item.set(tab);
		list.add(item);
	}
	else {
		list.update(tab);
	}
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
	list.prevActiveTab({ 'set': activeInfo.tabId });

	setTimeout(function () {
		var prevActiveTab = list.prevActiveTab({ 'get': true });
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
	list.remove(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated(tab);
	});
});

chrome.tabs.onRemoved.addListener(function (tabId, tab) {
	list.remove(tabId);
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
			$.each(tabs, function (count, tab) {
				onTabUpdated(tab);
			});
		});
	}
});

