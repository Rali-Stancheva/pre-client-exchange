import { Test, TestingModule } from '@nestjs/testing';
import { OrderMatchController } from './order-match.controller';

describe('OrderMatchController', () => {
  let controller: OrderMatchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderMatchController],
    }).compile();

    controller = module.get<OrderMatchController>(OrderMatchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
