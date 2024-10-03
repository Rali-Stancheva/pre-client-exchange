/* eslint-disable prettier/prettier */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisGateway {
 constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, JSON.stringify(value), ttl);
  }

  async get<T>(key: string): Promise<T> {
    const orderBookString: string = await this.cacheManager.get(key);
    //return JSON.parse( orderBook);
    return orderBookString ? JSON.parse(orderBookString) : { sellOrders: [], buyOrders: [] };
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

}
