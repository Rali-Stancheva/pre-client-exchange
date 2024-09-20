import { Test, TestingModule } from '@nestjs/testing';
import { OrderBookController } from './order-book.controller';

describe('OrderBookController', () => {
  let controller: OrderBookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderBookController],
    }).compile();

    controller = module.get<OrderBookController>(OrderBookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
