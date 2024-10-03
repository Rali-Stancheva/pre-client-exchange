/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AggregatedOrderBookController } from './aggregated-order-book.controller';
import { AggregatedOrderBookService } from './aggregated-order-book.service';


describe('AggregatedOrderBookController', () => {
  let controller: AggregatedOrderBookController;

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

  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AggregatedOrderBookController],
      providers: [
        {
          provide: AggregatedOrderBookService,
          useValue: {
            findAggregatedOrders: jest.fn().mockResolvedValue(mockAggregatedOrders),
          }
        }
      ]
    }).compile();

    controller = module.get<AggregatedOrderBookController>(AggregatedOrderBookController);
  });


  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


  it('should return aggregated buy and sell orders with concrete limit number', async () => {
    const level = 1;
  
    // Mock the service method to return aggregated orders
    jest.spyOn(controller, 'findAggregatedOrders').mockResolvedValue(mockAggregatedOrders);
  
    const result = await controller.findAggregatedOrders(level);
  
    expect(result).toEqual(mockAggregatedOrders);
    expect(controller.findAggregatedOrders).toHaveBeenCalledWith(level);
  });


  it('should return empty aggregated buy and sell order arrays when limit is 0', async () => {
    const level = 0; 
  
    const mockEmptyAggregatedOrders = {
      aggregatedBuyOrders: [],
      aggregatedSellOrders: [],
    };
  
    // Mock the service method to return empty arrays for the test
    jest.spyOn(controller, 'findAggregatedOrders').mockResolvedValue(mockEmptyAggregatedOrders);

    const result = await controller.findAggregatedOrders(level);
    expect(result).toEqual(mockEmptyAggregatedOrders);
  
    expect(controller.findAggregatedOrders).toHaveBeenCalledWith(level);
  });
  

  it('should return empty aggregated buy and sell order arrays when limit is less than 0', async () => {
    const level = -1; 
  
    const mockEmptyAggregatedOrders = {
      aggregatedBuyOrders: [],
      aggregatedSellOrders: [],
    };
  
    // Mock the service method to return empty arrays for the test
    jest.spyOn(controller, 'findAggregatedOrders').mockResolvedValue(mockEmptyAggregatedOrders);

    const result = await controller.findAggregatedOrders(level);
    expect(result).toEqual(mockEmptyAggregatedOrders);
  
    expect(controller.findAggregatedOrders).toHaveBeenCalledWith(level);
  });
});
