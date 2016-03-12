function Tablist () {
	this.tabs = [];
}

Tablist.prototype.get = function (id) {
	if (!this.tabs) return;
	var found = $.grep(this.tabs, function (item) {
		if (item) {
			return item.id === id;
		}
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
	$.each(this.tabs, function (count, tab) {
		var timeAgo = Tablist.prototype.getTimeAgo(tab);
		if (tab.suspended) return false;
		if (timeAgo > 5) {
			chrome.tabs.get(tab.id, function (tabItem) {
				if (chrome.runtime.lastError) {
					return false;
				}
				else {
					chrome.tabs.remove(tab.id);
					$.extend(tab, { 'suspended': true });
					Tablist.prototype.update(tab, { 'skipExtras': true });
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

Tablist.prototype.update = function (updatedTab, options) {
	var tabItem = Tablist.prototype.get.call(this, updatedTab.id);

	options = options || {};

	if (tabItem) {
		var index = list.tabs.indexOf(tabItem);
		list.tabs[index] = $.extend(updatedTab,
			{ 'el': template(updatedTab) },
			{ 'updated': new Date() }
		);

		if (!options.skipExtras) {
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
			chrome.tabs.remove(tab.id, callback);
		});
	}
};

Tablist.prototype.sort = function () {
	function sortByDate(a, b) {
		return  (b.updated || b.created) - (a.updated || a.created);
	}
	return this.tabs.sort(sortByDate);
};

var list = new Tablist();

function buildFaviconUrl (url) {
	var urlStr = url.split('/'),
		urlArr = [];
	urlArr.push(urlStr[0]);
	urlArr.push(urlStr[2]);
	return urlArr.join('//') + '/favicon.ico';
}

function template (data) {
	var faviconUrl,
		suspendedClass = data.suspended ? 'suspended': '';

	if (!data.favIconUrl) {
		if (data.url) {
			faviconUrl = buildFaviconUrl(data.url);
		}
	}
	else {
		faviconUrl = data.favIconUrl;
	}

	return '<li id="' + data.id + '" class="' + suspendedClass + '">' +
		'<span class="favicon"><img src="' + faviconUrl + '" /></span>' +
		'<span class="title">' +
		'<a href="#" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<span class="time-ago">' + data.time_ago + '</span>' +
		'<a href="#" class="js-close-tab close-tab">⊗</a>' +
		'<a href="#" class="js-pin pin-tab">®</a>' +
		'<a href="#" class="js-suspend suspend-tab">∗</a>' +
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

// listen for updates to cached pages
chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	//list.remove(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated.call(this, tab);
	});
});

/*
chrome.tabs.onRemoved.addListener(function (tabId, tab) {
	list.removeTab(tabId);
}); */
