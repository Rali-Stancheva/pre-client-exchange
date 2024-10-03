/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { RedisGateway } from '../redis-client/redis-gateway';
import { OrderBookDto } from '../order-book/dto/order-book.dto';
import { ORDER_BOOK_KEY } from '../../common/constants/constants';
import { AggregatedOrderBookDto } from './dto/aggregated-order-book.dto';

@Injectable()
export class AggregatedOrderBookService {
  constructor(private readonly redisGateway: RedisGateway) {}

  async findAggregatedOrders(levels: number): Promise<AggregatedOrderBookDto> {

    const orderBook: OrderBookDto = await this.sortOrders();

    const aggregatedBuyOrders = orderBook.buyOrders
      .map((buyOrder) => ({
        id: buyOrder.id,
        amount: buyOrder.amount,
        price: buyOrder.price,
      }))
      .slice(0, levels);

    const aggregatedSellOrders = orderBook.sellOrders
      .map((sellOrder) => ({
        id: sellOrder.id,
        amount: sellOrder.amount,
        price: sellOrder.price,
      }))
      .slice(0, levels);

    return { aggregatedBuyOrders, aggregatedSellOrders };
  }

  private async sortOrders(): Promise<OrderBookDto> {
    const orderBook: OrderBookDto = await this.redisGateway.get(ORDER_BOOK_KEY);

    orderBook.buyOrders.sort((a, b) => b.price - a.price); // desc  golqmo -> malko
    orderBook.sellOrders.sort((a, b) => a.price - b.price); //asc   malko -> golqmo

    await this.redisGateway.set(ORDER_BOOK_KEY, orderBook, 18000);
    return orderBook;
  }
}
