/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderDirection } from 'src/common/enums/order-direction.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderMatch } from '../order-match/entity/order-match.entity';
import { RedisGateway } from '../redis-client/redis-gateway';
import { OrderBookDto } from '../order-book/dto/order-book.dto';
import { ORDER_BOOK_KEY } from 'src/common/constants/constants';

@Injectable()
export class OrdersService {
  //private readonly ORDER_BOOK_KEY = 'order-book';

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(OrderMatch)
    private readonly orderMatchRepository: Repository<OrderMatch>,
    private readonly redisGateway: RedisGateway,
  ) {}

  async onModuleInit() {
    const existingOrderBook: OrderBookDto =
      await this.redisGateway.get(ORDER_BOOK_KEY);

    if (
      existingOrderBook.buyOrders.length === 0 &&
      existingOrderBook.sellOrders.length === 0
    ) {
      const buyOrders: Order[] = [];
      const sellOrders: Order[] = [];
      const orderBook: OrderBookDto = { buyOrders, sellOrders };

      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook);
    }
  }

  async findOrder(id: number) {
    const order = await this.orderRepository.findOneBy({ id });

    return order;
  }

  async findOrderByDirectionAndStatus(
    direction: OrderDirection,
    status: OrderStatus[],
  ) {
    return this.orderRepository.find({
      where: {
        direction: direction,
        status: In(status),
      },
    });
  }

  async newOrderWithMatch(
    orderId: number,
    amount: number,
    price: number,
    direction: string,
  ) {
    const orderBook = await this.redisGateway.get<OrderBookDto>(ORDER_BOOK_KEY);

    if (!orderBook) {
      throw new NotFoundException('OrderBook not found');
    }

    if (direction === OrderDirection.SELL) {
      const isDuplicate = await this.handleDublicateSellOrders(
        orderBook,
        price,
      );

      if (isDuplicate) {
        return;
      }

      await this.sortSellOrders();
      let isOrderMatched = false;
      await this.redisGateway.get(ORDER_BOOK_KEY);

      for (let i = 0; i < orderBook.buyOrders.length; i++) {
        // минаваме по списъка buyOrders
        const buyObj = orderBook.buyOrders[i]; //obektite koito sa buy kolonkata

        if (
          buyObj.direction === OrderDirection.BUY &&
          //buyObj.amount >= amount &&
          buyObj.price >= price
        ) {
          isOrderMatched = true;

          //match
          const orderMatch = new OrderMatch();
          orderMatch.buyOrderId = buyObj.id;
          orderMatch.sellOrderId = orderId;
          orderMatch.amount = amount;
          orderMatch.price = price;
          orderMatch.createdAt = new Date();
          await this.orderMatchRepository.save(orderMatch);

          if (amount > buyObj.amount) {
            amount = amount - buyObj.amount; //10 - 9 = 1

            //ne trie ot redis
            console.log('before delete from redis');
            await this.redisGateway.delete(buyObj.id.toString());
            console.log('id into the func', buyObj.id);
            console.log('after delete from redis');


            await this.orderRepository.delete(buyObj.id);

            //da zapishem nowiq order a:1 p:15 d:sell
            const newOrder = new Order();
            newOrder.amount = amount;
            newOrder.price = price;
            newOrder.remaining = amount;
            newOrder.status = OrderStatus.OPEN;
            newOrder.direction = OrderDirection.SELL;
            newOrder.createdAt = new Date();
            newOrder.matches = null;
            await this.orderRepository.save(newOrder);
          } else if (buyObj.amount > amount) {
            //12 > 10
            buyObj.amount = buyObj.amount - amount; //12 - 10 = 2
            buyObj.remaining = buyObj.amount;
            await this.orderRepository.save(buyObj);
          }

          await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
          return orderMatch;
        }
      }

      if (!isOrderMatched) {
        const newOrder = new Order();
        newOrder.amount = amount;
        newOrder.price = price;
        newOrder.remaining = amount;
        newOrder.status = OrderStatus.OPEN;
        newOrder.direction = OrderDirection.SELL;
        newOrder.createdAt = new Date();
        newOrder.matches = null;
        await this.orderRepository.save(newOrder);

        const orderBook: OrderBookDto =
          await this.redisGateway.get(ORDER_BOOK_KEY);
        orderBook.sellOrders.push(newOrder);
        await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);

        return { message: 'No match! New order was created' };
      }
    } else if (direction === OrderDirection.BUY) {
      const isDuplicate = await this.handleDublicateBuyOrders(orderBook, price);

      if (isDuplicate) {
        return;
      }

      await this.sortSellOrders();
      let idOrderMatched = false;

      for (let i = 0; i < orderBook.sellOrders.length; i++) {
        const sellObj = orderBook.sellOrders[i]; //3, a:10, p: 26 //OBJ

        if (
          sellObj.direction === OrderDirection.SELL &&
          sellObj.amount >= amount &&
          sellObj.price <= price
        ) {
          //match
          sellObj.amount = sellObj.amount - amount; //намаляме количеството на sell order-a с който сме сключили сделка = remaining
          orderBook.sellOrders[i] = sellObj; //актуализираме масива
          orderBook.sellOrders[i].remaining = sellObj.amount; //remaining да е равно на amount
          await this.orderRepository.save(sellObj);
          await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 0);

          //make new record in OrderMatch
          const orderMatch = new OrderMatch();
          orderMatch.buyOrderId = orderId;
          orderMatch.sellOrderId = sellObj.id;
          orderMatch.amount = amount;
          orderMatch.price = price;
          await this.orderMatchRepository.save(orderMatch);

          if (sellObj.amount <= 0) {
            await this.orderRepository.delete(sellObj.id);

            //remove specific order from Redis
            await this.redisGateway.get(ORDER_BOOK_KEY);
            orderBook.sellOrders = orderBook.sellOrders.filter(
              (order) => order.id !== sellObj.id,
            );
            await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
          }

          idOrderMatched = true;
          return orderMatch;
        }
      }

      if (!idOrderMatched) {
        const newOrder = new Order();
        newOrder.amount = amount;
        newOrder.price = price;
        newOrder.remaining = amount;
        newOrder.status = OrderStatus.OPEN;
        newOrder.direction = OrderDirection.BUY;
        newOrder.createdAt = new Date();
        newOrder.matches = null;
        await this.orderRepository.save(newOrder);

        const orderBook: OrderBookDto =
          await this.redisGateway.get(ORDER_BOOK_KEY);
        orderBook.buyOrders.push(newOrder);
        await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);

        return { message: 'No match! New order was created' };
      }
    } else {
      throw new Error('invalid input');
    }
  }

  async sortSellOrders(): Promise<OrderBookDto> {
    const orderBook: OrderBookDto = await this.redisGateway.get(ORDER_BOOK_KEY);

    orderBook.sellOrders.sort((a, b) => {
      return a.price - b.price;
    });

    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return orderBook;
  }

  async sortBuyOrders(): Promise<OrderBookDto> {
    const orderBook: OrderBookDto = await this.redisGateway.get(ORDER_BOOK_KEY);

    // console.log('before', orderBook.sellOrders);

    orderBook.buyOrders.sort((a, b) => {
      return b.price - a.price;
    });

    //console.log('after', orderBook.sellOrders);

    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return orderBook;
  }

  async handleDublicateBuyOrders(
    orderBook: OrderBookDto,
    price: number,
    // amount: number,
  ) {
    const existingOrder = orderBook.buyOrders.find(
      (order) =>
        order.price === price && order.direction === OrderDirection.BUY,
    );

    if (existingOrder) {
      existingOrder.amount += 1; //dali trqbwa da e s 1 ili s kolichestvoto na amount

      existingOrder.remaining = existingOrder.amount;

      await this.orderRepository.save(existingOrder);
      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 0);
      return true;
    }

    return false;
  }

  async handleDublicateSellOrders(
    orderBook: OrderBookDto,
    price: number,
    // amount: number,
  ) {
    const existingOrder = orderBook.sellOrders.find(
      (order) =>
        order.price === price && order.direction === OrderDirection.SELL,
    );

    if (existingOrder) {
      existingOrder.amount += 1; //dali trqbwa da e s 1 ili s kolichestvoto na amount

      existingOrder.remaining = existingOrder.amount;

      await this.orderRepository.save(existingOrder);
      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 0);
      return true;
    }

    return false;
  }
}
