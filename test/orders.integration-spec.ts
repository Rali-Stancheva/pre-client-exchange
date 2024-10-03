/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OrderStatus } from '../src/common/enums/order-status.enum';
import { OrderDirection } from '../src/common/enums/order-direction.enum';
import { Order } from '../src/modules/orders/entity/order.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderBookDto } from '../src/modules/order-book/dto/order-book.dto';
import { RedisGateway } from '../src/modules/redis-client/redis-gateway';
import { ORDER_BOOK_KEY } from '../src/common/constants/constants';
import { OrdersService } from '../src/modules/orders/orders.service';

describe('OrdersController test', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let redisGateway: RedisGateway;
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    redisGateway = moduleFixture.get<RedisGateway>(RedisGateway);
    orderRepository = moduleFixture.get<Repository<Order>>(
      getRepositoryToken(Order),
    );
    service = moduleFixture.get<OrdersService>(OrdersService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await redisGateway.delete(ORDER_BOOK_KEY);
    await orderRepository.clear();
    await app.close();
  });

  //   //ne raboti
  //     it('/orders/id (GET) - should find order by id', async () => {
  //       //send request
  //       const response = await request(app.getHttpServer())
  //         .get('/api/exchange/orders/id/288')
  //         .expect(200);

  //         console.log(response.body);
  //      // expect(response.body).toEqual(order);

  //     // orderRepository.findOne(order2);
  //      expect(service.findOrder(order2.id)).toEqual(order2)
  //      expect(orderRepository.findOne).toHaveBeenCalledWith(order2.id);

  //     }, 60000);

  it('/orders/id (GET) - should return error if there is no order with this id', async () => {
    //send request
    const response = await request(app.getHttpServer())
      .get('/api/exchange/orders/id/2')
      .expect(404);

    //check if the response return error message
    expect(response.body.message).toEqual(expectedMessage);
  }, 60000);

  it('/orders/:direction (GET) - should return orders with the correct status and direction sell', async () => {
    await orderRepository.save(orderRepository.create(orderOne));
    console.log('works');

    const response = await request(app.getHttpServer())
      .get('/api/exchange/orders/sell?status=open')
      .expect(200);

    const orders = response.body;
    console.log(orders);

    orders.forEach((order) => {
      expect(order.direction).toEqual(OrderDirection.SELL);
      expect(order.status).toEqual(OrderStatus.OPEN);
    });

    expect(orders.length).toEqual(1);
    expect(orders[0]).toEqual(expect.objectContaining({ ...expectedOrderOne }));
  }, 60000);

  //   it('/orders/:direction (GET) - should return orders with the correct status and direction buy', async () => {
  //     // Fetch the order book from Redis
  //     const orderBook: OrderBookDto = await redisGateway.get(ORDER_BOOK_KEY);

  //     const response = await request(app.getHttpServer())
  //       .get('/api/exchange/orders/buy?status=open')
  //       .expect(200);

  //     const orders = response.body;

  //     // Validate that each order in the response matches the expected properties
  //     orders.forEach((order) => {
  //       expect(order).toHaveProperty('direction', 'buy');
  //       expect(order).toHaveProperty('status', 'open');
  //     });

  //     // Check if the response orders match the orderBook
  //     expect(orders.length).toEqual(orderBook.buyOrders.length);

  //     //More detailed comparison to check if order details match
  //     orders.forEach((order) => {
  //       const matchingOrder = orderBook.buyOrders.find((o) => o.id === order.id);
  //       expect(matchingOrder.status).toEqual(order.status);
  //       expect(matchingOrder.direction).toEqual(order.direction);
  //     });
  //   }, 60000);

  it('/orders/:direction (GET) - should return error if order direction is invalid', async () => {
    //send request
    const response = await request(app.getHttpServer())
      .get('/api/exchange/orders/selll?status=open')
      .expect(404);

    expect(response.body.message).toEqual(invalidOrderDirection);
  }, 60000);

  it('/orders/:direction (GET) - should return error if order status is invalid', async () => {
    //send request
    const response = await request(app.getHttpServer())
      .get('/api/exchange/orders/sell?status=op')
      .expect(404);

    expect(response.body.message).toEqual(invalidOrderStatus);
  }, 60000);

  it('(POST) - should return message if there is no match', async () => {
    // Мокираме get метода на redisGateway да върне празен order book
    jest.spyOn(redisGateway, 'get').mockResolvedValue({
      buyOrders: [],
      sellOrders: [],
    });

    // Мокваме set метода на redisGateway
    //връща undefined щото не е нужно да връща нешо специално
    jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

    // Мокираме резултата от placeOrder метода
    jest
      .spyOn(service, 'placeOrder')
      .mockResolvedValue({ message: 'No match! New order was created' });

    //send request
    const response = await request(app.getHttpServer())
      .post('/api/exchange/orders')
      .send(orderForMatch)
      .expect(201);

    //console.log('response body', response.body);

    expect(response.body).toMatchObject({
      message: 'No match! New order was created',
    });
  }, 60000);

  ////малко бърка в редиса май не е мн правилно
  //   it('(POST) - should create new buy order', async () => {
  //     const orderBook = await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);

  //     const initialBuyOrderCount = orderBook.buyOrders.length; //0
  //     console.log('initialBuyOrderCount', initialBuyOrderCount);

  //     //send request
  //     const response = await request(app.getHttpServer())
  //       .post('/api/exchange/orders')
  //       .send(orderForMatch)
  //       .expect(201);

  //     const updatedOrderCount =
  //       await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);
  //     const newBuyOrderCount = updatedOrderCount.buyOrders.length; //1

  //     console.log('updatedOrderCount length', newBuyOrderCount);
  //     console.log('response.body', response.body);

  //     expect(response.body).toEqual({
  //       message: 'No match! New order was created',
  //     });
  //     expect(newBuyOrderCount).toBe(initialBuyOrderCount + 1);
  //   }, 60000);

  it('(POST) - should create new sell order', async () => {
    const orderBook = await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);

    const initialSellOrderCount = orderBook.sellOrders.length;
    console.log('initialSellOrderCount', initialSellOrderCount);

    //send request
    const response = await request(app.getHttpServer())
      .post('/api/exchange/orders')
      .send(orderForMatch2)
      .expect(201);

    const updatedOrderCount =
      await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);
    const newSellOrderCount = updatedOrderCount.sellOrders.length;

    console.log('updatedOrderCount length', newSellOrderCount);
    console.log('response.body', response.body);

    expect(newSellOrderCount).toBe(initialSellOrderCount + 1);
  }, 60000);

  it('(POST) - should create new orderMatch', async () => {
    jest.spyOn(redisGateway, 'get').mockResolvedValue({
      buyOrders: [],
      sellOrders: [],
    });

    jest.spyOn(redisGateway, 'set').mockResolvedValue(undefined);

    const orderBook = await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);
    const initialSellOrderCount = orderBook.sellOrders.length; //0
    console.log('initialSellOrderCount', initialSellOrderCount);

    const response = await request(app.getHttpServer())
      .post('/api/exchange/orders')
      .send(orderForMatch2)
      .expect(201);

    jest.spyOn(redisGateway, 'get').mockResolvedValue({
      buyOrders: [],
      sellOrders: [{ id: 1, amount: 100, price: 50, direction: 'sell' }],
    });

    const updatedOrderCount =
      await redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);
    const newSellOrderCount = updatedOrderCount.sellOrders.length; //1
    console.log('updatedOrderCount length', newSellOrderCount);

    expect(newSellOrderCount).toBe(initialSellOrderCount + 1);
    expect(response.body).toEqual({
      message: 'No match! New order was created',
    });
  }, 60000);
});

const orderOne: Order = {
  amount: 50,
  price: 20.9,
  remaining: 50,
  status: OrderStatus.OPEN,
  direction: OrderDirection.SELL,
  matches: null,
} as Order;

const expectedOrderOne: Order = {
  amount: 50,
  price: 20.9,
  remaining: 50,
  status: OrderStatus.OPEN,
  direction: OrderDirection.SELL,
} as Order;

// const orderTwo: Order = {
//   id: 279,
//   amount: 50,
//   price: 20.9,
//   remaining: 50,
//   status: OrderStatus.OPEN,
//   direction: OrderDirection.SELL,
//   matches: null,
// } as Order;

// const expectedSellOrder = orderOne;
// expectedSellOrder.createdAt = expect.anything();

const expectedMessage = 'Order with ID 2 not found';
const invalidOrderDirection = 'Invalid Order Direction';
const invalidOrderStatus = 'Invalid Order Status';

const orderForMatch = {
  id: 1,
  amount: 6,
  price: 26,
  direction: OrderDirection.BUY,
};

const orderForMatch2 = {
  id: 1,
  amount: 9,
  price: 79,
  direction: OrderDirection.SELL,
};

// const orderSell: Order = {
//   id: 265,
//   amount: 6,
//   price: 29,
//   remaining: 6,
//   status: OrderStatus.OPEN,
//   direction: OrderDirection.SELL,
//   createdAt: new Date(),
//   matches: [],
// };

// const orderBuy: Order = {
//   id: 265,
//   amount: 9,
//   price: 27,
//   remaining: 9,
//   status: OrderStatus.OPEN,
//   direction: OrderDirection.BUY,
//   matches: [],
// } as Order;

// const orderBook2: OrderBookDto = {
//   buyOrders: [orderBuy],
//   sellOrders: [orderSell],
// };
