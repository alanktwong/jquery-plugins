An adaptation of jQuery.jqlog (http://code.google.com/p/jqlog/):
a logging framework plugin for jQuery.

The plugin has been refactored to pull together all the JS files
inside one object, log4jq, and has been made configurable.
 
It also depends on  `json2.js`, `jquery.pubsub` & (optionally) `jquery.cookie`.

# Overview

A logging framework plugin for jQuery that can be configured and extended allowing you to "roll your own" logging framework. The API is meant to resemble server-side logging frameworks like log4j.

# Quick Start

The core framework allows you to log messages using the public functions or via the jQuery selector syntax allowing you to log each selected element (useful for debugging selectors!).

    $(document).ready(function() {
        $.configureLog4jq({ enabled: true });
        $.debug("Log entry");
        $.info("Information entry");
        $.warn("Warning entry");
        $.error("Error entry");
    });

For further details, see the demo folder

# Targets

By default `log4jq` logs to the browser console. However it is possible to customize this behavior using custom log targets. For a list of the log targets provided with `log4jq` and information about how to create your own see Configuration.


# Configuration

`$.configureLog4jq(object configuration)`: Configures the `log4jq` and returns the `logjq` object. This should be done only once in a document ready handler.

The `configuration` options are:

* `enabled`: Indicates whether or not logging is enabled.  Default is false.
* `level` : Set the logging level which is logged to the target. Each log level entry is an association from a string to an integer. The default log level is `debug`. Other levels are `info`, `warn` and `error`.
* `isEnableCookies` : false,
* `target` : A JSON object configuring the various targets. Each key in the JSON object uniquely identifies the target. 

# Logging Messages

`$.debug(string message, [object obj])`: Logs a debug message with all registered log targets.

Parameters:
* `message`: The debug message to log
* `object`: The optional object to be stringified and appended to the message.

`$.info(string message, [object obj])`: Logs an info message with all registered log targets.

Parameters:
* `message`: The debug message to log
* `object`: The optional object to be stringified and appended to the message.

`$.warn(string message, [object obj])`: Logs a warning message with all registered log targets.

Parameters:
* `message`: The warning message to log
* `object`: The optional object to be stringified and appended to the message.

`$.error(string message, [object obj])`: Logs an error message with all registered log targets.

Parameters:
* `message`: The error message to log
* `object`: The optional object to be stringified and appended to the message.


# Log levels

`$.log4jqLevels`: Returns the string-to-integer association defining all the log levels supported by this plugin. By default the log levels are:

	{
		debug: 1,
		info: 2,
		warn: 3,
		error: 4
	}

# Targets

`log4jq` provides a few targets out of the box.

## Alert

The alert log target is the simplest log target available and just displays each log entry using the browser's alert box.

To use the alert log target, you can configure as follows: 

	$.configureLog4jq({
		enabled: true,
		target : {
			alert : true,
		}
	});


## Console

The console log target logs entries using the window.console object. If the window.console object is not available it tries to log to the window.firebug.d.console object (provided by Firebug Lite). If neither object is available it does nothing.

The console log target is the default log target used by `log4jq`.

To use the console log target, you can configure as follows: 

	$.configureLog4jq({
		enabled: true,
		target : {
			console : true,
		}
	});

## DOM Insert

The DOM insert logs entries using by appending the log entry to an element in the DOM.

To use the console log target, you can configure as follows: 

	$.configureLog4jq({
		enabled: true,
		target : {
			domInsert: {
				$dom : $("div#console-log")
			}
		}
	});

Associating an object with the key `target.domInsert` is sufficient to enable it.

## Creating your own log target

See the demoCustomLogger.html in the demo folder.


