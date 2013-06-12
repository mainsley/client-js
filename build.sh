#!/bin/bash

rm dist/importio.js

cat lib/cometd.js lib/AckExtension.js lib/ReloadExtension.js lib/json2.js lib/jquery.cometd.js lib/jquery.cometd-ack.js lib/hmac-sha1.js lib/enc-base64-min.js importio.js > dist/io.js

uglifyjs -o dist/importio.js dist/io.js
#cp dist/io.js dist/importio.js

rm dist/io.js
