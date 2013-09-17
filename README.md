Import.io JavaScript Client Library
=========

Use this client library to access [import.io](http://import.io) from client browsers.

# Examples

Check out the examples directory - there are plenty of things you can do, and some nice demos of integration!

You can run the demos from your own machine - we recommend you run all demos from a browser through some kind of server.

This can be as simple as starting up a local webserver in the examples directory, e.g.:

    php -S 0.0.0.0:8000

For the server signing example, we included a handy PHP script to show you how to get started with it.

# Dependencies

All of our dependencies are self-contained with the exception of jQuery.

If you don't have jQuery already, you can include it like this.

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>

Make sure this happens *before* you load the import.io client library!

The minimum jQuery version that querying works with is 1.6.0, although we recommend staying as up to date as possible.

# Hosting

We provide a minified single-file library which includes all of its own dependencies on our CDN - there is no need to host the script yourself!

The current production version is at:

    //d7xe6yl2ckrgs.cloudfront.net/js/3/importio.js
    
Note this URL supports both http and https, but will not work in your browser if you are loading the HTML file from your hard disk.

# Support

Any questions, drop us a line: [http://support.import.io](http://support.import.io)

# AngularJS

We now provide AngularJS services. The module is called "importio" and the services provided are in the angular/services directory.

These just provide basic wrapping around the client library itself, and in the future we hope to increase the offering to include mocks and so on.

# Contributing

We <3 feedback and contributions! Please send us a pull request.

You will note you can build your own library, using the build.sh in the repo. You will need uglifyjs for this:

    npm install uglify-js
    
To build:

    ./build.sh
    
then check the dist/ directory.
