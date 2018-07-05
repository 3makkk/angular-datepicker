// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import {getTestBed} from '@angular/core/testing';
import {
	BrowserDynamicTestingModule,
	platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';

// Unfortunately there's no typing for the `__karma__` variable. Just declare it as any.
declare const __karma__: any;
declare const require: any;

// Prevent Karma from running prematurely.
__karma__.loaded = function () {
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
	BrowserDynamicTestingModule,
	platformBrowserDynamicTesting()
);
// Then we find all the tests.
const contextDemo = require.context('./src/demo', true, /\.spec\.ts$/);
// And load the modules.
contextDemo.keys().map(contextDemo);

// Then we find all the tests.
const contextLibs = require.context('./src/libs', true, /\.spec\.ts$/);
// And load the modules.
contextLibs.keys().map(contextLibs);

// Finally, start Karma to run the tests.
__karma__.start();
