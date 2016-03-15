'use strict';

import $ from '../lib/jquery-2.1.1.js';
import { buildFaviconUrl, template } from 'helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from 'constants.js';

function Tablist () {
	this.tabs = [];
	// history of active tab id's
	this.history = [];

	this.settings = {
		'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT
	};
}

// @param {number} tab id, return the tab from it's id
Tablist.prototype.get = function (id) {
	if (!this.tabs) return;
	var found = $.grep(this.tabs, function (item) {
		return (item.id === id);
	});

	return found[0];
};

Tablist.prototype.add = function (tab) {
	this.tabs.push(tab);
};

Tablist.prototype.getTimeAgo = function (tab) {
	var now = new Date(),
		diffMs = Math.abs((tab.updated || tab.created) - now);
	return Math.round(((diffMs % 86400000) % 3600000) / 60000);
};

Tablist.prototype.suspendInactiveTabs = function () {
	var self = this;
	$.each(this.tabs, function (count, tab) {
		var timeAgo = Tablist.prototype.getTimeAgo(tab),
			storeTab = tab;

		if (tab.suspended) return false;
		if (tab.pinned) return false;
		if (self.settings.suspendAfterMins === "never") return false;

		if (timeAgo > self.settings.suspendAfterMins) {
			chrome.tabs.get(tab.id, function (tabItem) {
				if (chrome.runtime.lastError) {
					return false;
				}
				else {
					chrome.tabs.remove(tabItem.id, function () {
						self.tabs.push(storeTab);
						Tablist.prototype.set.call(self, tabItem.id, { 'suspended': true });
					});
				}
			});
		}
	});
};

Tablist.prototype.addTime = function (tabId) {
	var tabItem = Tablist.prototype.get.call(this, tabId),
		timeAgo = Tablist.prototype.getTimeAgo.call(this, tabItem);

	tabItem.time_ago = (timeAgo === 0) ? '' : ((timeAgo === 1) ? (timeAgo + ' min') : (timeAgo + ' mins'));
	tabItem.el = template(tabItem);
};

Tablist.prototype.set = function (tabId, newAttrs) {
	var tabItem = Tablist.prototype.get.call(this, tabId);
	if (tabItem) {
		var index = this.tabs.indexOf(tabItem);
		$.extend(this.tabs[index], newAttrs);
	}
};

Tablist.prototype.update = function (updatedTab, options) {
	var tabItem = Tablist.prototype.get.call(this, updatedTab.id);

	options = options || {};

	if (!updatedTab.favIconUrl) {
		if (updatedTab.url) {
			updatedTab.faviconRenderUrl = buildFaviconUrl(updatedTab.url);
		}
	}
	else {
		updatedTab.faviconRenderUrl = updatedTab.favIconUrl;
	}

	if (tabItem) {
		var index = this.tabs.indexOf(tabItem);
		this.tabs[index] = $.extend(updatedTab,
			{ 'el': template(updatedTab) },
			{ 'updated': new Date() }
		);

		if (!options.ignoreExtraActions) {
			Tablist.prototype.sort.call(this);
			Tablist.prototype.suspendInactiveTabs.call(this);
		}
	}
};

// remove tab from chrome and the list
Tablist.prototype.destroyTab = function (tabId, callback) {
	var tabItem = Tablist.prototype.get.call(this, tabId);

	if (tabItem) {
		var index = this.tabs.indexOf(tabItem);
		delete this.tabs[index];
		// remove empty array indexes
		this.tabs = $.grep(this.tabs, function (item) {
			return (item === 0) || item;
		});

		chrome.tabs.get(tabId, function (tab) {
			if (chrome.runtime.lastError) {
				if (callback) {
					callback();
				}
			}
			else {
				chrome.tabs.remove(tab.id, callback);
			}
		});
	}
};

Tablist.prototype.sort = function () {
	function sortByDate(a, b) {
		return  (b.updated || b.created) - (a.updated || a.created);
	}
	return this.tabs.sort(sortByDate);
};
