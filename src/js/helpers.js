'use strict';

function template (data) {
	var suspendedClass = data.suspended ? 'suspended': '',
		whitelistedClass = data.whitelisted ? 'whitelisted': '',
		suspendedLink = data.suspended ? '' :
			'<a href="#" class="js-suspend suspend-tab" data-tooltip="Close tab">' +
				'<img src="' + chrome.extension.getURL('assets/close.png') + '" />' +
			'</a>',
		pinnedLink = (data.pinned || data.suspended) ? '' :
			'<a href="#" class="js-pin pin-tab" data-tooltip="Pin tab">' +
				'<img src="' + chrome.extension.getURL('assets/pin.png') + '" />' +
			'</a>',
		faviconUrl = data.faviconRenderUrl ? '<span class="favicon">' +
		  '<img class="favicon" src="' + data.faviconRenderUrl + '" />' +
		  '</span>' : '',
		timeAgoSpan = (data.time_ago === '') ? '' : '<span class="time-ago">' + data.time_ago + '</span>';

	return '<li id="' + data.id + '" class="' + suspendedClass + ' tab-item ' + whitelistedClass + '">' +
		faviconUrl +
		'<span class="title">' +
		'<a href="' + data.url + '" class="js-title">' + data.title + '</a>' +
		'</span>' +
		timeAgoSpan +
		'<ul class="link-options">' +
			'<li><a href="#" class="js-close-tab close-tab" data-tooltip="Throw out tab">' +
				'<img src="' + chrome.extension.getURL('assets/bin.png') + '" />' +
			'</a></li>' +
			'<li>' + pinnedLink + '</li>' +
			'<li>' + suspendedLink + '</li>' +
		'</ul>' +
	'</li>';
}

export { template }