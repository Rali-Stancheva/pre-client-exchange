/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderDto } from './dto/order.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderDirection } from '../../common/enums/order-direction.enum';
import { NotFoundException } from '@nestjs/common';
import { Order } from './entity/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrderData: OrderDto = {
    id: 264,
    amount: 5,
    price: 26,
    remaining: 5,
    status: OrderStatus.OPEN,
    direction: OrderDirection.BUY,
    createdAt: new Date(),
    matches: [],
  };

  const mockPlaceOrderData = {
    id: 1,
    amount: 10,
    price: 100,
    direction: 'buy',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findOrder: jest.fn().mockResolvedValue(mockOrderData),
            findOrderByDirectionAndStatus: jest
              .fn()
              .mockResolvedValue(mockOrderData),
            placeOrder: jest.fn().mockResolvedValue(mockPlaceOrderData),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findSpecificOrder', () => {
    it('should return order details by id', async () => {
      const orderId = 264;
      const result = await controller.findSpecificOrder(orderId);

      expect(result).toEqual(mockOrderData);
      expect(service.findOrder).toHaveBeenCalledWith(orderId);
    });

    it('should throw error if there is no order with this id', async () => {
      const orderId = 264;

      // Mock the service to throw NotFoundException to simulate order not found
      jest
        .spyOn(service, 'findOrder')
        .mockRejectedValueOnce(
          new NotFoundException(`Order with ID ${orderId} not found`),
        );

      // Expect the controller to throw NotFoundException
      await expect(controller.findSpecificOrder(orderId)).rejects.toThrow(
        new NotFoundException(`Order with ID ${orderId} not found`),
      );

      expect(service.findOrder).toHaveBeenCalledWith(orderId);
    });
  });

  describe('getOrdersByDirection', () => {
    it('should return array with objects if direction is sell and the status is open', async () => {
      const direction = OrderDirection.SELL;
      const status = [OrderStatus.OPEN];

      const result = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual(mockOrderData);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        status,
      );
    });

    it('should return array with objects if direction is sell and the status is filled', async () => {
      const direction = OrderDirection.SELL;
      const status = [OrderStatus.FILLED];

      const result = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual(mockOrderData);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        status,
      );
    });

  

    it('should return array with objects if direction is buy and the status is open', async () => {
      const direction = OrderDirection.BUY;
      const status = [OrderStatus.OPEN];

      const result = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual(mockOrderData);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        status,
      );
    });

    it('should return array with objects if direction is buy and the status is filled', async () => {
      const direction =  OrderDirection.BUY;
      const status = [OrderStatus.FILLED];

      const result = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual(mockOrderData);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        status,
      );
    });

    

    it('should return empty array if there are no orders with direction sell and status open', async () => {
      const direction =  OrderDirection.SELL;
      const status = [OrderStatus.OPEN];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual([]);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        ['open'],
      );
    });

    it('should return empty array if there are no orders with direction sell and status filled', async () => {
      const direction =  OrderDirection.SELL;
      const status = [OrderStatus.FILLED];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual([]); // Expect an empty array to be returned
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        ['filled'],
      );
    });

  

    it('should return empty array if there are no orders with direction buy and status open', async () => {
      const direction =  OrderDirection.BUY;
      const status = [OrderStatus.OPEN];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual([]);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        ['open'],
      );
    });

    it('should return empty array if there are no orders with direction buy and status filled', async () => {
      const direction = OrderDirection.BUY;
      const status = [OrderStatus.FILLED];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await controller.getOrdersByDirectionAndStatus(
        direction,
        status[0],
      );

      expect(result).toEqual([]); // Expect an empty array to be returned
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        [OrderStatus.FILLED],
      );
    });


  
  });

  //place order
  it('should return message if new order was created', async () => {
    const mockResult = { message: 'No match! New order was created' };

    jest.spyOn(service, 'placeOrder').mockResolvedValue(mockResult);

    const result = await controller.createOrder(mockOrderData);

    expect(result).toEqual(mockResult);
    expect(service.placeOrder).toHaveBeenCalledWith(
      mockOrderData.id,
      mockOrderData.amount,
      mockOrderData.price,
      mockOrderData.direction,
    );
  });
});
