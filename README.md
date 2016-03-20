# Radiant Tabs

A Chrome extension to organize your tabs

## Features

* Order tabs by recent activity with color-coded 'heat' gradient
* Suspend tabs after set number of minutes
* Filter tabs by keyword
* Navigate tabs with keyboard shortcuts

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
