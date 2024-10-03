/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderDirection } from '../../common/enums/order-direction.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderMatch } from '../order-match/entity/order-match.entity';
import { RedisGateway } from '../redis-client/redis-gateway';
import { OrderBookDto } from '../order-book/dto/order-book.dto';
import { ORDER_BOOK_KEY } from '../../common/constants/constants';

@Injectable()
export class OrdersService {
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
      await this.initializeOrderBook();
    }
  }

  private async initializeOrderBook() {
    const orderBook: OrderBookDto = { buyOrders: [], sellOrders: [] };
    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook);
  }

  async findOrder(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['matches'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

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

  async placeOrder(
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
      return await this.handleSellOrder(orderId, amount, price, orderBook);
    } else if (direction === OrderDirection.BUY) {
      return await this.handleBuyOrder(orderId, amount, price, orderBook);
    } else {
      throw new Error('invalid input');
    }
  }

  private async handleSellOrder(
    orderId: number,
    amount: number,
    price: number,
    orderBook: OrderBookDto,
  ) {
    const isDuplicate = await this.handleDublicateSellOrders(orderBook, price);
    if (isDuplicate) {
      return;
    }

    await this.sortSellOrders();
    let isOrderMatched = false;

    for (let i = 0; i < orderBook.buyOrders.length; i++) {
      const buyObj = orderBook.buyOrders[i]; //obektite koito sa buy kolonkata

      if (buyObj.direction === OrderDirection.BUY && buyObj.price >= price) {
        isOrderMatched = true;

        return await this.processSellOrderMatch(
          orderId,
          amount,
          price,
          buyObj,
          orderBook,
        ); //match
      }
    }

    if (!isOrderMatched) {
      return await this.createNewSellOrder(amount, price, orderBook); // no match - new Order
    }
  }

  //match- create new order in OrderMatch
  private async processSellOrderMatch(
    orderId: number,
    amount: number,
    price: number,
    buyObj: Order,
    orderBook: OrderBookDto,
  ) {
    const orderMatch = new OrderMatch();
    orderMatch.buyOrderId = buyObj.id;
    orderMatch.sellOrderId = orderId;
    orderMatch.amount = amount;
    orderMatch.price = price;
    orderMatch.createdAt = new Date();
    await this.orderMatchRepository.save(orderMatch);

    if (amount > buyObj.amount) {
      // ako 10 > 9
      amount = amount - buyObj.amount; // 10 - 9 =1

      orderBook.buyOrders = orderBook.buyOrders.filter(
        (order) => order.id !== buyObj.id,
      ); //трие от редис
      await this.orderRepository.delete(buyObj.id); // трие в базата

      const newOrder = await this.createNewOrder(
        amount,
        price,
        OrderDirection.SELL,
      );
      orderBook.sellOrders.push(newOrder);
      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);

      return orderMatch;
    } else {
      //ako 10 < 12
      buyObj.amount = buyObj.amount - amount; //12 - 10 = 2
      buyObj.remaining = buyObj.amount;

      //ако amount <= 0  да се трие записа
      if (buyObj.amount <= 0) {
        await this.orderRepository.delete(buyObj.id); // ot bazata
        orderBook.buyOrders = orderBook.buyOrders.filter(
          (order) => order.id !== buyObj.id,
        ); // Remove matched order
      } else {
        await this.orderRepository.save(buyObj);
      }

      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
      return orderMatch;
    }
  }

  private async createNewSellOrder(
    amount: number,
    price: number,
    orderBook: OrderBookDto,
  ) {
    const newOrder = await this.createNewOrder(
      amount,
      price,
      OrderDirection.SELL,
    );

    orderBook.sellOrders.push(newOrder);
    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return { message: 'No match! New order was created' };
  }

  private async createNewOrder(
    amount: number,
    price: number,
    direction: OrderDirection,
  ) {
    const newOrder = new Order();
    newOrder.amount = amount;
    newOrder.price = price;
    newOrder.remaining = amount;
    newOrder.status = OrderStatus.OPEN;
    newOrder.direction = direction;
    newOrder.createdAt = new Date();
    newOrder.matches = null;

    await this.orderRepository.save(newOrder);
    return newOrder;
  }

  private async handleBuyOrder(
    orderId: number,
    amount: number,
    price: number,
    orderBook: OrderBookDto,
  ) {
    const isDuplicate = await this.handleDublicateBuyOrders(orderBook, price);
    if (isDuplicate) {
      return;
    }

    await this.sortBuyOrders();
    let idOrderMatched = false;

    for (let i = 0; i < orderBook.sellOrders.length; i++) {
      const sellObj = orderBook.sellOrders[i]; //obektite koito sa sell kolonkata

      if (
        sellObj.direction === OrderDirection.SELL &&
        sellObj.amount >= amount &&
        sellObj.price <= price
      ) {
        idOrderMatched = true;
        return await this.processBuyOrderMatch(
          orderId,
          amount,
          price,
          sellObj,
          orderBook,
        );
      }
    }

    if (!idOrderMatched) {
      return await this.createNewBuyOrder(amount, price, orderBook);
    }
  }

  private async processBuyOrderMatch(
    orderId: number,
    amount: number,
    price: number,
    sellObj: Order,
    orderBook: OrderBookDto,
  ) {
    sellObj.amount = sellObj.amount - amount;
    sellObj.remaining = sellObj.amount; // Update remaining amount
    await this.orderRepository.save(sellObj);

    // ako sellObj e napulno matched
    if (sellObj.amount <= 0) {
      await this.orderRepository.delete(sellObj.id);

      // Remove matched order
      orderBook.sellOrders = orderBook.sellOrders.filter(
        (order) => order.id !== sellObj.id,
      );
    }

    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000); // Update Redis with the latest order book

    const orderMatch = new OrderMatch();
    orderMatch.buyOrderId = orderId;
    orderMatch.sellOrderId = sellObj.id;
    orderMatch.amount = amount;
    orderMatch.price = price;
    await this.orderMatchRepository.save(orderMatch);

    return orderMatch;
  }

  private async createNewBuyOrder(
    amount: number,
    price: number,
    orderBook: OrderBookDto,
  ) {
    const newOrder = await this.createNewOrder(
      amount,
      price,
      OrderDirection.BUY,
    );

    orderBook.buyOrders.push(newOrder);
    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return { message: 'No match! New order was created' };
  }

  private async sortSellOrders(): Promise<OrderBookDto> {
    const orderBook: OrderBookDto = await this.redisGateway.get(ORDER_BOOK_KEY);

    if (orderBook.sellOrders && orderBook.sellOrders.length > 0) {
      orderBook.sellOrders.sort((a, b) => a.price - b.price);
    }

    //orderBook.sellOrders.sort((a, b) => a.price - b.price);
    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return orderBook;
  }

  private async sortBuyOrders(): Promise<OrderBookDto> {
    const orderBook: OrderBookDto = await this.redisGateway.get(ORDER_BOOK_KEY);
    orderBook.buyOrders.sort((a, b) => b.price - a.price);
    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return orderBook;
  }

  //ако има едни и същи хора с еднакъв order просто да се увеличи amount-a, не се създава нов запис
  private async handleDublicateBuyOrders(
    orderBook: OrderBookDto,
    price: number,
  ) {
    const existingOrder = orderBook.buyOrders.find(
      (order) =>
        order.price === price && order.direction === OrderDirection.BUY,
    );

    if (existingOrder) {
      existingOrder.amount += 1; //ne s 1 ami
      existingOrder.remaining = existingOrder.amount;
      await this.orderRepository.save(existingOrder);
      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 0);
      return true;
    }
    return false;
  }

  //ако има едни и същи хора с еднакъв order просто да се увеличи amount-a, не се създава нов запис
  private async handleDublicateSellOrders(
    orderBook: OrderBookDto,
    price: number,
  ) {
    const existingOrder = orderBook.sellOrders.find(
      (order) =>
        order.price === price && order.direction === OrderDirection.SELL,
    );

    if (existingOrder) {
      existingOrder.amount += 1; //дали трябва да се увеличи с 1 или с amount-a на нови човек
      existingOrder.remaining = existingOrder.amount;

      await this.orderRepository.save(existingOrder);
      await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 0);
      return true;
    }
    return false;
  }
}
