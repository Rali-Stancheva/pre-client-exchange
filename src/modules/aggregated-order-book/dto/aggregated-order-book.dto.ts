/* eslint-disable prettier/prettier */
import { OrderBookEntry } from 'src/modules/order-book-entry/entity/order-book-entry.entity';

type  AggregatedOrders = Omit<OrderBookEntry, 'aggregatedOrderBook'>;

export class AggregatedOrderBookDto {

  aggregatedBuyOrders: AggregatedOrders[];

  aggregatedSellOrders: AggregatedOrders[];
}
