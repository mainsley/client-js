#!/bin/bash

rm -rf dist
mkdir dist

uglifyjs lib/jquery.min.js \
			lib/cometd.js \
			lib/AckExtension.js \
			lib/ReloadExtension.js \
			lib/json2.js \
			lib/jquery.cookie.js \
			lib/jquery.cometd.js \
			lib/jquery.cometd-reload.js \
			lib/jquery.cometd-ack.js \
			lib/iojq.js lib/hmac-sha1.js \
			lib/enc-base64-min.js \
			importio.js -o dist/importio.js -c -m
