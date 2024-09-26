/* eslint-disable prettier/prettier */

import { OrderBookEntry } from '../../../modules/order-book-entry/entity/order-book-entry.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AggregatedOrderBook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  orderType: string; 
 
  @ManyToOne(() => OrderBookEntry, (buy) => buy.aggregatedOrderBook)
  buy: OrderBookEntry[];


  @ManyToOne(() => OrderBookEntry, (sell) => sell.aggregatedOrderBook)
  //@JoinColumn({ name: 'sell_id' })
  sell: OrderBookEntry[];
}
