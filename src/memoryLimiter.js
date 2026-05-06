
let globalBucket = { tokens: 100, lastRefill: Date.now() };
const GLOBAL_CAPACITY = 5;
const GLOBAL_REFILL = 0.01; 

const userBuckets = {}; 
const USER_CAPACITY = 5;
const USER_REFILL = 0.0001;

const CLEANUP_INTERVAL = 60000; 
const MAX_IDLE_TIME = 300000;  

setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  for (const ip in userBuckets) {
    if (now - userBuckets[ip].lastRefill > MAX_IDLE_TIME) {
      delete userBuckets[ip];
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleanup: Removed ${deletedCount} inactive user buckets.`);
  }
}, CLEANUP_INTERVAL);

async function isAllowed(ip) {
  const now = Date.now();

  const gDelta = now - globalBucket.lastRefill;
  globalBucket.tokens = Math.min(GLOBAL_CAPACITY, globalBucket.tokens + (gDelta * GLOBAL_REFILL));
  globalBucket.lastRefill = now;

  if (globalBucket.tokens < 1) {
    console.log("SERVER OVERLOAD: Global limit reached");
    return false; 
  }

  if (!userBuckets[ip]) {
    userBuckets[ip] = { tokens: USER_CAPACITY, lastRefill: now };
  }
  const uBucket = userBuckets[ip];
  const uDelta = now - uBucket.lastRefill;
  uBucket.tokens = Math.min(USER_CAPACITY, uBucket.tokens + (uDelta * USER_REFILL));
  uBucket.lastRefill = now;

  if (uBucket.tokens < 1) {
    console.log(`USER LIMIT: IP ${ip} blocked`);
    return false; 
  }

  globalBucket.tokens -= 1;
  uBucket.tokens -= 1;
  return true;
}
module.exports = {isAllowed}