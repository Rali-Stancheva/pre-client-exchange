/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AggregatedOrderBookService } from './aggregated-order-book.service';
import { RedisGateway } from '../redis-client/redis-gateway';


describe('AggregatedOrderBookService', () => {
  let service: AggregatedOrderBookService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatedOrderBookService,
      
        {
          provide: RedisGateway,
          useValue: { 
            set: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<AggregatedOrderBookService>(
      AggregatedOrderBookService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
