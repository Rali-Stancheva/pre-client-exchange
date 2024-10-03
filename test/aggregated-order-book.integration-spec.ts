/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RedisGateway } from '../src/modules/redis-client/redis-gateway';
import { Order } from '../src/modules/orders/entity/order.entity';
import { OrderStatus } from '../src/common/enums/order-status.enum';
import { OrderDirection } from '../src/common/enums/order-direction.enum';
import { ORDER_BOOK_KEY } from '../src/common/constants/constants';
import { OrderBookDto } from '../src/modules/order-book/dto/order-book.dto';
import { AggregatedOrderBookDto } from 'src/modules/aggregated-order-book/dto/aggregated-order-book.dto';

describe('AggregatedOrderook test', () => {
  let app: INestApplication;
  let redisGateway: RedisGateway;
  // let service: ;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    redisGateway = moduleFixture.get<RedisGateway>(RedisGateway);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });



  it('/aggregated (GET) - ', async () => {
    await redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);

    //send request
    const response = await request(app.getHttpServer())
      .get('/api/exchange/order-book/aggregated?levels=1')
      .expect(200);

    //wzima aggregatedBuyOrders i aggregatedSellOrders
    const orders: AggregatedOrderBookDto = response.body;

    //wzima buyOrders i sellOrders
    const orderBookCache: OrderBookDto = await redisGateway.get(ORDER_BOOK_KEY);

    expect(orderBookCache.buyOrders).toEqual([orderBuy]);
    expect(orderBookCache.sellOrders).toEqual([orderSell]);

    //agregeitnatite sellOrders da sa ednakwi s s tiq koito ochakwame
    expect(orders.aggregatedSellOrders).toEqual(expectedAggregatedSellOrders);
    expect(orders.aggregatedBuyOrders).toEqual(expectedAggregatedBuyOrders);

  }, 60000);



  it('/aggregated (GET) - check if aggregatedOrderBook is sorted', async () => {
    //пълним bazata sus sellOrders[] & buyOrders[]
    await redisGateway.set(ORDER_BOOK_KEY, orderBook2, 18000);

    //send
    const response = await request(app.getHttpServer())
      .get('/api/exchange/order-book/aggregated?levels=3')
      .expect(200);

    //vrushta celiq orderBook2
    const orders: AggregatedOrderBookDto = response.body;
    const orderBookCache: OrderBookDto = await redisGateway.get(ORDER_BOOK_KEY);

    //da proverq dali sa sortirani  v redis - buyOrders i sellOrders
    expect(orderBookCache.buyOrders).toEqual([orderBuy2, orderBuy3, orderBuy]);
    expect(orderBookCache.sellOrders).toEqual([orderSell,orderSell3,orderSell2]);

    
    // //agregeitnatite sellOrders da sa ednakwi s s tiq koito ochakwame
    expect(orders.aggregatedSellOrders).toEqual(expectedAggregatedSellOrders2);
    expect(orders.aggregatedBuyOrders).toEqual(expectedAggregatedBuyOrders2);
   
  }, 60000);

});


const orderBuy: Order = {
  id: 264,
  amount: 5,
  price: 26,
  remaining: 5,
  status: OrderStatus.OPEN,
  direction: OrderDirection.BUY,
  createdAt: new Date(),
  matches: [],
};

const expectedBuyOrder = orderBuy;
expectedBuyOrder.createdAt = expect.anything();

const orderSell: Order = {
  id: 265,
  amount: 6,
  price: 29,
  remaining: 6,
  status: OrderStatus.OPEN,
  direction: OrderDirection.SELL,
  createdAt: new Date(),
  matches: [],
};
const expectedSellOrder = orderSell;
expectedSellOrder.createdAt = expect.anything();

const orderBook: OrderBookDto = {
  buyOrders: [orderBuy],
  sellOrders: [orderSell],
};

const expectedAggregatedSellOrders = [
  {
    id: orderSell.id,
    amount: orderSell.amount,
    price: orderSell.price,
  },
];

const expectedAggregatedBuyOrders = [
  {
    id: orderBuy.id,
    amount: orderBuy.amount,
    price: orderBuy.price,
  },
];

const orderBuy2: Order = {
  id: 265,
  amount: 4,
  price: 29.9,
  remaining: 4,
  status: OrderStatus.OPEN,
  direction: OrderDirection.BUY,
  createdAt: new Date(),
  matches: [],
};
const expectedBuyOrder2 = orderBuy2;
expectedBuyOrder2.createdAt = expect.anything();

const orderBuy3: Order = {
  id: 266,
  amount: 9,
  price: 29,
  remaining: 9,
  status: OrderStatus.OPEN,
  direction: OrderDirection.BUY,
  createdAt: new Date(),
  matches: [],
};
const expectedBuyOrder3 = orderBuy3;
expectedBuyOrder3.createdAt = expect.anything();

const orderSell2: Order = {
  id: 266,
  amount: 5,
  price: 40,
  remaining: 5,
  status: OrderStatus.OPEN,
  direction: OrderDirection.SELL,
  createdAt: new Date(),
  matches: [],
};
const expectedSellOrder2 = orderSell2;
expectedSellOrder2.createdAt = expect.anything();

const orderSell3: Order = {
  id: 267,
  amount: 10,
  price: 30,
  remaining: 10,
  status: OrderStatus.OPEN,
  direction: OrderDirection.SELL,
  createdAt: new Date(),
  matches: [],
};
const expectedSellOrder3 = orderSell3;
expectedSellOrder3.createdAt = expect.anything();

const orderBook2: OrderBookDto = {
  buyOrders: [orderBuy, orderBuy2, orderBuy3],
  sellOrders: [orderSell, orderSell2, orderSell3],
};

const expectedAggregatedSellOrders2 = [
  {
    id: orderSell.id,
    amount: orderSell.amount,
    price: orderSell.price,
  },
  {
    id: orderSell3.id,
    amount: orderSell3.amount,
    price: orderSell3.price,
  },
  {
    id: orderSell2.id,
    amount: orderSell2.amount,
    price: orderSell2.price,
  },
  
];

const expectedAggregatedBuyOrders2 = [
    {
      id: orderBuy2.id,
      amount: orderBuy2.amount,
      price: orderBuy2.price,
    },
    {
      id: orderBuy3.id,
      amount: orderBuy3.amount,
      price: orderBuy3.price,
    },
    {
      id: orderBuy.id,
      amount: orderBuy.amount,
      price: orderBuy.price,
    },
    
];
  
