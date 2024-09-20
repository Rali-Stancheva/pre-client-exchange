import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookEntryController } from './order-book-entry.controller';

describe('OrderBookEntryController', () => {
  let controller: OrderBookEntryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderBookEntryController],
    }).compile();

    controller = module.get<OrderBookEntryController>(OrderBookEntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
