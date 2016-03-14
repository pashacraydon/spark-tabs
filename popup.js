var $list = $('.js-tabs-list'),
	FILTER_HIDE_CLASS = 'filter-hidden',
	SELECTED_CLASS = 'selected',
	keys = {
		'BACKSPACE_KEY': 8,
		'ENTER_KEY': 13,
		'DOWN_KEY': 40,
		'UP_KEY': 38,
		'ESCAPE_KEY': 27
	},
	list,
	radix = 10;

function onRemoveTabClick (event) {
	var $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), radix);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-close-tab')) {
		return;
	}

	list.destroyTab(id, function () {
		$list.find('#' + id).remove();
	});
}

function onPinClick (event) {
	var $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), 10);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-pin')) {
		return;
	}

	chrome.tabs.update(id, { 'pinned': true });
}

function onSuspendClick (event) {
	var $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), 10);

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-suspend')) {
		return;
	}

	/*
		Get the tab first so we can add it back
		to the list after it has been removed.
	*/
	chrome.tabs.get(id, function (tab) {
		chrome.tabs.remove(id, function () {
			list.add(tab);
			list.update(tab, { 'ignoreExtraActions' : true });
			list.set(tab.id, { 'suspended': true, 'pinned': false });
			$this.closest('li').addClass('suspended');
		});
	});
}

function createTab (tab) {
	chrome.tabs.create({
		'url': tab.url
	}, function () {
		list.destroyTab(tab.id, function () {
			$list.find('#' + tab.id).remove();
		});
	});
}

function onTitleClick (event) {
	var $this = $(event.target),
		id = parseInt($this.closest('li.tab-item').attr('id'), 10),
		tab;

	event.preventDefault();
	event.stopPropagation();

	if (!$this.closest('a').hasClass('js-title')) {
		return false;
	}

	if ($this.closest('li').hasClass('suspended')) {
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
	var $selected = $list.find('.selected:first'),
		$visibleList = $list.find('li.tab-item').filter(':not(.' + FILTER_HIDE_CLASS + ')'),
		selectedIndex = $visibleList.index($selected),
		newIndex = (direction === 'up') ? selectedIndex - 1 : selectedIndex + 1;

	$visibleList.eq(selectedIndex).removeClass(SELECTED_CLASS);
	$visibleList.eq(newIndex).addClass(SELECTED_CLASS);
}

function onFilterKeyup (event) {
	var $this = $(event.target),
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
		var $this = $(this),
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
	var buildList = '',
		deferred = $.Deferred();

	$.each(list.tabs, function (count, tab) {
		if (!tab) return;
		if (tab.title !== "New Tab") {
			list.addTime(tab.id);
			buildList += tab.el;
		}

		if (count === (list.tabs.length - 1)) {
			deferred.resolve(buildList);
		}
	});

	return deferred.promise();
}

chrome.runtime.getBackgroundPage(function (eventsPage) {
	list = eventsPage.list;
	updateInterface(eventsPage.list).done(function (buildList) {
		$list.html(buildList);
		$list.find('li:first').addClass(SELECTED_CLASS);
		$list.on('click', '.js-close-tab', onRemoveTabClick);
		$list.on('click', '.js-title', onTitleClick);
		$list.on('click', '.js-pin', onPinClick);
		$list.on('click', '.js-suspend', onSuspendClick);
		$('[type="search"]').on('keyup', onFilterKeyup);
	});
});

