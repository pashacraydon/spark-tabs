# Radiant Tabs

A Chrome extension to organize your tabs

## Features

* Suspend tabs after set number of minutes

## Dev

* ```npm install -g gulp webpack```
* ```npm install```

## Running

* Run ```gulp```.
* In the Chrome extensions page, click ```Load unpacked extension...``` and select the ```build``` directory.

The extension will automatically reload on code changes.

## Creating a build

* Add your pem as `config/extension.pem`.
* ```gulp build``` will generate a build in ```./dist```.

## License

Copyright (c) 2016 Pasha Craydon.
