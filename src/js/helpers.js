'use strict';

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
		faviconUrl = data.faviconRenderUrl ? '<span class="favicon">' +
		  '<img class="favicon" src="' + data.faviconRenderUrl + '" />' +
		  '</span>' : '',
		timeAgo = (data.time_ago === 0 || data.time_ago === undefined) ? '' : ((data.time_ago === 1) ? (data.time_ago + ' min') : (data.time_ago + ' mins')),
		timeAgoSpan = (timeAgo === '') ? '' : '<span class="time-ago">' + timeAgo + '</span>';

	return '<li id="' + data.id + '" class="' + suspendedClass + ' tab-item">' +
		faviconUrl +
		'<span class="title">' +
		'<a href="#" class="js-title">' + data.title + '</a>' +
		'</span>' +
		'<ul class="link-options">' +
			'<li>' + timeAgoSpan + '</li>' +
			'<li><a href="#" class="js-close-tab close-tab">' +
				'<img src="' + chrome.extension.getURL('assets/bin.png') + '" title="Remove tab" />' +
			'</a></li>' +
			'<li>' + pinnedLink + '</li>' +
			'<li>' + suspendedLink + '</li>' +
		'</ul>' +
	'</li>';
}

export { template }