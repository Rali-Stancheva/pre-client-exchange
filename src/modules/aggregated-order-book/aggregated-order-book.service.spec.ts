/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AggregatedOrderBookService } from './aggregated-order-book.service';
import { RedisGateway } from '../redis-client/redis-gateway';

let redisGateway: RedisGateway;

const mockAggregatedOrders = {
  aggregatedBuyOrders: [
    {
      id: 275,
      amount: 700,
      price: 38,
    },
  ],
  aggregatedSellOrders: [
    {
      id: 274,
      amount: 100,
      price: 38,
    },
  ],
};

describe('AggregatedOrderBookService', () => {
  let service: AggregatedOrderBookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatedOrderBookService,

        {
          provide: RedisGateway,
          useValue: {
            get: jest.fn().mockResolvedValue(mockAggregatedOrders),
            set: jest.fn().mockResolvedValue(mockAggregatedOrders),
          },
        },
      ],
    }).compile();

    service = module.get<AggregatedOrderBookService>(AggregatedOrderBookService);
    redisGateway = module.get<RedisGateway>(RedisGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAggregatedOrders', () => {
    it('should return correct number of aggregated orders', async () => {
      const level = 1;

      // Mock the service method to return aggregated orders
      jest
        .spyOn(service, 'findAggregatedOrders')
        .mockResolvedValue(mockAggregatedOrders);
      const result = await service.findAggregatedOrders(level);

      // Check that the result matches the mock response
      expect(result).toEqual(mockAggregatedOrders);
      expect(service.findAggregatedOrders).toHaveBeenCalledWith(level);

      expect(result.aggregatedBuyOrders).toHaveLength(1);
      expect(result.aggregatedSellOrders).toHaveLength(1);
    });

    it('should return empty aggregated buy and sell order arrays when limit is 0', async () => {
      const level = 0;

      const mockEmptyAggregatedOrders = {
        aggregatedBuyOrders: [],
        aggregatedSellOrders: [],
      };

      // Mock the service method to return empty arrays for the test
      jest
        .spyOn(service, 'findAggregatedOrders')
        .mockResolvedValue(mockEmptyAggregatedOrders);

      const result = await service.findAggregatedOrders(level);
      expect(result).toEqual(mockEmptyAggregatedOrders);

      expect(service.findAggregatedOrders).toHaveBeenCalledWith(level);

      expect(result.aggregatedBuyOrders).toHaveLength(0);
      expect(result.aggregatedSellOrders).toHaveLength(0);
    });

    it('should correctly sort buy and sell orders', async () => {
      const mockOrderBook = {
        buyOrders: [
          { id: 'buy2', amount: 100, price: 40 },
          { id: 'buy1', amount: 100, price: 50 }
        ],
        sellOrders: [
          { id: 'sell2', amount: 100, price: 60 },
          { id: 'sell1', amount: 100, price: 55 }
        ]
      };
    
      // Mock the Redis get method to return unsorted orders, ensuring buyOrders and sellOrders are defined
      (redisGateway.get as jest.Mock).mockResolvedValue(mockOrderBook);
    
      // Mock the Redis set method to return void
      (redisGateway.set as jest.Mock).mockResolvedValue(undefined);
    
      // Call the findAggregatedOrders method, which internally calls sortOrders
      await service.findAggregatedOrders(2);
    
      // Check that buy orders are sorted in descending order
      expect(mockOrderBook.buyOrders[0].price).toBe(50);
      expect(mockOrderBook.buyOrders[1].price).toBe(40);
    
      // Check that sell orders are sorted in ascending order
      expect(mockOrderBook.sellOrders[0].price).toBe(55);
      expect(mockOrderBook.sellOrders[1].price).toBe(60);
    
      // Ensure Redis methods were called
      expect(redisGateway.get).toHaveBeenCalledWith('order-book');  // Verify key
      expect(redisGateway.set).toHaveBeenCalledWith('order-book', mockOrderBook, 18000);
    });
    

  });
});
