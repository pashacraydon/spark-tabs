'use strict';

import { buildFaviconUrl, template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

function Tab () {
	this.created = new Date();
}

$.extend(Tab.prototype, {

	'set': function (attrs) {
		$.extend(this, attrs);
		this.el = template(this);
	}

});

function Tablist () {
	this.tabs = [];
	// history of active tab id's
	this.history = [];

	this.settings = {
		'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT
	};
}

$.extend(Tablist.prototype, {

	'render': function () {
		var self = this,
			elements = '';

		this.sort();

		$.each(this.tabs, function (count, tab) {
			if (!tab) return;
			tab.time_ago = self.getTimeAgo(tab);
			tab.el = template(tab);
			elements += tab.el;
		});

		return elements;
	},

	'get': function (id) {
		if (!this.tabs) return;
		var found = $.grep(this.tabs, function (item) {
			return (item.id === id);
		});

		return found[0];
	},

	'add': function (tab) {
		this.tabs.push(tab);
	},

	'prevActiveTab': function (options) {
		if (options.set) {
			this.history.push(options.set);
		}
		else if (options.get) {
			var prevTabIndex = (this.history.length === 1) ? (this.history.length - 1) : (this.history.length - 2),
				prevTabId = this.history[prevTabIndex];
			return this.get(prevTabId);
		}
	},

	'suspendCallback': function (tab) {
		this.add(tab);
		this.update(tab, { 'ignoreExtraActions' : true });
		this.set(tab.id, { 'suspended': true, 'pinned': false });
	},

	'suspend': function (tab) {
		var timeAgo = this.getTimeAgo(tab),
			prevActiveTab = this.prevActiveTab({ 'get': true }),
			storeTab = tab,
			self = this;

		if (tab.suspended) return false;
		if (tab.pinned) return false;
		if (this.settings.suspendAfterMins === "never") return false;
		if (prevActiveTab) return false;

		if (timeAgo >= this.settings.suspendAfterMins) {
			chrome.tabs.get(tab.id, function (tabItem) {
				if (chrome.runtime.lastError) {
					return false;
				}
				else {
					chrome.tabs.remove(tabItem.id, function () {
						setTimeout(function () {
							self.suspendCallback(tabItem);
						}, 300);
					});
				}
			});
		}
	},

	'set': function (tabId, newAttrs) {
		var tabItem = this.get(tabId);
		if (tabItem) {
			var index = this.tabs.indexOf(tabItem);
			$.extend(this.tabs[index], newAttrs);
		}
	},

	'getTimeAgo': function (tab) {
		var now = new Date(),
			diffMs = Math.abs((tab.updated || tab.created) - now);
		return Math.round(((diffMs % 86400000) % 3600000) / 60000);
	},

	'buildFaviconUrl': function (tab) {
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

	'update': function (updatedTab, options) {
		var tabItem = this.get(updatedTab.id),
			self = this;

		options = options || {};

		updatedTab.faviconRenderUrl = this.buildFaviconUrl(updatedTab);

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
				$.each(this.tabs, function (count, tab) {
					self.suspend(tab);
				});
			}
		}
	},

	'remove': function (tabId, callback) {
		var tabItem = this.get(tabId);

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
	},

	'sort': function () {
		function sortByDate(a, b) {
			return  (b.updated || b.created) - (a.updated || a.created);
		}
		this.tabs.sort(sortByDate);
	}

});


export { Tablist, Tab }

