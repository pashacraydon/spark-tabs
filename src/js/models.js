'use strict';

import listItemTpl from './templates/listItem.html'
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';


class Tab {
	constructor (attrs) {
		$.extend(this, attrs);
		this.updated = new Date();
		this.el = listItemTpl(this);
		this.suspended = false;
		this.whitelisted = false;
	}

	destroy() {
		this.el = '';
		this.updated = null;
	}

	set(attrs) {
		$.extend(this, attrs);
	}
}


class Tablist {
	constructor () {
		this.tabs = [];
		this.history = [];
		this.settings = {
			'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT,
			'whitelist': []
		};
	}

	render() {
		let elements = '',
			deferred = $.Deferred();

		this.sort();

		chrome.tabs.query({ currentWindow: true, active: true }, (queryTabs) => {
			if (!queryTabs[0]) return false;
			var currWindowId = queryTabs[0].windowId;

			$.each(this.tabs, (count, tab) => {
				if (!tab) return;
				if (tab.windowId === currWindowId) {
					let timeAgo = this.getTimeAgo(tab);
					tab.time_ago = timeAgo.friendly;
					tab.el = listItemTpl(tab);
					elements += tab.el;
				}
			});
			deferred.resolve(elements);
		});

		return deferred.promise();
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

	create(attrs) {
		let tab = new Tab(attrs);
		this.add(tab);
	}

	add(tab) {
		this.tabs.push(tab);
	}

	last() {
		var index = (this.tabs.length - 1);
		return this.tabs[index];
	}

	first() {
		return this.tabs[0];
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

	suspend(tab) {
		let timeAgo = this.getTimeAgo(tab),
			prevActiveTab = this.prevActiveTab({ 'get': true }),
			limiter = this.settings.suspendAfterMins;

		if (tab.whitelisted) return false;
		if (tab.suspended) return false;
		if (tab.pinned) return false;
		if (this.settings.suspendAfterMins === "never") return false;
		if (prevActiveTab) return false;

		if ((limiter === 1) || (limiter === 3)) {
			if ((limiter === 1) && (timeAgo.hours < 1)) return false;
			if ((limiter === 3) && (timeAgo.hours < 3)) return false;
		}
		else {
			if ((timeAgo.mins < limiter) && (timeAgo.hours < 1)) return false;
		}

		chrome.tabs.get(tab.id, (tabItem) => {
			if (chrome.runtime.lastError) {
				return false;
			}
			else {
				this.set(tab.id, { 'suspended': true, 'pinned': false });
				chrome.tabs.remove(tab.id);
			}
		});
	}

	set(tabId, newAttrs) {
		let tabItem = this.get(tabId);
		if (tabItem) {
			var index = this.tabs.indexOf(tabItem);
			$.extend(this.tabs[index], newAttrs);
		}
	}

	/*
		Get the amount of time in minutes and hours the time
		a tab was last updated (clicked on)

		@param tab {model}
	*/
	getTimeAgo(tab) {
		let now = new Date(),
			diffMs = Math.abs(tab.updated - now),
			minsAgo = Math.round(((diffMs % 86400000) % 3600000) / 60000),
			hoursAgo = Math.floor((diffMs % 86400000) / 3600000),
			time = '';

		function friendlyTime() {
			if (hoursAgo) {
				time = hoursAgo + 'h ';
			}

			if (minsAgo) {
				time += minsAgo + 'm ago';
			}

			return time;
		}

		return {
			'mins': minsAgo,
			'hours': hoursAgo,
			'friendly': friendlyTime()
		}
	}

	/*
		Get the total time a tab has spent in an 'active' state
		@param tab {model}
	*/
	activeTime() {
		let prevActiveTab = this.prevActiveTab({ 'get': true }),
			now = new Date(),
			ms = now.getTime() - prevActiveTab.updated.getTime(),
			minutesActive = ms / 60000,
			minutes = prevActiveTab.active_time ? (prevActiveTab.active_time + minutesActive) : minutesActive,
			hours = minutes / 60,
			time = '';

		function friendlyTime() {
			if (hours >= 1) {
				time = Math.floor(hours) + 'h ';
			}

			if (minutes >= 1) {
				time += Math.floor(minutes) + 'm ago';
			}

			return time;
		}

		return {
			'mins': minutes,
			'hours': hours,
			'friendly': friendlyTime()
		}
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

	isWhitelisted(tab) {
		if (!this.settings.whitelist.length) return false;
		if (tab.whitelisted) return true;
		if (tab.url) {
			if (new RegExp(this.settings.whitelist.join("|")).test(tab.url)) {
			   return true;
			}
		}
		return false;
	}

	update(updatedTab, options) {
		var tabItem = this.get(updatedTab.id);

		options = options || {};

		updatedTab.faviconRenderUrl = this.buildFaviconUrl(updatedTab);

		if (tabItem) {
			let index = this.tabs.indexOf(tabItem);
			this.tabs[index].active_time = this.activeTime().friendly;
			this.tabs[index] = $.extend(
				tabItem,
				updatedTab,
				{ 
					'el': listItemTpl(updatedTab) 
				},
				{ 
					'updated': new Date() 
				},
				{ 
					'time_ago': 0 
				}
			);

			$.extend(this.tabs[index],
				{ 'whitelisted': this.isWhitelisted(this.tabs[index])
			});

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
			return b.updated.getTime() - a.updated.getTime();
		}
		this.tabs.sort(sortByDate);
	}

}


export { Tablist, Tab }

