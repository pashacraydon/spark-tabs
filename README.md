# Spark Tabs

Automated tabs organization for Chrome.

![alt tag](https://github.com/pashasc/spark_tabs/blob/master/screenshot.jpg)

Visit on the [Chrome store](https://chrome.google.com/webstore/detail/spark-tabs/mcbakkceggomfmikgcmcncoobaclkbam/ "Spark Tabs Chrome Extension")

## Features

* Tabs are ordered according to their longest activity
* Opening the popup will re-order the tabs in your window by their longest activity (left to right)
* Optionally, set a maximum number of tabs and idle countdown to automatically close your least used tabs
	* These tabs are saved in a 'dimmed' state in the dropdown
* Whitelist urls so their tabs won't automatically close after idling (optional)
* Close all tabs with one click
* Find tabs quickly by filtering them by keyword
* Close, pin and navigate tabs with keyboard shortcuts

## Keyboard Shortcuts

* Command + Shift + Z, toggle tabs popup
* ↑ or k, navigate up one tab
* ↓ or j, navigate down one tab
* p, pin tab
* t, close tab and throw out from list
* c, close tab but leave 'dimmed' in list
* esc, clear filter text

## Dev

* ```npm install -g gulp webpack```
* ```npm install```

## Tests

* Run ```gulp test``` , this will autocompile test files on changes
* Run ```gulp connect``` to run a mocha server, then visit http://localhost:8080/test/runner.html

## Running

* Run ```gulp```.
* In the Chrome extensions page, click ```Load unpacked extension...``` and select the ```build``` directory.

## Creating a build

* ```gulp build``` will generate a build in ```./dist```.

## License

Copyright (c) 2016 Pasha Craydon.
