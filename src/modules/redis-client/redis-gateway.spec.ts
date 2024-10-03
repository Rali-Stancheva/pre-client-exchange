/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { RedisGateway } from './redis-gateway';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('RedisGateway', () => {
  let redisGateway: RedisGateway;
  let cacheManagerMock: Partial<Cache>;

  beforeEach(async () => {
    cacheManagerMock = {
      set: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisGateway,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    redisGateway = module.get<RedisGateway>(RedisGateway);
  });

  it('should be defined', () => {
    expect(redisGateway).toBeDefined();
  });

  describe('set', () => {
    it('should call cacheManager.set with correct parameters', async () => {
      const key = 'testKey';
      const value = { some: 'data' };
      const ttl = 3600;

      await redisGateway.set(key, value, ttl);

      expect(cacheManagerMock.set).toHaveBeenCalledWith(key, JSON.stringify(value), ttl);
    });
  });

  describe('get', () => {
    it('should return parsed value when cache has data', async () => {
      const key = 'testKey';
      const value = { some: 'data' };
      cacheManagerMock.get = jest.fn().mockResolvedValueOnce(JSON.stringify(value));

      const result = await redisGateway.get(key);

      expect(result).toEqual(value);
    });

    it('should return default value when cache has no data', async () => {
      const key = 'testKey';
      cacheManagerMock.get = jest.fn().mockResolvedValueOnce(null);

      const result = await redisGateway.get(key);

      expect(result).toEqual({ sellOrders: [], buyOrders: [] });
    });
  });
});
