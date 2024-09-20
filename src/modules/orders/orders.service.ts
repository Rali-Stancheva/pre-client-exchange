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

@Injectable()
export class OrdersService {
  private readonly ORDER_BOOK_KEY = 'order-book';

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(OrderMatch)
    private readonly orderMatchRepository: Repository<OrderMatch>,
    private readonly redisGateway: RedisGateway,
  ) {}

  async onModuleInit() {
    const existingOrderBook: OrderBookDto = await this.redisGateway.get(
      this.ORDER_BOOK_KEY,
    );

    if (
      existingOrderBook.buyOrders.length === 0 &&
      existingOrderBook.sellOrders.length === 0
    ) {
      const buyOrders: Order[] = [];
      const sellOrders: Order[] = [];
      const orderBook: OrderBookDto = { buyOrders, sellOrders };

      await this.redisGateway.set(this.ORDER_BOOK_KEY, orderBook);
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
    const orderBook = await this.redisGateway.get<OrderBookDto>(
      this.ORDER_BOOK_KEY,
    );

    console.log(orderBook);

    if (!orderBook) {
      throw new NotFoundException('OrderBook not found');
    }

    if (direction === OrderDirection.SELL) {
      //buy => we have to look to buy

      console.log('ala', orderBook.buyOrders);

      for (let i = 0; i < orderBook.buyOrders.length; i++) {
        // минаваме по списъка buyOrders
        const buyObj = orderBook.buyOrders[i]; //obektite koito sa buy kolonkata

        if (
          buyObj.direction === OrderDirection.BUY &&
          buyObj.amount <= amount &&
          buyObj.price >= price
        ) {
          //match
          const orderMatch = new OrderMatch();
          orderMatch.buyOrderId = buyObj.id;
          orderMatch.sellOrderId = orderId;
          orderMatch.amount = amount;
          orderMatch.price = price;
          orderMatch.createdAt = new Date();

          await this.orderMatchRepository.save(orderMatch);

          if (amount >= buyObj.amount) {
            amount = amount - buyObj.amount;
            await this.orderRepository.delete(buyObj.id);
          }

          const newOrder = new Order();
          newOrder.amount = amount;
          newOrder.price = price;
          newOrder.remaining = amount;
          newOrder.status = OrderStatus.OPEN;
          newOrder.direction = OrderDirection.SELL;
          newOrder.createdAt = new Date();
          newOrder.matches = null;

          await this.orderRepository.save(newOrder);

          return orderMatch;
        }
      }
    } else if (direction === OrderDirection.BUY) {
      //sell => we have to look to sell

      let idOrderMatched = false;

      console.log('sell', orderBook);
      console.log('sell', orderBook.sellOrders);

      console.log('buy', orderBook.buyOrders);

      for (let i = 0; i < orderBook.sellOrders.length; i++) {
        const sellObj = orderBook.sellOrders[i]; //3, a:10, p: 26 //OBJ

        if (
          sellObj.direction === OrderDirection.SELL &&
          sellObj.amount >= amount &&
          sellObj.price <= price
        ) {
          //match
          sellObj.amount = sellObj.amount - amount; //намаляме количеството на sell order-a с който сме сключили сделка = remaining
          await this.orderRepository.save(sellObj);
          orderBook.sellOrders[i] = sellObj; //актуализираме масива
          await this.redisGateway.set(this.ORDER_BOOK_KEY, orderBook, 0);

          //make new record in OrderMatch
          const orderMatch = new OrderMatch();
          orderMatch.buyOrderId = orderId;
          orderMatch.sellOrderId = sellObj.id;
          orderMatch.amount = amount;
          orderMatch.price = price;

          await this.orderMatchRepository.save(orderMatch);

          if (sellObj.amount <= 0) {
            await this.orderRepository.delete(sellObj);
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

        const orderBook: OrderBookDto = await this.redisGateway.get(
          this.ORDER_BOOK_KEY,
        );

        orderBook.buyOrders.push(newOrder);

        await this.redisGateway.set(this.ORDER_BOOK_KEY, orderBook, 18000);
        return { message: 'No match! New order was created' };
      }
    } else {
      throw new Error('invalid input');
    }
  }

  async getSorderSellOrders(price: number) {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.direction = :direction', { direction: OrderDirection.SELL })
      .andWhere('order.status = :status', { status: OrderStatus.OPEN })
      .andWhere('order.price <= :price', { price })
      .orderBy('order.price', 'ASC') // Най-ниските цени първи
      .getMany();
  }
}
