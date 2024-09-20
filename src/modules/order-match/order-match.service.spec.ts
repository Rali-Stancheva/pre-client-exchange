import { Test, TestingModule } from '@nestjs/testing';
import { OrderMatchService } from './order-match.service';

describe('OrderMatchService', () => {
  let service: OrderMatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderMatchService],
    }).compile();

    service = module.get<OrderMatchService>(OrderMatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
