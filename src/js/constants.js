'use strict';

const SUSPEND_AFTER_MINS_DEFAULT = 20;
const FILTER_HIDE_CLASS = 'filter-hidden';
const SELECTED_CLASS = 'selected';
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
    'k_KEY': 75
	};
const radix = 10;

export { SUSPEND_AFTER_MINS_DEFAULT,
         FILTER_HIDE_CLASS,
         SELECTED_CLASS,
         keys,
         radix
       }