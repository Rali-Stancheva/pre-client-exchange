/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { OrderDirection } from '../../../common/enums/order-direction.enum';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderDto } from '../dto/order.dto';
import { Order } from '../entity/order.entity';
import { Repository } from 'typeorm';
import { RedisGateway } from '../../../modules/redis-client/redis-gateway';
import { OrderMatch } from '../../../modules/order-match/entity/order-match.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrderBookDto } from '../../../modules/order-book/dto/order-book.dto';
import { ORDER_BOOK_KEY } from '../../../common/constants/constants';

describe('OrdersService', () => {
  let service: OrdersService;
  let redisGateway: RedisGateway;
  let orderRepository: Repository<Order>;
  let orderMatchRepository: Repository<OrderMatch>;

  const mockOrderData: OrderDto = {
    id: 276,
    amount: 5,
    price: 20,
    remaining: 5,
    status: OrderStatus.OPEN,
    direction: OrderDirection.BUY,
    createdAt: new Date(),
    matches: [],
  };

  const mockOrderDataArray: OrderDto[] = [
    {
      id: 277,
      amount: 45,
      price: 20,
      remaining: 45,
      status: OrderStatus.OPEN,
      direction: OrderDirection.SELL,
      createdAt: new Date(),
      matches: [],
    },
    {
      id: 278,
      amount: 50,
      price: 20.9,
      remaining: 50,
      status: OrderStatus.OPEN,
      direction: OrderDirection.SELL,
      createdAt: new Date(),
      matches: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOneBy: jest.fn().mockResolvedValue(mockOrderData),
            find: jest.fn().mockResolvedValue(mockOrderDataArray),
            save: jest.fn().mockResolvedValue(mockOrderData),
            delete: jest.fn().mockResolvedValue(mockOrderData),
          },
        },

        {
          provide: RedisGateway,
          useValue: {
            set: jest.fn().mockResolvedValue({}),
            get: jest.fn().mockResolvedValue({}),
          },
        },

        {
          provide: getRepositoryToken(OrderMatch),
          useValue: {
            save: jest.fn().mockResolvedValue(mockOrderData),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    redisGateway = module.get<RedisGateway>(RedisGateway);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderMatchRepository = module.get<Repository<OrderMatch>>(getRepositoryToken(OrderMatch));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrder', () => {
    it('should return order object find by id', async () => {
      // Arrange
      const orderId = 276;

      jest.spyOn(service, 'findOrder').mockResolvedValueOnce(mockOrderData);

      //Act
      const result = await service.findOrder(orderId);

      // Assert
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

      // Expect the service to throw NotFoundException
      await expect(service.findOrder(orderId)).rejects.toThrow(
        new NotFoundException(`Order with ID ${orderId} not found`),
      );

      expect(service.findOrder).toHaveBeenCalledWith(orderId);
    });
  });

  describe('getOrdersByDirection', () => {
    it('should return array with objects if direction is sell and the status is open', async () => {
      const direction = OrderDirection.SELL;
      const status = [OrderStatus.OPEN];

      jest
        .spyOn(service['orderRepository'], 'find')
        .mockResolvedValue(mockOrderDataArray);
      const result = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );

      expect(result).toEqual(mockOrderDataArray);
    });

    it('should return an empty array if no orders match the criteria', async () => {
      const direction = OrderDirection.BUY;
      const status = [OrderStatus.FILLED];

      jest.spyOn(service['orderRepository'], 'find').mockResolvedValue([]);

      const result = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );
      expect(result).toEqual([]);
    });

    it('should return orders with direction SELL and multiple statuses', async () => {
      const direction = OrderDirection.SELL;
      const status = [OrderStatus.OPEN, OrderStatus.FILLED];

      const mockOrderDataArray = [
        {
          id: 277,
          amount: 45,
          price: 20,
          remaining: 45,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        },
        {
          id: 278,
          amount: 50,
          price: 20.9,
          remaining: 50,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        },
      ];

      jest
        .spyOn(service['orderRepository'], 'find')
        .mockResolvedValue(mockOrderDataArray);

      const result = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );
      expect(result).toEqual(mockOrderDataArray);
    });

    it('should return the count of orders with direction SELL and status OPEN', async () => {
      const direction = OrderDirection.SELL;
      const status = [OrderStatus.OPEN];

      jest
        .spyOn(service['orderRepository'], 'find')
        .mockResolvedValue(mockOrderDataArray);

      const result = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );
      expect(result.length).toEqual(2);
    });

    it('should return empty array if there are no orders with direction buy and status filled', async () => {
      const direction = OrderDirection.BUY;
      const status = [OrderStatus.FILLED];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );

      expect(result).toEqual([]);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        ['filled'],
      );
    });

    it('should return empty array if there are no orders with direction buy and status open|filled', async () => {
      const direction = OrderDirection.BUY;
      const status = [OrderStatus.OPEN, OrderStatus.FILLED];

      // Mock the service method to return an empty array
      service.findOrderByDirectionAndStatus = jest.fn().mockResolvedValue([]);

      const result: Order[] = await service.findOrderByDirectionAndStatus(
        direction,
        status,
      );

      expect(result).toEqual([]);
      expect(service.findOrderByDirectionAndStatus).toHaveBeenCalledWith(
        direction,
        ['open', 'filled'],
      );
    });
  });

  describe('onModuleInit', () => {
    
    it('should call initialize OrderBook when existing OrderBook is empty', async () => {
      const emptyOrderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      jest.spyOn(redisGateway, 'get').mockResolvedValueOnce(emptyOrderBook);

      const initializeOrderBookSpy = jest
        .spyOn(service, 'onModuleInit')
        .mockImplementation(jest.fn());

      await service.onModuleInit();

      expect(initializeOrderBookSpy).toHaveBeenCalled();
    });

  
    it('should not call initialize OrderBook when existing OrderBook has orders', async () => {
      const existingOrderBook: OrderBookDto = {
        buyOrders: [mockOrderData],
        sellOrders: [],
      };
      jest.spyOn(redisGateway, 'get').mockResolvedValueOnce(existingOrderBook);

      const initializeOrderBookSpy = jest
        .spyOn(service as any, 'initializeOrderBook')
        .mockImplementation(jest.fn());

      await service.onModuleInit();

      expect(initializeOrderBookSpy).not.toHaveBeenCalled();
    });

    it('should set an empty order book in Redis', async () => {
      const orderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      jest.spyOn(redisGateway, 'set').mockResolvedValueOnce(undefined); 

      await service['initializeOrderBook'](); 

      expect(redisGateway.set).toHaveBeenCalledWith('order-book', orderBook);
    });
  });

  describe('placeOrder', () => {
    it('should throw NotFoundException if order book is not found in Redis', async () => {
      jest.spyOn(redisGateway, 'get').mockResolvedValueOnce(null);

      const orderId = 1;
      const amount = 10;
      const price = 100;
      const direction = OrderDirection.BUY;

      await expect(
        service.placeOrder(orderId, amount, price, direction),
      ).rejects.toThrow(NotFoundException);

      expect(redisGateway.get).toHaveBeenCalledWith('order-book');
    });

    it('should call handleBuyOrder when direction is BUY', async () => {
      const mockOrderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      jest.spyOn(redisGateway, 'get').mockResolvedValueOnce(mockOrderBook);

      const handleBuyOrderSpy = jest
        .spyOn(service as any, 'handleBuyOrder')
        .mockResolvedValue(null);
      await service.placeOrder(1, 10, 100, OrderDirection.BUY);

      expect(handleBuyOrderSpy).toHaveBeenCalledWith(1, 10, 100, mockOrderBook);
    });

    it('should call handleSellOrder when direction is SELL', async () => {
      const mockOrderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      jest.spyOn(redisGateway, 'get').mockResolvedValueOnce(mockOrderBook);

      const handleSellOrderSpy = jest
        .spyOn(service as any, 'handleSellOrder')
        .mockResolvedValue(null);
      await service.placeOrder(1, 10, 100, OrderDirection.SELL);

      expect(handleSellOrderSpy).toHaveBeenCalledWith(
        1,
        10,
        100,
        mockOrderBook,
      );
    });

    
    it('should call createNewSellOrder when no matching buy order is found', async () => {
      // Arrange
      const orderId = 1;
      const amount = 10;
      const price = 100;
      const direction = OrderDirection.SELL;

      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [],
      };

      // Mocking Redis get and set methods
      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      jest.spyOn(service as any, 'createNewSellOrder').mockResolvedValue({
        message: 'No match! New order was created',
      });

      // Act
      await service.placeOrder(orderId, amount, price, direction);

      // Assert
      expect(redisGateway.get).toHaveBeenCalledWith('order-book');
      expect(service['createNewSellOrder']).toHaveBeenCalledWith(
        amount,
        price,
        orderBook,
      );
    });

   
    it('should call createNewBuyOrder when no matching sell order is found', async () => {
      // Arrange
      const orderId = 1;
      const amount = 10;
      const price = 100;
      const direction = OrderDirection.BUY;

      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [],
      };

      // Mocking Redis get and set methods
      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      jest.spyOn(service as any, 'createNewBuyOrder').mockResolvedValue({
        message: 'No match! New order was created',
      });

      // Act
      await service.placeOrder(orderId, amount, price, direction);

      // Assert
      expect(redisGateway.get).toHaveBeenCalledWith('order-book');
      expect(service['createNewBuyOrder']).toHaveBeenCalledWith(
        amount,
        price,
        orderBook,
      );
    });

   
    it('should create a new buy order and save it to the repository', async () => {
      // Arrange
      const amount = 10;
      const price = 100;
      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [],
      };

      const newOrder = {
        id: 1,
        amount: amount,
        price: price,
        remaining: amount,
        status: 'open',
        direction: 'buy',
        createdAt: new Date(),
        matches: null,
      } as Order;

      jest.spyOn(orderRepository, 'save').mockResolvedValue(newOrder);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['createNewBuyOrder'](
        amount,
        price,
        orderBook,
      );

      // Assert
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amount,
          price: price,
          remaining: amount,
          status: 'open',
          direction: OrderDirection.BUY,
        }),
      );
      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        {
          buyOrders: [expect.objectContaining({ amount, price })],
          sellOrders: [],
        },
        18000,
      );
      expect(result).toEqual({ message: 'No match! New order was created' });
    });

  
    it('should create a new sell order and save it to the repository', async () => {
      // Arrange
      const amount = 10;
      const price = 100;
      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [],
      };

      const newOrder = {
        id: 1,
        amount: amount,
        price: price,
        remaining: amount,
        status: 'open',
        direction: 'sell',
        createdAt: new Date(),
        matches: null,
      } as Order;

      jest.spyOn(orderRepository, 'save').mockResolvedValue(newOrder);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['createNewSellOrder'](
        amount,
        price,
        orderBook,
      );

      // Assert
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amount,
          price: price,
          remaining: amount,
          status: 'open',
          direction: OrderDirection.SELL,
        }),
      );

      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        {
          buyOrders: [],
          sellOrders: [expect.objectContaining({ amount, price })],
        },
        18000,
      );
      expect(result).toEqual({ message: 'No match! New order was created' });
    });

  
    it('should sort sell orders by price in ascending order', async () => {
      // Arrange
      const unsortedSellOrders: Order[] = [
        {
          id: 1,
          price: 150,
          amount: 5,
          remaining: 5,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        },
        {
          id: 2,
          price: 100,
          amount: 10,
          remaining: 10,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        },
        {
          id: 3,
          price: 200,
          amount: 7,
          remaining: 7,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        },
      ];

      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: unsortedSellOrders,
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const sortedOrderBook = await service['sortSellOrders'](); // Directly calling the private method

      // Assert
      expect(redisGateway.get).toHaveBeenCalledWith(ORDER_BOOK_KEY);
      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        sortedOrderBook,
        18000,
      );

      // Check if the orders were sorted by price in ascending order
      expect(sortedOrderBook.sellOrders[0].price).toBe(100);
      expect(sortedOrderBook.sellOrders[1].price).toBe(150);
      expect(sortedOrderBook.sellOrders[2].price).toBe(200);
    });

   
    it('should sort buy orders by price in descending order', async () => {
      // Arrange
      const unsortedBuyOrders: Order[] = [
        {
          id: 1,
          price: 150,
          amount: 5,
          remaining: 5,
          status: OrderStatus.OPEN,
          direction: OrderDirection.BUY,
          createdAt: new Date(),
          matches: [],
        } as Order,
        {
          id: 2,
          price: 100,
          amount: 10,
          remaining: 10,
          status: OrderStatus.OPEN,
          direction: OrderDirection.BUY,
          createdAt: new Date(),
          matches: [],
        } as Order,
        {
          id: 3,
          price: 200,
          amount: 7,
          remaining: 7,
          status: OrderStatus.OPEN,
          direction: OrderDirection.BUY,
          createdAt: new Date(),
          matches: [],
        } as Order,
      ];

      const orderBook: OrderBookDto = {
        buyOrders: unsortedBuyOrders,
        sellOrders: [],
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const sortedOrderBook = await service['sortBuyOrders'](); // Directly calling the private method

      // Assert
      expect(redisGateway.get).toHaveBeenCalledWith(ORDER_BOOK_KEY);
      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        sortedOrderBook,
        18000,
      );

      // Check if the orders were sorted by price in descending order
      expect(sortedOrderBook.buyOrders[0].price).toBe(200);
      expect(sortedOrderBook.buyOrders[1].price).toBe(150);
      expect(sortedOrderBook.buyOrders[2].price).toBe(100);
    });

   
    it('should increase the amount of an existing buy order with 1', async () => {
      // Arrange
      const existingOrder: Order = {
        id: 1,
        price: 100,
        amount: 5,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.BUY,
        createdAt: new Date(),
        matches: [],
      };

      const orderBook: OrderBookDto = {
        buyOrders: [existingOrder],
        sellOrders: [],
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(undefined);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['handleDublicateBuyOrders'](orderBook, 100);

      // Assert
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...existingOrder,
        amount: 6, // Amount increased by 1
        remaining: 6,
      });
      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        orderBook,
        0,
      );
      expect(result).toBe(true);
    });

   
    it('should return false if no duplicate buy order is found', async () => {
      // Arrange
      const nonMatchingOrder: Order = {
        id: 2,
        price: 90,
        amount: 5,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.BUY,
        createdAt: new Date(),
        matches: [],
      } as Order;

      const orderBook: OrderBookDto = {
        buyOrders: [nonMatchingOrder],
        sellOrders: [],
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['handleDublicateBuyOrders'](orderBook, 100);

      // Assert
      expect(result).toBe(false);
      expect(orderRepository.save).not.toHaveBeenCalled();
      expect(redisGateway.set).not.toHaveBeenCalled();
    });

 
    it('should increase the amount of an existing sell order with 1', async () => {
      // Arrange
      const existingOrder: Order = {
        id: 1,
        price: 100,
        amount: 5,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.SELL,
        createdAt: new Date(),
        matches: [],
      } as Order;

      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [existingOrder],
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(undefined);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['handleDublicateSellOrders'](orderBook, 100);

      // Assert
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...existingOrder,
        amount: 6, // Amount increased by 1
        remaining: 6,
      });

      expect(redisGateway.set).toHaveBeenCalledWith(
        ORDER_BOOK_KEY,
        orderBook,
        0,
      );
      expect(result).toBe(true);
    });

   
    it('should return false if no duplicate sell order is found', async () => {
      // Arrange
      const nonMatchingOrder: Order = {
        id: 2,
        price: 90,
        amount: 5,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.SELL,
        createdAt: new Date(),
        matches: [],
      } as Order;

      const orderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [nonMatchingOrder],
      };

      jest.spyOn(redisGateway, 'get').mockResolvedValue(orderBook);
      jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service['handleDublicateSellOrders'](orderBook, 100);

      // Assert
      expect(result).toBe(false);
      expect(orderRepository.save).not.toHaveBeenCalled();
      expect(redisGateway.set).not.toHaveBeenCalled();
    });
  });

  describe('handleSellOrder', () => {
    it('should add new sell order when no matching buy orders are found', async () => {
      const mockOrderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      const createNewSellOrderSpy = jest
        .spyOn(service as any, 'createNewSellOrder')
        .mockResolvedValue(null);

      await service['handleSellOrder'](1, 10, 100, mockOrderBook);

      expect(createNewSellOrderSpy).toHaveBeenCalledWith(
        10,
        100,
        mockOrderBook,
      );
    });

    it('should process matching buy order and reduce its amount', async () => {
      const mockBuyOrder: OrderDto = {
        id: 1,
        amount: 10,
        price: 100,
        remaining: 10,
        status: OrderStatus.OPEN,
        direction: OrderDirection.BUY,
        createdAt: new Date(),
        matches: [],
      };

      const mockOrderBook: OrderBookDto = {
        buyOrders: [mockBuyOrder],
        sellOrders: [],
      };
      const processSellOrderMatchSpy = jest
        .spyOn(service as any, 'processSellOrderMatch')
        .mockResolvedValue(null);

      await service['handleSellOrder'](1, 5, 90, mockOrderBook);

      expect(processSellOrderMatchSpy).toHaveBeenCalledWith(
        1,
        5,
        90,
        mockBuyOrder,
        mockOrderBook,
      );
    });

    it('should add new sell order when no matching buy orders are found', async () => {
      const mockOrderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
      const createNewSellOrderSpy = jest
        .spyOn(service as any, 'createNewSellOrder')
        .mockResolvedValue(null);

      await service['handleSellOrder'](1, 10, 50, mockOrderBook);

      expect(createNewSellOrderSpy).toHaveBeenCalledWith(10, 50, mockOrderBook);
    });
  });

  describe('processSellOrderMatch', () => {
    it('should create a new sell order and delete the buy order when amount is greater than buyObj.amount', async () => {
      const orderId = 1;
      const amount = 10;
      const price = 100;
      const mockBuyOrder: Order = {
        id: 2,
        amount: 5,
        price: 90,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.BUY,
        createdAt: new Date(),
        matches: [],
      };
      const mockOrderBook: OrderBookDto = {
        buyOrders: [mockBuyOrder],
        sellOrders: [],
      };

      const createNewOrderSpy = jest
        .spyOn(service as any, 'createNewOrder')
        .mockResolvedValue({
          id: 3,
          amount: 10,
          price: 100,
          remaining: 10,
          status: OrderStatus.OPEN,
          direction: OrderDirection.SELL,
          createdAt: new Date(),
          matches: [],
        });

      const saveOrderMatchSpy = jest
        .spyOn(service['orderMatchRepository'], 'save')
        .mockResolvedValue(null);

      const deleteBuyOrderSpy = jest
        .spyOn(service['orderRepository'], 'delete')
        .mockResolvedValue(null);

      const redisSetSpy = jest
        .spyOn(service['redisGateway'], 'set')
        .mockResolvedValue(null);

      const result = await service['processSellOrderMatch'](
        orderId,
        amount,
        price,
        mockBuyOrder,
        mockOrderBook,
      );

      expect(saveOrderMatchSpy).toHaveBeenCalled();
      expect(deleteBuyOrderSpy).toHaveBeenCalledWith(mockBuyOrder.id);
      expect(redisSetSpy).toHaveBeenCalled();
      expect(mockOrderBook.buyOrders).not.toContain(mockBuyOrder);
      expect(createNewOrderSpy).toHaveBeenCalledWith(
        amount - mockBuyOrder.amount,
        price,
        OrderDirection.SELL,
      );
      expect(result).toBeInstanceOf(OrderMatch);
    });
  });

  describe('processBuyOrderMatch', () => {
    it('should create a new buy order and delete the sell order when amount is greater than sellObj.amount', async () => {
      const mockSellOrder: Order = {
        id: 2,
        amount: 5,
        price: 90,
        remaining: 5,
        status: OrderStatus.OPEN,
        direction: OrderDirection.SELL,
        createdAt: new Date(),
        matches: [],
      };
    
      const orderId = 1;
      const amount = 10; // Amount to buy
      const price = 100; 
    
      const mockOrderBook: OrderBookDto = {
        buyOrders: [],
        sellOrders: [mockSellOrder],
      };
    
      const saveOrderMatchSpy = jest.spyOn(service['orderMatchRepository'], 'save').mockResolvedValue(new OrderMatch()); // Return a new instance of OrderMatch
      const deleteSellOrderSpy = jest.spyOn(service['orderRepository'], 'delete').mockResolvedValue(null);
      const redisSetSpy = jest.spyOn(service['redisGateway'], 'set').mockResolvedValue(null);
      const result = await service['processBuyOrderMatch'](orderId, amount,price, mockSellOrder,mockOrderBook);
    
      // Validate that the order match was saved
      expect(saveOrderMatchSpy).toHaveBeenCalled();
      
      // Check that the sell order was deleted
      expect(deleteSellOrderSpy).toHaveBeenCalledWith(mockSellOrder.id);
      
      // Check that Redis was updated with the order book
      expect(redisSetSpy).toHaveBeenCalledWith(ORDER_BOOK_KEY, mockOrderBook, 18000);
      
      // Validate that the result is an instance of OrderMatch
      expect(result).toBeInstanceOf(OrderMatch);
      
      // Ensure the sell order is removed from the order book
      expect(mockOrderBook.sellOrders).not.toContain(mockSellOrder);
    });
    
  });

});
