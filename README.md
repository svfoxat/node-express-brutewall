# Brutewall

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Easy to use rate limiter for Express.js Apps with Redis

# Features
* **Redis as storage service**
* **Request limit per timeframe**
* **Delay all requests after a given threshold for a given time**
* **Limits per IP Address, or any given header field**
* **Callbacks on limiting/delaying**
* **Custom response code and message for rate limited requests**
* **Limit defined HTTP Methods only**

# Usage
`npm i express-brutewall`

# Commands
- `npm run clean` - Remove `lib/` directory
- `npm test` - Run tests with linting and coverage results.
- `npm test:only` - Run tests without linting or coverage.
- `npm test:watch` - You can even re-run tests on file changes!
- `npm test:prod` - Run tests with minified code.
- `npm run test:examples` - Test written examples on pure JS for better understanding module usage.
- `npm run lint` - Run ESlint with airbnb-config
- `npm run cover` - Get coverage report for your code.
- `npm run build` - Babel will transpile ES6 => ES5 and minify the code.
- `npm run prepublish` - Hook for npm. Do all the checks before publishing your module.


# License
MIT © Nico Nößler
