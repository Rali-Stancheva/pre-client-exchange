/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AggregatedOrderBookController } from './aggregated-order-book.controller';

describe('AggregatedOrderBookController', () => {
  let controller: AggregatedOrderBookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AggregatedOrderBookController],
    }).compile();

    controller = module.get<AggregatedOrderBookController>(AggregatedOrderBookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
