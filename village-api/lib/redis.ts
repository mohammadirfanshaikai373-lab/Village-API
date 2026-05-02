import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  tls: {
    rejectUnauthorized: false,   // required for Upstash's self-signed cert
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export default redis;