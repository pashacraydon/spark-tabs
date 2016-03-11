var $list = $('.js-tabs-list'),
	FILTER_HIDE_CLASS = 'filter-hidden',
	SELECTED_CLASS = 'selected',
    keys = {
      'BACKSPACE_KEY': 8,
      'ENTER_KEY': 13,
      'DOWN_KEY': 40,
      'UP_KEY': 38,
      'ESCAPE_KEY': 27
    };

function onRemoveTabClick (event) {
	event.preventDefault();
	event.stopPropagation();
	var $this = $(event.target),
		id = parseInt($this.closest('li').attr('id'), 10);

	if ($this.hasClass('js-title') || $this.hasClass('js-pin')) {
		return;
	}

	chrome.tabs.remove(id, function () {
		$list.find('#' + id).remove();
	});
}

function onPinClick (event) {
	event.preventDefault();
	event.stopPropagation();
	var $this = $(event.target),
		id = parseInt($this.closest('li').attr('id'), 10);

	if ($this.hasClass('js-title')) {
		return;
	}

	chrome.tabs.update(id, { 'pinned': true });
}

function onTitleClick (event) {
	event.preventDefault();
	event.stopPropagation();
	var $this = $(event.target),
		id = parseInt($this.closest('li').attr('id'), 10);
	chrome.tabs.update(id, { 'highlighted': true });
}

function moveSelection (direction) {
	var $selected = $list.find('.selected:first'),
		$visibleList = $list.find('li').filter(':not(.' + FILTER_HIDE_CLASS + ')'),
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
	updateInterface(eventsPage.list).done(function (buildList) {
		$list.html(buildList);
		$list.find('li:first').addClass(SELECTED_CLASS);
		$list.on('.js-close-tab click', onRemoveTabClick);
		$list.on('.js-title click', onTitleClick);
		$list.on('.js-pin click', onPinClick);
		$('[type="search"]').on('keyup', onFilterKeyup);
	});
});

