import { RedisClientType, createClient } from 'redis';
class Redis {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.init();
  }

  async init() {
    try {
      await this.client.connect();
      this.client.ping().then(async () => {
        console.log('Redis connected!'); // Connected!
      });
    } catch (err) {
      console.log('Redis error =====>', err);
    }
  }

  async get(idxKey: string, query: string, option: any) {
    return await this.client.ft.search(idxKey, query, option);
  }
}

const redis = new Redis();

export default redis;
