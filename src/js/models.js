'use strict';

import listItemTpl from './templates/listItem.html'
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';


class Tab {
	constructor (attrs) {

		this.attributes = _.merge({
			'updated': new Date(),
			'suspended': false,
			'whitelisted': false,
			'totalMinutes': 0,
			'assets': {
				'binPngUrl': chrome.extension.getURL('assets/bin.png'),
				'pinPngUrl': chrome.extension.getURL('assets/pin.png'),
				'closePngUrl': chrome.extension.getURL('assets/close.png')
			}
		}, attrs);

		this.set({ 'el': listItemTpl(this.attributes) });
	}

	destroy() {
		this.attributes = {};
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

		this.sort();

		chrome.tabs.query({ currentWindow: true, active: true }, (queryTabs) => {
			if (!queryTabs[0]) return false;
			var currWindowId = queryTabs[0].windowId,
				elements = '',
				activeTab = this.find(queryTabs[0].id);

			this.updateActiveTime(activeTab);

			$.each(this.tabs, (count, tab) => {
				if (!tab) return;
				if (tab.get('windowId') === currWindowId) {
					let timeAgo = this.getTimeAgo(tab);
					tab.set({ 'time_ago': timeAgo.friendly });
					tab.set({ 'el': listItemTpl(tab.attributes) });
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
		if (this._suspendAfterMins === "never") return false;

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

	/*
		Get the total time a tab has spent in an 'active' state,
		this is the 'previously' active tab after an 'update' event.
	*/
	activeTime(tab) {
		if (!tab) return false;

		let now = new Date(),
			ms = now.getTime() - tab.get('updated').getTime(),
			minutesActive = ms / 60000,
			totalMinutes = tab.get('active_time_mins') ? (tab.get('active_time_mins') + minutesActive) : minutesActive,
			hours = Math.floor(totalMinutes / 60);

		function friendlyTime() {
			let time = '',
				mins = totalMinutes - (hours * 60);

			if (hours >= 1) {
				time = hours + 'h ';
			}

			if (mins) {
				time += mins.toFixed(2) + 'm';
			}

			return time;
		}

		return {
			'mins': totalMinutes,
			'friendly': friendlyTime()
		}
	}

	updateActiveTime(activeTab) {
		let tab = activeTab || this.prevActiveTab().get(),
			activeTime = this.activeTime(tab);
		if (!tab || !activeTime) return false;

		tab.set({
			'active_time_mins': activeTime.mins,
			'active_time_friendly': activeTime.friendly
		});
	}

	buildFaviconUrl(tab) {
		if (tab.has('favIconUrl')) {
			return tab.get('favIconUrl');
		}

		if (tab.get('url')) {
			let urlStr = tab.get('url').split('/'),
				urlArr = [],
				favUrl;
			urlArr.push(urlStr[0]);
			urlArr.push(urlStr[2]);
			return urlArr.join('//') + '/favicon.ico';
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
		var tabItem = this.get(updatedTab.id);

		options || (options = {});

		if (tabItem) {
			let index = this.tabs.indexOf(tabItem),
				tab = this.tabs[index];

			tab.set(tabItem);
			tab.set(updatedTab);

			if (options.listener === "onHighlighted") {
				this.updateActiveTime();
			}

			tab.set({
				'whitelisted': this.isWhitelisted(tab),
				'updated': new Date(),
				'time_ago': 0
			});

			tab.set({ 'faviconRenderUrl': this.buildFaviconUrl(tab) })
			tab.set({ 'el': tab });


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
			return b.get('active_time_mins') - a.get('active_time_mins');
		}
		this.tabs.sort(sortByDate);
	}

}


export { Tablist, Tab }

