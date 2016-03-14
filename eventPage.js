var list;

function buildFaviconUrl (url) {
	var urlStr = url.split('/'),
		urlArr = [];
	urlArr.push(urlStr[0]);
	urlArr.push(urlStr[2]);
	return urlArr.join('//') + '/favicon.ico';
}

function Tablist () {
	this.tabs = [];
	// history of active tab id's
	this.history = [];
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

		if (timeAgo > 1) {
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
		var index = list.tabs.indexOf(tabItem);
		$.extend(list.tabs[index], newAttrs);
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
		var index = list.tabs.indexOf(tabItem);
		list.tabs[index] = $.extend(updatedTab,
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
		var index = list.tabs.indexOf(tabItem);
		delete list.tabs[index];
		// remove empty array indexes
		list.tabs = $.grep(list.tabs, function (item) {
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

list = new Tablist();

function template (data) {
	var suspendedClass = data.suspended ? 'suspended': '',
		suspendedLink = data.suspended ? '' :
			'<a href="#" class="js-suspend suspend-tab">' +
				'<img src="' + chrome.extension.getURL('images/suspend.png') + '" title="Suspend tab" />' +
			'</a>',
		pinnedLink = (data.pinned || data.suspended) ? '' :
			'<a href="#" class="js-pin pin-tab">' +
				'<img src="' + chrome.extension.getURL('images/pin.png') + '" title="Pin tab" />' +
			'</a>';

	return '<li id="' + data.id + '" class="' + suspendedClass + ' tab-item">' +
		'<span class="favicon"><img class="favicon" src="' + data.faviconRenderUrl + '" /></span>' +
		'<span class="title">' +
		'<a href="#" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<span class="time-ago">' + data.time_ago + '</span>' +
		'<ul class="link-options">' +
			'<li><a href="#" class="js-close-tab close-tab">' +
				'<img src="' + chrome.extension.getURL('images/bin.png') + '" title="Close tab" />' +
			'</a></li>' +
			'<li>' + pinnedLink + '</li>' +
			'<li>' + suspendedLink + '</li>' +
		'</ul>' +
	'</li>';
}

function Tab (attrs) {
	this.attrs = attrs;
	this.id = attrs.id;
	this.created = new Date();
	this.el = template(attrs);
}

function onTabUpdated (tab) {
	if (!list.get(tab.id)) {
		var item = new Tab(tab);
		list.add(item);
	}
	else {
		list.update(tab);
	}
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
	list.history.push(activeInfo.tabId);
	var prevTabIndex = (list.history.length === 1) ? (list.history.length - 1) : (list.history.length - 2),
		prevTabId = list.history[prevTabIndex];

	setTimeout(function () {
		var prevActiveTab = list.get(prevTabId);
		if (prevActiveTab) {
			list.set(prevActiveTab.id, { 'updated': new Date() });
		}
	}, 200);
});

chrome.tabs.onHighlighted.addListener(function (info) {
	var self = this;
	$.each(info.tabIds, function (index, tabId) {
		chrome.tabs.get(tabId, function (tab) {
			onTabUpdated.call(self, tab);
		});
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	onTabUpdated.call(this, tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		onTabUpdated.call(this, tab);
	});
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	list.destroyTab(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated.call(this, tab);
	});
});

chrome.tabs.onRemoved.addListener(function (tabId, tab) {
	list.destroyTab(tabId);
});
