# Brutewall

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)[![Build Status](https://travis-ci.com/svfoxat/node-express-brutewall.svg?branch=master)](https://travis-ci.com/svfoxat/node-express-brutewall)

Easy to use rate limiter for Express.js Apps with Redis
please keep in mind this project is work in progress, its stable as it is but still needs proper errorhandling and testing.

# Features
* **Redis as storage service**
* **Request limit per timeframe**
* **Delay all requests after a given threshold for a given time**
* **Limits per IP Address, or any given header field**
* **Callbacks on limiting/delaying**
* **Custom response code and message for rate limited requests**
* **Limit defined HTTP Methods only**

# Todo
* more documentation
* more tests

# Install
`npm i express-brutewall`

# Test
```
export REDIS_URI=*REDIS_URI*
npm run test
```

# Usage
[Example](https://github.com/svfoxat/node-express-brutewall/blob/master/examples/example.js)

# License
MIT © Nico Nößler
