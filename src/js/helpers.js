'use strict';

function buildFaviconUrl (url) {
	var urlStr = url.split('/'),
		urlArr = [];
	urlArr.push(urlStr[0]);
	urlArr.push(urlStr[2]);
	return urlArr.join('//') + '/favicon.ico';
}

function template (data) {
	var suspendedClass = data.suspended ? 'suspended': '',
		suspendedLink = data.suspended ? '' :
			'<a href="#" class="js-suspend suspend-tab">' +
				'<img src="' + chrome.extension.getURL('assets/suspend.png') + '" title="Suspend tab" />' +
			'</a>',
		pinnedLink = (data.pinned || data.suspended) ? '' :
			'<a href="#" class="js-pin pin-tab">' +
				'<img src="' + chrome.extension.getURL('assets/pin.png') + '" title="Pin tab" />' +
			'</a>',
		timeAgo = (data.time_ago === 0 || data.time_ago === undefined) ? '' : ((data.time_ago === 1) ? (data.time_ago + ' min') : (data.time_ago + ' mins'));

	return '<li id="' + data.id + '" class="' + suspendedClass + ' tab-item">' +
		'<span class="favicon"><img class="favicon" src="' + data.faviconRenderUrl + '" /></span>' +
		'<span class="title">' +
		'<a href="#" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<span class="time-ago">' + timeAgo + '</span>' +
		'<ul class="link-options">' +
			'<li><a href="#" class="js-close-tab close-tab">' +
				'<img src="' + chrome.extension.getURL('assets/bin.png') + '" title="Close tab" />' +
			'</a></li>' +
			'<li>' + pinnedLink + '</li>' +
			'<li>' + suspendedLink + '</li>' +
		'</ul>' +
	'</li>';
}

export { buildFaviconUrl, template }