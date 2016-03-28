'use strict';

import * as c from './constants.js';

let list;
let $list;
let $suspendSelect;
let $filter;
let $resetFilter;

function onRemoveTabClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), c.radix);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-close-tab')) {
		return;
	}

	list.remove(id, function () {
		$list.find('#' + id).remove();
	});
}

function onPinClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), c.radix);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-pin')) {
		return;
	}

	chrome.tabs.update(id, { 'pinned': true }, function () {
		$this.closest('li').hide();
	});
}

function onSuspendClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), c.radix);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-suspend')) {
		return;
	}

	/*
		Because 'chrome.tabs.onRemoved' must destroy tabs,
		we need to get the tab first so we can add it back
		to the list after it has been removed.
	*/
	chrome.tabs.get(id, (tab) => {
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			if (msg.removed) {
				list.addBack(tab);
				$this.closest('li.tab-item').addClass('suspended');
			}
		});

		chrome.tabs.remove(id);
	});
}

function createTab (tab) {
	chrome.tabs.create({
		'url': tab.url
	}, function () {
		list.remove(tab.id, function () {
			$list.find('#' + tab.id).remove();
		});
	});
}

function onTitleClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), c.radix),
		tab;

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-title')) {
		return false;
	}

	if ($this.closest('li.tab-item').hasClass('suspended')) {
		tab = list.get(id);
		createTab(tab);
	}
	else {
		chrome.tabs.update(id, { 'highlighted': true }, function () {
			if (chrome.runtime.lastError) {
				createTab({ 'ur': $this.attr('href') });
			}
		});
	}
}

function moveSelection (direction) {
	let $selected = $list.find('.selected:first'),
		$visibleList = $list.find('li.tab-item').filter(':not(.' + c.FILTER_HIDE_CLASS + ')'),
		selectedIndex = $visibleList.index($selected),
		newIndex = (direction === 'up') ? selectedIndex - 1 : selectedIndex + 1;

	$visibleList.eq(selectedIndex).removeClass(c.SELECTED_CLASS);
	$visibleList.eq(newIndex).addClass(c.SELECTED_CLASS);
}

function noResultsMessage (query) {
	let $tabs = $list.find('li.tab-item'),
		$hidden = $list.find('.' + c.FILTER_HIDE_CLASS),
		$noResults = $list.find('.no-results');

	if ($hidden.length === $tabs.length) {
		let msg = 'There are no tabs with the name "' + query + '"';
		if (!$noResults.length) {
			$list.prepend('<li class="no-results">' + msg + '</li>');
		}
		else {
			$noResults.text(msg);
		}
	}
	else {
		if ($noResults.length) {
			$noResults.remove();
		}
	}
}

function onResetFilter (event) {
	let $this = $(event.target),
		$hidden = $list.find('.' + c.FILTER_HIDE_CLASS),
		$noResults = $list.find('.no-results');

	event.preventDefault();

	$hidden.each(function () {
		$(this).removeClass(c.FILTER_HIDE_CLASS);
	});

	$filter.val('').focus();
	$resetFilter.hide();
	if ($noResults.length) {
		$noResults.remove();
	}
}

function onFilterKeyup (event) {
	let $this = $(event.target),
		query = $this.val(),
		upKey = (event.keyCode === c.keys.UP_KEY),
		downKey = (event.keyCode === c.keys.DOWN_KEY),
		enterKey = (event.keyCode === c.keys.ENTER_KEY);

	event.preventDefault();
	event.stopPropagation();

	if (upKey) {
		moveSelection('up');
	}

	if (downKey) {
		moveSelection('down');
	}

	if (query.length > 0) {
		$resetFilter.show();
	}
	else {
		$resetFilter.hide();
	}

	if (enterKey) {
		$list.find('.' + c.SELECTED_CLASS + ' .js-title')[0].click();
	}

	$list.find('li.tab-item').each(function () {
		let $this = $(this),
			text = $this.find('.title').text().toLowerCase(),
			isMatch = (text.indexOf(query.toLowerCase()) !== -1);

		if (isMatch) {
			$this.removeClass(c.FILTER_HIDE_CLASS);
		}
		else {
			$this.addClass(c.FILTER_HIDE_CLASS);
		}

		noResultsMessage(query);
	});
}

function updateInterface (list) {
	list.render().done(function (elements) {
		$list.html(elements);
	});

	$list.find('li:first').addClass(c.SELECTED_CLASS);
	$list.on('click', '.js-close-tab', onRemoveTabClick);
	$list.on('click', '.js-title', onTitleClick);
	$list.on('click', '.js-pin', onPinClick);
	$list.on('click', '.js-suspend', onSuspendClick);
	$filter.on('keyup', onFilterKeyup);
	$resetFilter.on('click', onResetFilter);
}

chrome.runtime.getBackgroundPage((eventPage) => {
	list = eventPage.list;

	$(document).ready(() => {
		$('fieldset').prepend(
			'<a href="#" class="js-reset-filter reset-filter">' +
				'<img src="' + chrome.extension.getURL('assets/cancel.png') + '" />' +
			'</a>'
		);

		$list = $('.js-tabs-list');
		$filter = $('[type="search"]');
		$resetFilter = $('.js-reset-filter');
		updateInterface(eventPage.list);
	});
});

