# Spark Tabs

Very simple tabs organization for Chrome

## Features

* Order tabs by recent activity
* Automatically close tabs after idling for set number of minutes
* Whitelist urls so their tabs won't automatically close after idling
* Save closed tabs in the dropdown list
* Filter tabs by keyword
* Navigate tabs with keyboard shortcuts

## Keyboard Shortcuts

* Command + A, toggle tabs popup
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

The extension will automatically reload on code changes.

## Creating a build

* Add your pem as `config/extension.pem`.
* ```gulp build``` will generate a build in ```./dist```.

## License

Copyright (c) 2016 Pasha Craydon.
