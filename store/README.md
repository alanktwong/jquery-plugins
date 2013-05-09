This is a fork of the store library by AmplifyJS.
It has virtually the same signature and implementation EXCEPT,
that the methods (store) are directly bound to the jQuery object
AND it does NOT support the `userData` storageType for IE.

It is a wrapper for various persistent client-side storage systems. `$.store` supports IE 5+, Firefox 2+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+ and provides a consistent API to handle storage cross-browser.

`$.store` is meant to allow you to utilize all the latest storage technologies for those browsers that have them, while gracefully degrading for those without support. `$.store` allows you to be passive or explicit in the storage technologies used. With no storage type explicitly specified, `$.store` will go through a series of technologies and pick an appropriate storage technology through feature detection. `$.store` also handles serializing to and from a JavaScript object using JSON serialization where necessary.

Note: Because of the JSON dependency, you need to add `json2.js` for support in browsers without native JSON support, including IE 5, IE 6, IE 7, Firefox 2.0 and Firefox 3.0.

## API

`$.store( string key, mixed value [, hash options ] )`
Stores a value for a given key using the default storage type.

`key`: Identifier for the value being stored.
`value`: The value to store. The value can be anything that can be serialized as JSON.
`[options]`: A set of key/value pairs that relate to settings for storing the value.

`$.store( string key )`
Gets a stored value based on the key.

`$.store()`
Clears key/value pair from the store.

`$.store( string key, null )`
Gets a hash of all stored values.

`$.store.storageType( string key, mixed value [, hash options ] )`
Stores a value for a given key using an explicit storage type, where `storageType`
is one of the available storage types through amplify.store.
The storage types available by default are listed below.

`$.store.storageType( string key )`
Gets a stored value based upon key for the explicit storage type.

`$.store.storageType()`
Gets a hash of all stored values which were stored through $.store.

### Options

`expires`: Duration in milliseconds that the value should be cached.

`storageTypes`:

* `localStorage` [ IE 8+, FF 3.5+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+ ] 
* `sessionStorage` [ IE 8+, FF 2+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+ ] 
* `globalStorage` [ FF 2+ ] 
* `memory`: An in-memory store is provided as a fallback if none of the other storage types are available.

For examples of using this plugin, see the demo folder
