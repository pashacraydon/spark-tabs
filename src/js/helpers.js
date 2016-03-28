'use strict';

function template (data) {
	var suspendedClass = data.suspended ? 'suspended': '',
		suspendedLink = data.suspended ? '' :
			'<a href="#" class="js-suspend suspend-tab">' +
				'<img src="' + chrome.extension.getURL('assets/close.png') + '" title="Close" />' +
			'</a>',
		pinnedLink = (data.pinned || data.suspended) ? '' :
			'<a href="#" class="js-pin pin-tab">' +
				'<img src="' + chrome.extension.getURL('assets/pin.png') + '" title="Pin" />' +
			'</a>',
		faviconUrl = data.faviconRenderUrl ? '<span class="favicon">' +
		  '<img class="favicon" src="' + data.faviconRenderUrl + '" />' +
		  '</span>' : '',
		timeAgoSpan = (data.time_ago === '') ? '' : '<span class="time-ago">' + data.time_ago + '</span>';

	return '<li id="' + data.id + '" class="' + suspendedClass + ' tab-item">' +
		faviconUrl +
		'<span class="title">' +
		'<a href="' + data.url + '" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<ul class="link-options">' +
			'<li>' + timeAgoSpan + '</li>' +
			'<li><a href="#" class="js-close-tab close-tab">' +
				'<img src="' + chrome.extension.getURL('assets/bin.png') + '" title="Trash" />' +
			'</a></li>' +
			'<li>' + pinnedLink + '</li>' +
			'<li>' + suspendedLink + '</li>' +
		'</ul>' +
	'</li>';
}

export { template }