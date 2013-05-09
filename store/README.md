This is a fork of the store library by AmplifyJS.
It has virtually the same signature and implementation EXCEPT,
that the methods (store) are directly bound to the jQuery object
AND it does NOT support the userData storageType for IE.


This library also depends on the library, JSON.js.


## Usage

`$.store( string key, mixed value [, hash options ] )`
Stores a value for a given key using the default storage type.

`key`: Identifier for the value being stored.
`value`: The value to store. The value can be anything that can be serialized as JSON.
`[options]`: A set of key/value pairs that relate to settings for storing the value.

`$.store( string key )`
Gets a stored value based on the key.

`$.store()`
Gets a hash of all stored values.

`$.store( string key, null )`

`$.store.storageType( string key, mixed value [, hash options ] )`
Stores a value for a given key using an explicit storage type, where `storageType`
is one of the available storage types through amplify.store.
The storage types available by default are listed below.

$.store.storageType( string key )`
Gets a stored value based upon key for the explicit storage type.

`$.store.storageType()`
Gets a hash of all stored values which were stored through $.store.

### Options
`expires`: Duration in milliseconds that the value should be cached.

`storageTypes`:

`localStorage` [ IE 8+, FF 3.5+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+ ] 
`sessionStorage` [ IE 8+, FF 2+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+ ] 
`globalStorage` [ FF 2+ ] 
`memory`: An in-memory store is provided as a fallback if none of the other storage types are available.