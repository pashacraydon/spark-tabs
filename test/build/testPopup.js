webpackJsonp([1],[
/* 0 */
/*!***********************!*\
  !*** multi testPopup ***!
  \***********************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(/*! ./testPopup.js */2);


/***/ },
/* 1 */,
/* 2 */
/*!***********************************************************************!*\
  !*** /Users/pasha/Desktop/development/radiant_tabs/test/testPopup.js ***!
  \***********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _srcJsConstantsJs = __webpack_require__(/*! ../src/js/constants.js */ 3);

	describe('true', function () {
	  it('should be true', function () {
	    console.log(sinon);
	  });
	});

/***/ },
/* 3 */
/*!*************************************************************************!*\
  !*** /Users/pasha/Desktop/development/radiant_tabs/src/js/constants.js ***!
  \*************************************************************************/
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
			value: true
	});
	var SUSPEND_AFTER_MINS_DEFAULT = 20;
	var FILTER_HIDE_CLASS = 'filter-hidden';
	var SELECTED_CLASS = 'selected';
	var keys = {
			'BACKSPACE_KEY': 8,
			'ENTER_KEY': 13,
			'DOWN_KEY': 40,
			'UP_KEY': 38,
			'ESCAPE_KEY': 27
	};
	var radix = 10;

	exports.SUSPEND_AFTER_MINS_DEFAULT = SUSPEND_AFTER_MINS_DEFAULT;
	exports.FILTER_HIDE_CLASS = FILTER_HIDE_CLASS;
	exports.SELECTED_CLASS = SELECTED_CLASS;
	exports.keys = keys;
	exports.radix = radix;

/***/ }
]);