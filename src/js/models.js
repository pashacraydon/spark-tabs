'use strict';

import { buildFaviconUrl, template } from './helpers.js';
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';


class Tab {
	constructor (attrs) {
		$.extend(this, attrs);
		this.created = new Date();
		this.el = template(this);
	}

	destroy() {
		this.el = '';
		this.created = null;
	}
}


class Tablist {
	constructor () {
		this.tabs = [];
		this.history = [];
		this.settings = {
			'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT
		};
	}

	render() {
		let elements = '';

		this.sort();

		$.each(this.tabs, (count, tab) => {
			if (!tab) return;
			tab.time_ago = this.getTimeAgo(tab);
			tab.el = template(tab);
			elements += tab.el;
		});

		return elements;
	}

	destroy() {
		this.tabs = [];
		this.history = [];
		this.settings = {};
	}

	get(id) {
		if (!this.tabs) return;
		let found = $.grep(this.tabs, (item) => {
			return (item.id === id);
		});

		return found[0];
	}

	add(tab) {
		this.tabs.push(tab);
	}

	last() {
		var index = (this.tabs.length - 1);
		return this.tabs[index];
	}

	at(index) {
		return this.tabs[index];
	}

	prevActiveTab(options) {
		if (options.set) {
			this.history.push(options.set);
		}
		else if (options.get) {
			let prevTabIndex = (this.history.length === 1) ? (this.history.length - 1) : (this.history.length - 2),
				prevTabId = this.history[prevTabIndex];
			return this.get(prevTabId);
		}
	}

	suspendCallback(tab) {
		this.add(tab);
		this.update(tab, { 'ignoreExtraActions' : true });
		this.set(tab.id, { 'suspended': true, 'pinned': false });
	}

	suspend(tab) {
		let timeAgo = this.getTimeAgo(tab),
			prevActiveTab = this.prevActiveTab({ 'get': true }),
			storeTab = tab;

		if (tab.suspended) return false;
		if (tab.pinned) return false;
		if (this.settings.suspendAfterMins === "never") return false;
		if (prevActiveTab) return false;

		if (timeAgo >= this.settings.suspendAfterMins) {
			chrome.tabs.get(tab.id, (tabItem) => {
				if (chrome.runtime.lastError) {
					return false;
				}
				else {
					chrome.tabs.remove(tabItem.id, () => {
						setTimeout(() => {
							this.suspendCallback(tabItem);
						}, 300);
					});
				}
			});
		}
	}

	set(tabId, newAttrs) {
		let tabItem = this.get(tabId);
		if (tabItem) {
			var index = this.tabs.indexOf(tabItem);
			$.extend(this.tabs[index], newAttrs);
		}
	}

	getTimeAgo(tab) {
		let now = new Date(),
			diffMs = Math.abs((tab.updated || tab.created) - now);
		return Math.round(((diffMs % 86400000) % 3600000) / 60000);
	}

	buildFaviconUrl(tab) {
		if (tab.favIconUrl) {
			return tab.favIconUrl;
		}

		if (tab.url) {
			let urlStr = tab.url.split('/'),
				urlArr = [],
				favUrl;
			urlArr.push(urlStr[0]);
			urlArr.push(urlStr[2]);
			return urlArr.join('//') + '/favicon.ico';
		}
	}

	update(updatedTab, options) {
		let tabItem = this.get(updatedTab.id);

		options = options || {};

		updatedTab.faviconRenderUrl = this.buildFaviconUrl(updatedTab);

		if (tabItem) {
			let index = this.tabs.indexOf(tabItem);
			this.tabs[index] = $.extend(
				tabItem,
				updatedTab,
				{ 'el': template(updatedTab) },
				{ 'updated': new Date() },
				{ 'time_ago': 0 }
			);

			if (!options.ignoreExtraActions) {
				$.each(this.tabs, (count, tab) => {
					this.suspend(tab);
				});
			}
		}
	}

	remove(tabId, callback) {
		let tabItem = this.get(tabId);

		if (tabItem) {
			var index = this.tabs.indexOf(tabItem);
			delete this.tabs[index];
			// remove empty array indexes
			this.tabs = $.grep(this.tabs, (item) => {
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
	}

	sort() {
		function sortByDate(a, b) {
			return  (b.updated || b.created) - (a.updated || a.created);
		}
		this.tabs.sort(sortByDate);
	}

}


export { Tablist, Tab }

