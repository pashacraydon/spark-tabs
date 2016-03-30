'use strict';

import { SUSPEND_AFTER_MINS_DEFAULT, radix } from './constants.js';

let $whitelistSubmit,
  $whitelistInput,
  $selectSuspend,
  $whitelistRegion,
  $errorMsg,
  whitelist = [];

let ERROR_CLASS = 'error';

function validateURL(textval) {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(textval);
}

function template (url) {
  return '<li>' + url +
    '<span class="js-remove"><img src="' + chrome.extension.getURL('assets/close.png') + '" /></span>' +
    '</li>';
}

function onRemoveWhitelistClick (event) {
  let $this = $(event.target),
    $li = $this.closest('li'),
    url = $li.text(),
    index = whitelist.indexOf(url);

  event.preventDefault();
  event.stopPropagation();

  if (index > -1) {
    whitelist.splice(index, 1);
    $li.remove();
  }

  chrome.storage.sync.set({'whitelist': whitelist});
}

function renderWhitelist () {
  let elements = '';
  $.each(whitelist, function (count, url) {
    elements += template(url);
  });
  $whitelistRegion.html(elements);
  $('.js-remove').on('click', onRemoveWhitelistClick);
}

function createWhitelist (url) {
  whitelist.push(url);
  chrome.storage.sync.set({'whitelist': whitelist});
  renderWhitelist();
}

function onWhitelistSubmit (event) {
  var $this = $(event.target),
    url = $whitelistInput.val(),
    isValidUrl = validateURL(url);

  event.preventDefault();
  event.stopPropagation();

  if (!isValidUrl) {
    $whitelistInput.addClass(ERROR_CLASS);
    $errorMsg.show();
  }
  else {
    $whitelistInput.removeClass(ERROR_CLASS);
    $whitelistInput.val('');
    $errorMsg.hide();
    createWhitelist(url);
  }
}

function onSuspendSelectChange (event) {
  let $this = $(event.target),
    newSuspendValue = ($this.val() === "never") ? $this.val() : parseInt($this.val(), radix);

  event.preventDefault();
  event.stopPropagation();

  chrome.storage.sync.set({'suspendAfterMins': newSuspendValue});
}

$(document).ready(() => {
  $whitelistInput = $('.js-whitelist-input');
  $whitelistSubmit = $('.js-whitelist-submit');
  $selectSuspend = $('.js-select-suspend');
  $errorMsg = $('.error-msg');
  $whitelistRegion = $('.js-whitelisted-region');

  chrome.storage.sync.get('suspendAfterMins', (items) => {
    let suspendAfter = (items.suspendAfterMins || SUSPEND_AFTER_MINS_DEFAULT);
    $('.js-select-suspend option[value="' + suspendAfter + '"]').attr('selected', true);
  });

  chrome.storage.sync.get('whitelist', (items) => {
    if (items.whitelist) {
      whitelist = items.whitelist;
    }
    renderWhitelist();
  });

  $whitelistSubmit.on('click', onWhitelistSubmit);
  $selectSuspend.on('change', onSuspendSelectChange);
});

