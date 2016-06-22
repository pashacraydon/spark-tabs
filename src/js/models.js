'use strict';

import listItemTpl from './templates/listItem.html'
import { SUSPEND_AFTER_MINS_DEFAULT, MAX_TABS_DEFAULT } from './constants.js';
let GOOGLE_FAVICON_DOMAIN_URL = 'https://plus.google.com/_/favicon?domain_url=';

class Tab {
	constructor (attrs) {
		attrs || (attrs = {});
		this.attributes = _.merge({
			'id': 1,
			'updated': new Date(),
			'suspended': false,
			'whitelisted': false,
			'active_time': 0,
			'active_time_friendly': '0s',
			'active_time_update': new Date(),
			'assets': {
				'binPngUrl': chrome.extension.getURL('assets/bin.png'),
				'pinPngUrl': chrome.extension.getURL('assets/pin.png'),
				'closePngUrl': chrome.extension.getURL('assets/close.png')
			}
		}, attrs);

		this.setFaviconUrl();
		this.set({ 'el': listItemTpl(this.attributes) });
	}

	destroy() {
		this.attributes = {};
	}

	setFaviconUrl() {
		var delay = 0,
			faviconUrl;

		if (this.has('favIconUrl')) {
			faviconUrl = this.get('favIconUrl');
		}
		else {
			delay = 100;
			faviconUrl = GOOGLE_FAVICON_DOMAIN_URL + this.get('url');
		}

		setTimeout(() => {
			this.set({ 'faviconRenderUrl': faviconUrl });
		}, delay);
	}

	set(changeset) {
		_.merge(this.attributes, changeset);
	}

	get(attr) {
		return this.attributes[attr];
	}

	has(attr) {
		if (this.attributes[attr]) return true;
		return false;
	}
}


class Tablist {
	constructor () {
		this.tabs = [];
		this._history = [];
		this._suspendAfterMins = SUSPEND_AFTER_MINS_DEFAULT;
		this._maxTabs = MAX_TABS_DEFAULT;
		this._whitelist = [];
	}

	destroy() {
		this.tabs = [];
		this._history = [];
		this._suspendAfterMins = 0;
		this._whitelist = [];
	}

	render() {
		let deferred = $.Deferred();

		chrome.tabs.query({ currentWindow: true, active: true }, (queryTabs) => {
			if (!queryTabs[0]) return false;
			var currWindowId = queryTabs[0].windowId,
				elements = '',
				activeTab = this.find(queryTabs[0].id);

			this.activeTime().update(activeTab);
			this.activeTime().calcTotalActiveTime(currWindowId);
			this.sort();

			if (activeTab) {
				activeTab.set({ 'updated': new Date() });
			}

			$.each(this.tabs, (count, tab) => {
				if (!tab) return;
				if (tab.get('windowId') === currWindowId) {
					let timeAgo = this.getTimeAgo(tab);
					tab.set({ 'time_ago': timeAgo.friendly });
					tab.set({ 'percent': this.activeTime().asPercent(tab) });

					if (activeTab && tab.get('id') === activeTab.get('id')) tab.set({ 'currentActive': true });
					tab.set({ 'el': listItemTpl(tab.attributes) });
					tab.set({ 'currentActive': false });

					chrome.tabs.move(tab.get('id'), { 'index': count }, function () {
						if (chrome.runtime.lastError) return false;
					});

					elements += tab.get('el');
				}
			});

			deferred.resolve(elements);
		});

		return deferred.promise();
	}

	find(tabId) {
		return _.find(this.tabs, function (tab) {
			return tab.get('id') === tabId;
		});
	}

	get(tabId) {
		if (!this.tabs) return;
		let found = $.grep(this.tabs, (tab) => {
			return (tab.get('id') === tabId);
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

	prevActiveTab() {
		function add(tabId) {
			this._history.push(tabId);
		}

		function get() {
			let prevTabIndex = (this._history.length === 1) ? (this._history.length - 1) : (this._history.length - 2),
				prevTabId = this._history[prevTabIndex];
			return this.get(prevTabId);
		}

		return {
			'get': $.proxy(get, this),
			'add': $.proxy(add, this)
		}
	}

	getActiveTabs() {
		return _.filter(this.tabs, function (tab) {
			return !tab.get('suspended');
		});
	}

	/*
		Determines if a tab should be closed but stored in the dropdown
	*/
	suspend(tab) {
		let timeAgo = this.getTimeAgo(tab),
			prevActiveTab = this.prevActiveTab().get(),
			limiter = this._suspendAfterMins;

		if (tab.get('whitelisted')) return false;
		if (tab.get('suspended')) return false;
		if (tab.get('pinned')) return false;
		if (this._maxTabs === "infinite") return false;
		if (this._suspendAfterMins === "never") return false;
		if (tab.get('priority') < this._maxTabs) return false;
		if (this.getActiveTabs().length < this._maxTabs) return false;

		if ((limiter === 1) || (limiter === 3)) {
			if ((limiter === 1) && (timeAgo.hours < 1)) return false;
			if ((limiter === 3) && (timeAgo.hours < 3)) return false;
		}
		else {
			if ((timeAgo.mins < limiter) && (timeAgo.hours < 1)) return false;
		}

		chrome.tabs.get(tab.get('id'), (tabItem) => {
			if (chrome.runtime.lastError) {
				return false;
			}
			else {
				this.set(tab.get('id'), { 'suspended': true, 'pinned': false });
				chrome.tabs.remove(tab.get('id'));
			}
		});
	}

	set(tabId, newAttrs) {
		let tabItem = this.get(tabId);
		if (tabItem) {
			var index = this.tabs.indexOf(tabItem);
			this.tabs[index].set(newAttrs);
		}
	}

	/*
		Get the amount of time in minutes and hours the time
		a tab was last updated (clicked on)

		@param tab {model}
	*/
	getTimeAgo(tab) {
		let now = new Date(),
			diffMs = Math.abs(tab.get('updated') - now),
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

	onSystemStateChange(newState) {
		let tab = this.get(this._currentActiveTabId);
		if (!tab) return false;

		if (newState !== "active") {
			this.activeTime().stop(tab);
		}
		else {
			this.activeTime().start(tab);
		}
	}

	onWindowFocusChanged(windowId) {
		let tab = this.get(this._currentActiveTabId);
		if (!tab) return false;
		this.activeTime().stop(tab);
	}

	/*
		Get the total time a tab has spent in an 'active' state,
		this is the 'previously' active tab after an 'update' event or
		the 'active_time_update' if no tabs have been updated.
	*/
	activeTime() {
		let self = this;

		/* Return a human friendly version of the time in string format */
		function friendlyTime(milliseconds) {
			let time = '',
				seconds = Math.floor((milliseconds / 1000) % 60),
				minutes = Math.floor((milliseconds / (1000*60)) % 60),
				hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);

			if (hours >= 1) {
				time = hours + 'h ';
			}

			if (minutes >= 1) {
				time += minutes + 'm ';
			}

			time += seconds + 's ';

			return time;
		}

		/* Create a cached value of the total active time for tabs specific to a certain window */
		function calcTotalActiveTime(windowId) {
			var totalActiveTimeArray = _
			  .chain(self.tabs)
			  .filter(function (tab) {
			  	return tab.get('windowId') === windowId;
			  })
			  .map(function (tab) {
			  	return tab.get('active_time');
			  })
			  .value();

		 	if (totalActiveTimeArray.length) {
		 		self._totalActiveTime = totalActiveTimeArray
		 			.reduce(function (sum, n) {
			  			return sum + n
			 		});
		 	}
		 	else {
		 		self._totalActiveTime = 0;
		 	}
		}

		/* Return the time a tab has been active as a percentage */
		function asPercent(tab) {
			if (self._totalActiveTime > 0) {
				return ((tab.get('active_time') / self._totalActiveTime)) * 100;
			}
		}

		/*
			1. Calculate the difference between now and the last time a tab was updated.
			2. Set this new time on the tab.
		*/
		function update(activeTab) {
			let tab = activeTab || self.prevActiveTab().get();
			if (!tab) return false;

			let now = new Date(),
				activeTabChanged = (self._updated !== tab.get('updated').getTime()),
				milliseconds;

			if (activeTabChanged) {
				milliseconds = (now.getTime() - tab.get('updated').getTime()) + tab.get('active_time');
			}
			else {
				milliseconds = (now.getTime() - tab.get('active_time_update').getTime()) + tab.get('active_time');
			}

			self._updated = tab.get('updated').getTime();

			tab.set({
				'active_time': milliseconds,
				'active_time_friendly': friendlyTime(milliseconds),
				'active_time_update': new Date()
			});
		}

		function stop(tab) {
			update(tab);
		}

		function start(tab) {
			tab.set({
				'updated': new Date(),
				'active_time_update': new Date()
			});
		}

		return {
			'asPercent': asPercent,
			'calcTotalActiveTime': calcTotalActiveTime,
			'update': update,
			'stop': stop,
			'start': start
		}
	}

	isWhitelisted(tab) {
		if (!this._whitelist.length) return false;
		if (tab.get('whitelisted')) return true;
		if (tab.get('url')) {
			if (new RegExp(this._whitelist.join("|")).test(tab.get('url'))) {
			   return true;
			}
		}
		return false;
	}

	/*
		Updates occur on all chrome listener events in the eventPage
	*/
	update(updatedTab, options) {
		var tab = this.get(updatedTab.id),
			reset = 0;

		options || (options = {});

		if (tab) {
			tab.set(updatedTab);

			if (options.listener === "onHighlighted") {
				this.activeTime().update();
			}

			tab.set({
				'whitelisted': this.isWhitelisted(tab),
				'updated': new Date(),
				'time_ago': 0
			});

			this._currentActiveTabId = tab.get('id');

			if (!options.ignoreExtraActions) {
				this.sort();
				$.each(this.tabs, (count, tab) => {
					tab.set({ 'priority': count });
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
			return b.get('active_time') - a.get('active_time');
		}
		this.tabs.sort(sortByDate);
	}

}


export { Tablist, Tab }

