const promisify = require('util.promisify');

module.exports = (options, db) => {
  if (!options || !options.timeFrame || !options.requestCount) { return 'ERR_INVALID_PARAMS_OPTS'; }
  if (!db || !db.get || !db.set || !db.ttl || !db.decr) { return 'ERR_INVALID_PARAMS_REDIS'; }

  const getAsync = promisify(db.get).bind(db);
  const setAsync = promisify(db.set).bind(db);
  const ttlAsync = promisify(db.ttl).bind(db);
  const decrAsync = promisify(db.decr).bind(db);
  // default options
  const opts = {
    limiterName: options.limiterName || '', // tested
    requestCount: options.requestCount, // tested
    timeFrame: options.timeFrame, // tested
    delayAfter: options.delayAfter, // tested
    delayTimeMs: options.delayTimeMs, // tested
    header: options.header, // tested
    limitCallback: options.limitCallback, // tested
    delayCallback: options.delayCallback, // tested
    limitResponseCode: options.limitResponseCode || 429, // tested
    limitMessage: options.limitMessage || 'Too Many Requests', // tested
    limitMethods: options.limitMethods // tested
  };

  return async (req, res, next) => {
    let lookup = req.headers['x-forwarded-for'] || req.ip;
    if (opts.header) {
      lookup = req.get(opts.header);
    }

    if (opts.limitMethods && opts.limitMethods.length > 0
      && !opts.limitMethods.includes(req.method)) {
      next();
    } else {
      try {
        let remainingRequests = await getAsync(`rate:${opts.limiterName}:${lookup}`);
        if (remainingRequests) {
          if ((remainingRequests - 1) >= 0) {
            remainingRequests = await decrAsync(`rate:${opts.limiterName}:${lookup}`);
          }
        } else {
          const ret = await setAsync(`rate:${opts.limiterName}:${lookup}`, opts.requestCount, 'EX', opts.timeFrame);
          if (!ret) {
            res.sendStatus(500);
          }
          remainingRequests = opts.requestCount;
        }
        if (remainingRequests > 0) {
          // delay part
          if (opts.delayAfter && opts.delayTimeMs) {
            const count = opts.requestCount - remainingRequests;
            if (count >= opts.delayAfter) {
              if (opts.delayCallback && typeof opts.limitCallback === 'function') {
                opts.delayCallback(req, res, next);
              }

              setTimeout(() => {
                next();
              }, opts.delayTimeMs);
            } else next();
          } else next();
        } else {
          if (opts.limitCallback && typeof opts.limitCallback === 'function') {
            const secondsToReset = await ttlAsync(`rate:${opts.limiterName}:${lookup}`);
            opts.limitCallback(req, res, next, secondsToReset);
          }
          res.status(opts.limitResponseCode).send(opts.limitMessage);
        }
      } catch (err) {
        res.sendStatus(500);
      }
    }
  };
};
