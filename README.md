Import.io JavaScript Client Library
=========

Use this client library to access [import.io](http://data.import.io) from client browsers.

# Examples

Check out the examples directory - there are plenty of things you can do, and some nice demos of integration!

We recommend you run all demos from a browser through some kind of server. This can be as simple as starting up a local webserver in the examples directory, e.g.:

    php -S 0.0.0.0:8000

For the server signing example, we included a handy PHP script to show you how to get started with it.

# Hosting

We provide a minified single-file library which includes all of its own dependencies on our CDN - there is no need to host the script yourself!

The current production version is at:

    //d7xe6yl2ckrgs.cloudfront.net/js/1/importio.js
    
Note this URL supports both http and https, but will not work in your browser if you are loading the HTML file from your hard disk.

# Documentation

Our examples provide an outline of what you can do.

To find out more about the library, including full docs of what's what, visit [our client library docs](http://docs.import.io/guide/clientlibs.html#javascript).

# Support

Any questions, drop us a line:
[http://help.import.io](http://help.import.io)
[help@import.io](mailto:help@import.io)

# Contributing

We <3 feedback and contributions! Please send us a pull request.

You will note you can build your own library, using the build.sh in the repo. You will need uglifyjs for this:

    npm install uglify-js
    
To build:

    ./build.sh
    
then check the dist/ directory.
    
Please note we roll our own jQuery with the library. This is because of the custom functions we added to the Promises support. We're waiting for that patch to be accepted into jQuery core :-)

If you're obsessed by performance, you can save yourself loading another one by using importio.jQuery(). However we may or may not change versions when you want us to, so use with some caution.