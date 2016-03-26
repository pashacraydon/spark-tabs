'use strict';

import { keys, radix, FILTER_HIDE_CLASS, SELECTED_CLASS, SUSPEND_AFTER_MINS_DEFAULT } from './constants.js';

let list;
let $list;
let $suspendSelect;
let $filter;

function onRemoveTabClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), radix);

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
		id = parseInt($this.closest('li.tab-item').attr('id'), 10);

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
		id = parseInt($this.closest('li.tab-item').attr('id'), 10);

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
	chrome.tabs.get(id, function (tab) {
		chrome.tabs.remove(id, function () {
			setTimeout(function () {
				list.suspendCallback(tab);
				$this.closest('li.tab-item').addClass('suspended');
			}, 300);
		});
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
		id = parseInt($this.closest('li.tab-item').attr('id'), 10),
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
		try {
			chrome.tabs.update(id, { 'highlighted': true });
		}
		catch (error) {
			createTab(tab);
		}
	}
}

function moveSelection (direction) {
	let $selected = $list.find('.selected:first'),
		$visibleList = $list.find('li.tab-item').filter(':not(.' + FILTER_HIDE_CLASS + ')'),
		selectedIndex = $visibleList.index($selected),
		newIndex = (direction === 'up') ? selectedIndex - 1 : selectedIndex + 1;

	$visibleList.eq(selectedIndex).removeClass(SELECTED_CLASS);
	$visibleList.eq(newIndex).addClass(SELECTED_CLASS);
}

function onFilterKeyup (event) {
	let $this = $(event.target),
		query = $this.val(),
		upKey = (event.keyCode === keys.UP_KEY),
		downKey = (event.keyCode === keys.DOWN_KEY),
		enterKey = (event.keyCode === keys.ENTER_KEY);

	event.preventDefault();
	event.stopPropagation();

	if (upKey) {
		moveSelection('up');
	}

	if (downKey) {
		moveSelection('down');
	}

	if (enterKey) {
		$list.find('.' + SELECTED_CLASS + ' .js-title')[0].click();
	}

	$list.find('li').each(function () {
		let $this = $(this),
			text = $this.find('.title').text().toLowerCase(),
			isMatch = (text.indexOf(query.toLowerCase()) !== -1);

		if (isMatch) {
			$this.removeClass(FILTER_HIDE_CLASS);
		}
		else {
			$this.addClass(FILTER_HIDE_CLASS);
		}
	});
}

function updateInterface (list) {
	list.render().done(function (elements) {
		$list.html(elements);
	});

	$list.find('li:first').addClass(SELECTED_CLASS);
	$list.on('click', '.js-close-tab', onRemoveTabClick);
	$list.on('click', '.js-title', onTitleClick);
	$list.on('click', '.js-pin', onPinClick);
	$list.on('click', '.js-suspend', onSuspendClick);
	$filter.on('keyup', onFilterKeyup);
}

chrome.runtime.getBackgroundPage((eventPage) => {
	list = eventPage.list;

	$(document).ready(() => {
		$list = $('.js-tabs-list');
		$filter = $('[type="search"]');
		updateInterface(eventPage.list);
	});
});

