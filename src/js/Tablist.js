'use strict';

import { buildFaviconUrl, template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

function Tablist () {
	this.tabs = [];
	// history of active tab id's
	this.history = [];

	this.settings = {
		'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT
	};
}

Tablist.prototype.render = function () {
	var self = this,
		elements = '';

	Tablist.prototype.sort.call(this);

	_.each(this.tabs, function (tab) {
		if (!tab) return;
		if (tab.el && tab.title !== "New Tab") {
			tab.time_ago = Tablist.prototype.getTimeAgo(tab);
			tab.el = template(tab);
			elements += tab.el;
		}
	});

	return elements;
};

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

Tablist.prototype.suspendCallback = function (tab) {
	Tablist.prototype.add.call(this, tab);
	Tablist.prototype.update.call(this, tab, { 'ignoreExtraActions' : true });
	Tablist.prototype.set.call(this, tab.id, { 'suspended': true, 'pinned': false });
};

Tablist.prototype.suspendInactiveTab = function (tab) {
	var timeAgo = Tablist.prototype.getTimeAgo(tab),
		storeTab = tab,
		self = this;

	if (tab.suspended) return false;
	if (tab.pinned) return false;
	if (this.settings.suspendAfterMins === "never") return false;

	if (timeAgo >  this.settings.suspendAfterMins) {
		chrome.tabs.get(tab.id, function (tabItem) {
			if (chrome.runtime.lastError) {
				return false;
			}
			else {
				chrome.tabs.remove(tabItem.id, function () {
					setTimeout(function () {
						Tablist.prototype.suspendCallback.call(self, tabItem);
					}, 300);
				});
			}
		});
	}
};

Tablist.prototype.set = function (tabId, newAttrs) {
	var tabItem = Tablist.prototype.get.call(this, tabId);
	if (tabItem) {
		var index = this.tabs.indexOf(tabItem);
		$.extend(this.tabs[index], newAttrs);
	}
};

Tablist.prototype.getTimeAgo = function (tab) {
	var now = new Date(),
		diffMs = Math.abs((tab.updated || tab.created) - now);
	return Math.round(((diffMs % 86400000) % 3600000) / 60000);
};

Tablist.prototype.onUpdate = function () {
	var self = this;
	$.each(this.tabs, function (count, tab) {
		Tablist.prototype.suspendInactiveTab.call(self, tab);
	});
},

Tablist.prototype.buildFaviconUrl = function (tab) {
	if (tab.favIconUrl) {
		return tab.favIconUrl;
	}

	if (tab.url) {
		var urlStr = tab.url.split('/'),
			urlArr = [],
			favUrl;
		urlArr.push(urlStr[0]);
		urlArr.push(urlStr[2]);
		return urlArr.join('//') + '/favicon.ico';
	}
},

Tablist.prototype.update = function (updatedTab, options) {
	var tabItem = Tablist.prototype.get.call(this, updatedTab.id);

	options = options || {};

	updatedTab.faviconRenderUrl = Tablist.prototype.buildFaviconUrl(updatedTab);

	if (tabItem) {
		var index = this.tabs.indexOf(tabItem);
		this.tabs[index] = $.extend(
			tabItem,
			updatedTab,
			{ 'el': template(updatedTab) },
			{ 'updated': new Date() },
			{ 'time_ago': 0 }
		);

		if (!options.ignoreExtraActions) {
			Tablist.prototype.onUpdate.call(this);
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
	this.tabs.sort(sortByDate);
};

export default Tablist;

