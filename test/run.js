/*
  Entry point for all mocha tests that run in node
    - This sets up a few requirements as globals which don't play well with webpack
    - Creates a mocked browser DOM via jsdom, allows you to use jQuery DOM manipulation
      as you would in a browser, in your tests.
*/

global.jsdom = require('jsdom');
global.sinon = require('sinon');
global.chai = require('chai');
global.chrome = require('sinon-chrome');
global.document = jsdom.jsdom(
	'<!DOCTYPE html>' +
		'<html>' +
			'<head>' +
			'</head>' +
				'<body>' +
			        '<fieldset>' +
			          '<labe>Filter</label>' +
			          '<input type=\"search\" placeholder=\"e.g. The New York Times\">' +
			          '<div class=\"select-suspend\">' +
			            '<label>Suspend after</label>' +
			            '<select>' +
			              '<option value=\"5\">5 mins</option>' +
			              '<option value=\"10\">10 mins</option>' +
			              '<option value=\"20\">20 mins</option>' +
			              '<option value=\"30\">30 mins</option>' +
			              '<option value=\"40\">40 mins</option>' +
			              '<option value=\"never\">never</option>' +
			          '</select>' +
			      '</div>' +
			      '</fieldset>' +
			        '<ul class=\"js-tabs-list tab-list\"></ul>' +
				'</body>' +
		'</html>'
	);
global.window = document.defaultView;
global.navigator = window.navigator;

// Stub out the native browser function 'Element' 
// which the react package clipboard.js expects to exist.
var BrowserElement = function matches() {};
BrowserElement.prototype.matches = {};
global.Element = BrowserElement;

require('./build/testEventPage.js');
require('./build/testPopup.js');
require('./build/testModels.js');
