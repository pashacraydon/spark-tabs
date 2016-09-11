'use strict';

import * as c from './constants.js';

let tooltip = require('tooltip');

let list,
	$list,
	$suspendSelect,
	$filter,
	$resetFilter,
	$body,
	$closeAll;

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

function createTab (tab) {
	chrome.tabs.create({
		'url': tab.get('url')
	}, function () {
		list.remove(tab.get('id'), function () {
			$list.find('#' + tab.get('id')).remove();
		});
	});
}

function onTitleClick (event) {
	let $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), c.radix),
		tab;

	event.preventDefault();
	event.stopPropagation();

	if (!$this.hasClass('js-title')) {
		return false;
	}

	if ($this.closest('li.tab-item').hasClass(c.SUSPENDED_CLASS)) {
		tab = list.get(id);
		createTab(tab);
	}
	else {
		chrome.tabs.update(id, { 'active': true }, function () {
			if (chrome.runtime.lastError) {
				createTab({ 'ur': $this.attr('href') });
			}
		});
	}
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

	if (!$this.closest('a').hasClass('js-reset-filter')) {
		return false;
	}

	$hidden.each(function () {
		$(this).removeClass(c.FILTER_HIDE_CLASS);
	});

	$filter.val('');
	$filter.focus();
	$resetFilter.hide();
	if ($noResults.length) {
		$noResults.remove();
	}
}

function onTabItemHover (event) {
	let $this = $(event.target),
		$tabItem = $this.closest('li.tab-item');

	event.preventDefault();

	$list.find('.' + c.SELECTED_CLASS).removeClass(c.SELECTED_CLASS);
	$tabItem.addClass(c.SELECTED_CLASS);
}

function onCloseAllTabsClick (event) {
	let $this = $(event.target);
	event.preventDefault();
	if (!$this.closest('a').hasClass('js-close-all-tabs')) {
		return false;
	}
	$list.find('li.tab-item:not(:first-child)').each(function (count) {
		let id = parseInt($(this).closest('li.tab-item').attr('id'), c.radix);
		/*
			Because 'chrome.tabs.onRemoved' must destroy tabs,
			we need to get the tab first so we can add it back
			to the list after it has been removed.
		*/
		chrome.tabs.get(id, (tab) => {
			list.set(tab.id, { 'suspended': true, 'pinned': false });
			chrome.tabs.remove(id, () => {
				$(this).closest('li.tab-item').addClass(c.SUSPENDED_CLASS);
			});
		});
	});
}

function moveSelection (direction) {
	let $selected = $list.find('.selected:first'),
		$visibleList = $list.find('li.tab-item').filter(':not(.' + c.FILTER_HIDE_CLASS + ')'),
		selectedIndex = $visibleList.index($selected),
		newIndex = (direction === 'up') ? selectedIndex - 1 : selectedIndex + 1;

	$visibleList.eq(selectedIndex).removeClass(c.SELECTED_CLASS);
	$visibleList.eq(newIndex).addClass(c.SELECTED_CLASS);
}

function onBodyKeyup (event) {
	let pKey = (event.keyCode === c.keys.P_KEY),
		cKey = (event.keyCode === c.keys.C_KEY),
		upKey = (event.keyCode === c.keys.UP_KEY),
		downKey = (event.keyCode === c.keys.DOWN_KEY),
		enterKey = (event.keyCode === c.keys.ENTER_KEY),
		jKey = (event.keyCode === c.keys.J_KEY),
		kKey = (event.keyCode === c.keys.K_KEY);

	event.preventDefault();
	event.stopPropagation();

	if (upKey || kKey) {
		moveSelection('up');
	}

	if (downKey || jKey) {
		moveSelection('down');
	}

	if (pKey) {
		$list.find('.' + c.SELECTED_CLASS + ' .js-pin')[0].click();
	}

	if (cKey) {
		$list.find('.' + c.SELECTED_CLASS + ' .js-close-tab')[0].click();
	}

	if (enterKey) {
		$list.find('.' + c.SELECTED_CLASS + ' .js-title')[0].click();
	}
}

function onFilterKeyup (event) {
	let $this = $(event.target),
		query = $this.val(),
		upKey = (event.keyCode === c.keys.UP_KEY),
		downKey = (event.keyCode === c.keys.DOWN_KEY);

	event.preventDefault();
	event.stopPropagation();

	if (upKey || downKey) {
		$filter.blur();
		onBodyKeyup(event);
	}

	if (query.length > 0) {
		$resetFilter.show();
	}
	else {
		$resetFilter.hide();
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
		$list.on('click', '.js-close-tab', onRemoveTabClick);
		$list.on('click', '.js-title', onTitleClick);
		$list.on('click', '.js-pin', onPinClick);
		$list.on('mouseover', 'li.tab-item', onTabItemHover);
		$filter.on('keyup', onFilterKeyup);
		$body.on('keyup', onBodyKeyup);
		$resetFilter.on('click', onResetFilter);
		$closeAll.on('click', onCloseAllTabsClick);
		tooltip({
			'showDelay': 0
		});
	});

	setTimeout(() => {
		$filter.focus();
	}, 0);
}

chrome.runtime.getBackgroundPage((eventPage) => {
	list = eventPage.list;

	$(document).ready(() => {
		$('fieldset').prepend(
			'<a href="#" class="js-reset-filter reset-filter">' +
				'<img src="' + chrome.extension.getURL('assets/cancel.png') + '" />' +
			'</a>' +
			'<ul class="controls-all-tabs">' +
				'<li class="close-all">' +
					'<a href="#" class="js-close-all-tabs" data-tooltip="Close all tabs">' +
						'<img src="' + chrome.extension.getURL('assets/close-all.png') + '" />' +
					'</a>' +
				'</li>' +
			'</ul>'
		);

		$("img").error(function() {
		  $(this).hide(); // hide broken favicons
		});

		$body = $('body');
		$list = $('.js-tabs-list');
		$filter = $('[type="search"]');
		$resetFilter = $('.js-reset-filter');
		$closeAll = $('.js-close-all-tabs');
		updateInterface(eventPage.list);
	});
});

