import { assert } from 'chai';
let redis = require('redis');
let bluebird = require('bluebird');
let httpMocks = require('node-mocks-http');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
let redisClient = redis.createClient(6379, '172.17.0.2');

describe('Basic', () => {
  it('should return a middleware function after passing (valid) options and db', () => {
    let opts = {
      timeFrame: 10*60,
      requestCount: 20
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    assert(typeof(brutewall) === 'function', 'no function is returned');
  });
  it('should return error when called with invalid parameters (no redis)', () => {
    let opts = {
      timeFrame: 10*60,
      requestCount: 20
    };
    let db;
    const brutewall = require('../src/index')(opts, db);
    assert((brutewall) === "ERR_INVALID_PARAMS_REDIS", 'Accepting non redis object as redis instance');
  });
  it('should return error when called with invalid parameters (no options)', () => {
    let opts;
    let db = redisClient
    const brutewall = require('../src/index')(opts, db);
    assert((brutewall) === "ERR_INVALID_PARAMS_OPTS", 'Accepting non opts object');
  });
});

describe('Limiter Tests', () => {
  beforeEach(async () => {
    await redisClient.flushallAsync();
  });


  it('Limit Test', async() => {
    let opts = {
      timeFrame: 10*60,
      requestCount: 1
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const request  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.2'
    });
    let response = httpMocks.createResponse();

    // should not limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 200, 'limits to early');
    // should limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 429, 'limit failed');
  });

  it('Limit Test with custom lookup header', async() => {
    let opts = {
      timeFrame: 10*60,
      requestCount: 1,
      header: 'lookup'
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const request  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.3',
      headers: {
        lookup: 'test'
      }
    });
    let response = httpMocks.createResponse();

    // should not limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 200, 'limits to early');
    // should limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 429, 'limit failed');
  });

  it('Limit Test with custom statuscode and message', async() => {
    let opts = {
      timeFrame: 10*60,
      requestCount: 1,
      limitResponseCode: 123,
      limitMessage: "testmessage"
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const request  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.4',
    });
    let response = httpMocks.createResponse();

    // should not limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 200, 'limits to early');
    // should limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 123, 'wrong statuscode');
    assert(response._getData() === 'testmessage', 'wrong custom message')
  });

  it('Limit Test with limit callback', async() => {
    let calledCallback = false;
    const limitCallback = () => {
      calledCallback = true;
    };

    let opts = {
      timeFrame: 10*60,
      requestCount: 1,
      limitCallback: limitCallback
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const request  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.5',
    });
    let response = httpMocks.createResponse();

    // should not limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 200, 'limits to early');
    // should limit
    await brutewall(request, response, () => {});
    assert(calledCallback === true, 'Callback not called');
  });

  it('Limit Test with different limiters', async() => {

    // Limiter 1
    let opts1 = {
      limiterName: 'limiter1',
      timeFrame: 10*60,
      requestCount: 1,
    };
    let db1 = redisClient;
    const brutewall1 = require('../src/index')(opts1, db1);
    const request1  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.6',
    });
    let response1 = httpMocks.createResponse();
    let response2 = httpMocks.createResponse();

    // Limiter 2
    let opts2 = {
      limiterName: 'limiter2',
      timeFrame: 10*60,
      requestCount: 1,
    };
     const db2 = redisClient;
     const brutewall2 = require('../src/index')(opts2, db2);


    // limiter1 should limit
    await brutewall1(request1, response1, () => {});
    await brutewall1(request1, response1, () => {});
    assert(response1.statusCode === 429, 'Limiter1 not limiting');

    // now try if limiter2 limits or not
    await brutewall2(request1, response2, () => {});
    assert(response2.statusCode === 200, 'Limiter2 is limiting');
  });

  it('Limit Test with methods selected', async() => {

    let opts = {
      timeFrame: 10*60,
      requestCount: 1,
      limitMethods: ['GET']
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const GETrequest  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.7',
    });
    const POSTrequest  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.8',
    });
    let response = httpMocks.createResponse();

    // should not limit
    await brutewall(GETrequest, response, () => {});
    assert(response.statusCode === 200, 'limits to early');
    // should limit
    await brutewall(GETrequest, response, () => {});
    assert(response.statusCode === 429, 'not limiting GET');
    // should not limit
    response = httpMocks.createResponse();
    await brutewall(POSTrequest, response, () => {});
    assert(response.statusCode === 200, 'limiting POST');
  });

  it('Limit Test with delay', async() => {
    let delayed = false;
    const onDelay = (req) => {
      delayed = true;
    };

    let opts = {
      timeFrame: 10*60,
      requestCount: 1,
      delayAfter: 1,
      delayTimeMs: 1000,
      delayCallback: onDelay()
    };
    let db = redisClient;
    const brutewall = require('../src/index')(opts, db);
    const request  = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      ip: '127.0.0.9',
    });
    let response = httpMocks.createResponse();

    // should not limit and delay after this request
    await brutewall(request, response, () => {});
    assert(response.statusCode !== 429, 'too early limiting');
    assert(delayed === true, 'not delaying');

    // should limit
    await brutewall(request, response, () => {});
    assert(response.statusCode === 429, 'not limiting')
  });
});

