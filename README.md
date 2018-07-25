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
```javascript
const express = require('express');
const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient(6379, '172.17.0.2');
const app = express();

const onLimit = (req) => {
  console.log('limited');
};
const onDelay = (req) => {
  console.log('delayed');
};

// init brutewall
const brutewall = require('express-brutewall')({
  limiterName: 'global', // optional
  requestCount: 2, // requests per timeFrame
  timeFrame: 10 * 60, // 10 * 60 seconds
  delayAfter: 1,
  delayTimeMs: 1000,
  // delayTimeMs: Number how much should the requests after the threshold be delayed
  // header: String uses this header field for limiting rather than the ip
  limitCallback: onLimit,
  delayCallback: onDelay,
  // limitResponseCode: Number custom response code for rate limited requests
  // limitMessage: String custom response body for rate limited requests
  // limitMethods: String[] defines which HTTP Methods should be rate limited
}, redisClient);


app.use(brutewall);


// start express server
app.listen(3001, () => {
  console.log('brutewall example app listening on port 3001!');
});

// define a test route
app.get('/', (req, res) => {
  res.send('Hello World!');
});
```

# License
MIT © Nico Nößler
