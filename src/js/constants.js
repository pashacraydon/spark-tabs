'use strict';

const SUSPEND_AFTER_MINS_DEFAULT = 40;
const FILTER_HIDE_CLASS = 'filter-hidden';
const SELECTED_CLASS = 'selected';
const SUSPENDED_CLASS = 'suspended';
const MAX_TABS_DEFAULT = 8;
const SECONDS_UNTIL_IDLE = 59;
const keys = {
		'BACKSPACE_KEY': 8,
		'ENTER_KEY': 13,
		'DOWN_KEY': 40,
		'UP_KEY': 38,
		'ESCAPE_KEY': 27,
        'P_KEY': 80,
        'T_KEY': 84,
        'C_KEY': 67,
        'J_KEY': 74,
        'K_KEY': 75
	};
const radix = 10;

export { SUSPEND_AFTER_MINS_DEFAULT,
         MAX_TABS_DEFAULT,
         FILTER_HIDE_CLASS,
         SECONDS_UNTIL_IDLE,
         SELECTED_CLASS,
         SUSPENDED_CLASS,
         keys,
         radix
       }