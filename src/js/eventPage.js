'use strict';

import { Tablist, Tab } from './models';
import { template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

// chrome.runtime.getBackgroundPage pulls in the window object
window.list = new Tablist();

function onTabUpdated (attrs) {
	if (attrs.status === "loading") return false;
	if (attrs.title === "New Tab") return false;

	if (!list.get(attrs.id)) {
		list.create(attrs);
	}
	else {
		list.update(attrs);
	}
}

chrome.tabs.onActivated.addListener((activeInfo) => {
	list.prevActiveTab({ 'set': activeInfo.tabId });

	setTimeout(() => {
		let prevActiveTab = list.prevActiveTab({ 'get': true });
		if (prevActiveTab) {
			list.set(prevActiveTab.id, { 'updated': new Date() });
		}
	}, 300);
});

chrome.tabs.onHighlighted.addListener((info) => {
	$.each(info.tabIds, (index, tabId) => {
		chrome.tabs.get(tabId, (tab) => {
			onTabUpdated(tab);
		});
	});
});

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
	if (change.status !== "loading") {
		onTabUpdated(tab);
	}
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	chrome.tabs.get(activeInfo.tabId, (tab) => {
		onTabUpdated(tab);
	});
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
	list.remove(removedTabId);
	chrome.tabs.get(addedTabId, (tab) => {
		onTabUpdated(tab);
	});
});

chrome.tabs.onRemoved.addListener((tabId, tab) => {
	list.remove(tabId);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
	list.settings.suspendAfterMins = changes.suspendAfterMins.newValue;
});

chrome.storage.sync.get('suspendAfterMins', (items) => {
	list.settings.suspendAfterMins = (items.suspendAfterMins || SUSPEND_AFTER_MINS_DEFAULT);
});

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.tabs.query({ 'currentWindow': true }, (tabs) => {
			$.each(tabs, (count, tab) => {
				tab.faviconRenderUrl = list.buildFaviconUrl(tab);
				onTabUpdated(tab);
			});
		});
	}
});

