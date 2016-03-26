'use strict';

import { SUSPEND_AFTER_MINS_DEFAULT, radix } from './constants.js';

function onSuspendSelectChange (event) {
  let $this = $(event.target),
    newSuspendValue = ($this.val() === "never") ? $this.val() : parseInt($this.val(), radix);

  event.preventDefault();
  event.stopPropagation();

  chrome.storage.sync.set({'suspendAfterMins': newSuspendValue});
}

$(document).ready(() => {
  chrome.storage.sync.get('suspendAfterMins', (items) => {
    let suspendAfter = (items.suspendAfterMins || SUSPEND_AFTER_MINS_DEFAULT);
    $('.select-suspend option[value="' + suspendAfter + '"]').attr('selected', true);
  });

  $('.select-suspend').on('change', onSuspendSelectChange);
});