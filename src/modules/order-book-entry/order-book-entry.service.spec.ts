import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookEntryService } from './order-book-entry.service';

describe('OrderBookEntryService', () => {
  let service: OrderBookEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderBookEntryService],
    }).compile();

    service = module.get<OrderBookEntryService>(OrderBookEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
