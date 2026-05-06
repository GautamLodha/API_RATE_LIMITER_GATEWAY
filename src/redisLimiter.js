const Redis = require('ioredis');
const redis = new Redis(); 
const GLOBAL_KEY = 'ratelimit:global';
const GLOBAL_CAPACITY = 5;
const GLOBAL_REFILL = 0.01;

const USER_CAPACITY = 5;
const USER_REFILL = 0.0001;

async function isAllowed(ip) {
  const now = Date.now();
  const userKey = `ratelimit:user:${ip}`;

  let gData = await redis.hgetall(GLOBAL_KEY);
  let gTokens = gData.tokens ? parseFloat(gData.tokens) : GLOBAL_CAPACITY;
  let gLast = gData.lastRefill ? parseInt(gData.lastRefill) : now;

  const gDelta = now - gLast;
  gTokens = Math.min(GLOBAL_CAPACITY, gTokens + (gDelta * GLOBAL_REFILL));

  if (gTokens < 1) return false;

  let uData = await redis.hgetall(userKey);
  let uTokens = uData.tokens ? parseFloat(uData.tokens) : USER_CAPACITY;
  let uLast = uData.lastRefill ? parseInt(uData.lastRefill) : now;

  const uDelta = now - uLast;
  uTokens = Math.min(USER_CAPACITY, uTokens + (uDelta * USER_REFILL));

  if (uTokens < 1) return false;

  await redis.hset(GLOBAL_KEY, 'tokens', gTokens - 1, 'lastRefill', now);
  await redis.hset(userKey, 'tokens', uTokens - 1, 'lastRefill', now);
  
  await redis.expire(userKey, 60); 

  return true;
}

module.exports = {isAllowed}