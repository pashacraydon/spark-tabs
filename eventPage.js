function TabList () {
	this.tabs = [];
}

/*
	chrome.notifications.create('title-stuff', {
		'type': 'basic',
		'iconUrl': 'icon.png',
		'title': 'stuff',
		'message': JSON.stringify(tab) },
		function () {
	}); */

TabList.prototype.get = function (id) {
	var found = $.grep(this.tabs, function (item) {
		if (item) {
			return item.id === id;
		}
	});
	return found[0];
};

TabList.prototype.create = function (tab) {
	this.tabs.push(tab);
};

TabList.prototype.update = function (tabId, tab) {
	var tabItem = TabList.prototype.get.call(this, tabId);
	if (tabItem) {
		var index = list.tabs.indexOf(tabItem);
		list.tabs[index] = $.extend(tab,
			{ 'el': template(tab) },
			{ 'updated': new Date() }
		);
		TabList.prototype.sort.call(this);
	}
};

TabList.prototype.addTime = function (tabId) {
	var tabItem = TabList.prototype.get.call(this, tabId),
		now = new Date(),
		diffMs = Math.abs(tabItem.updated - now),
		diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);

	tabItem.time_ago = (diffMins > 1) ? (diffMins + ' mins') : (diffMins + ' min');
	tabItem.el = template(tabItem);
};

TabList.prototype.remove = function (tabId, tab) {
	var tabItem = TabList.prototype.get.call(this, tabId);
	if (tabItem) {
		var index = list.tabs.indexOf(tabItem);
		delete list.tabs[index];
		// remove empty array indexes
		list.tabs = $.grep(list.tabs, function (item) {
			return (item === 0) || item;
		});
	}
};

TabList.prototype.sort = function () {
	function sortByDate(a, b) {
		return  (b.updated || b.created) - (a.updated || a.created);
	}
	return this.tabs.sort(sortByDate);
};

var list = new TabList();

function buildFaviconUrl (url) {
	var urlStr = url.split('/'),
		urlArr = [];
	urlArr.push(urlStr[0]);
	urlArr.push(urlStr[2]);
	return urlArr.join('//') + '/favicon.ico';
}

function template (data) {
	var faviconUrl;
	if (!data.favIconUrl) {
		if (data.url) {
			faviconUrl = buildFaviconUrl(data.url);
		}
	}
	else {
		faviconUrl = data.favIconUrl;
	}

	return '<li id="' + data.id + '">' +
		'<span class="favicon"><img src="' + faviconUrl + '" /></span>' +
		'<span class="title">' +
		'<a href="#" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<div class="hover-panel">' +
			'<a href="#" class="js-activate"> Activate </a>' +
			'<a href="#" class="js-close-tab close-tab"> Close</a>' +
			'<a href="#" class="js-pin pin-tab"> Pin</a>' +
		'</div>' +
		'<span class="time-ago">' + data.time_ago + '</span>' +
	'</li>';
}

function TabItem (attrs) {
	this.attrs = attrs;
	this.id = attrs.id;
	this.created = new Date();
	this.el = template(attrs);
}

function onTabUpdated (tabId, tab) {
	if (!list.get(tabId)) {
		var item = new TabItem(tab);
		list.create(item);
	}
	else {
		list.update(tabId, tab);
	}
}

chrome.tabs.onHighlighted.addListener(function (info) {
	var self = this;
	$.each(info.tabIds, function (index, tabId) {
		chrome.tabs.get(tabId, function (tab) {
			onTabUpdated.call(self, tab.id, tab);
		});
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	onTabUpdated.call(this, tabId, tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		onTabUpdated.call(this, tab.id, tab);
	});
});

// listen for updates to cached pages
chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	list.remove(removedTabId);
	chrome.tabs.get(addedTabId, function (tab) {
		onTabUpdated.call(this, tab.id, tab);
	});
});

chrome.tabs.onRemoved.addListener(function (tabId, tab) {
	list.remove(tabId);
});
