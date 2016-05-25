'use strict';

import listItemTpl from './templates/listItem.html'
import { SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';


class Tab {
	constructor (attrs) {

		this.attributes = _.merge({
			'updated': new Date(),
			'suspended': false,
			'whitelisted': false,
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
		this.history = [];
		this.settings = {
			'suspendAfterMins': SUSPEND_AFTER_MINS_DEFAULT,
			'whitelist': []
		};
	}

	render() {
		let deferred = $.Deferred();

		this.sort();

		chrome.tabs.query({ currentWindow: true, active: true }, (queryTabs) => {
			if (!queryTabs[0]) return false;
			var currWindowId = queryTabs[0].windowId,
				elements = '';

			$.each(this.tabs, (count, tab) => {
				if (!tab) return;
				if (tab.get('windowId') === currWindowId) {
					let timeAgo = this.getTimeAgo(tab);
					tab.set({ 'time_ago': timeAgo.friendly });
					tab.set({ 'el': listItemTpl(tab.attributes) });
					elements += tab.get('el');
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
			return (item.get('id') === id);
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
			this.history.push(tabId);
		}

		function get() {
			let prevTabIndex = (this.history.length === 1) ? (this.history.length - 1) : (this.history.length - 2),
				prevTabId = this.history[prevTabIndex];
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
	activeTime() {
		let tab = this.prevActiveTab().get();
		if (!tab) return false;

		let now = new Date(),
			ms = now.getTime() - tab.get('updated').getTime(),
			minutesActive = ms / 60000,
			minutes = tab.get('active_time_mins') ? (tab.get('active_time_mins') + minutesActive) : minutesActive,
			hours = minutes / 60;

		function friendlyTime() {
			let time = '';

			if (hours >= 1) {
				time = Math.floor(hours) + 'h ';
			}

			if (minutes >= 1) {
				time += Math.floor(minutes) + 'm';
			}

			return time;
		}

		function update() {
			tab.set({
				'active_time_mins': minutes,
				'active_time_friendly': friendlyTime()
			});
		}

		return {
			'mins': minutes,
			'friendly': friendlyTime(),
			'update': update
		}
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
		if (!this.settings.whitelist.length) return false;
		if (tab.get('whitelisted')) return true;
		if (tab.get('url')) {
			if (new RegExp(this.settings.whitelist.join("|")).test(tab.get('url'))) {
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
			this.activeTime().update();

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
			return b.get('updated').getTime() - a.get('updated').getTime();
		}
		this.tabs.sort(sortByDate);
	}

}


export { Tablist, Tab }

