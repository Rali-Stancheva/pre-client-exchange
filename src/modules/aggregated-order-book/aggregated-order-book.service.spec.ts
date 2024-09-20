import { Test, TestingModule } from '@nestjs/testing';
import { AggregatedOrderBookService } from './aggregated-order-book.service';

describe('AggregatedOrderBookService', () => {
  let service: AggregatedOrderBookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregatedOrderBookService],
    }).compile();

    service = module.get<AggregatedOrderBookService>(AggregatedOrderBookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
