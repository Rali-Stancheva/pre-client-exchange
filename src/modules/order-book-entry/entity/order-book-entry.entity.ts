/* eslint-disable prettier/prettier */

import { AggregatedOrderBook } from '../../../modules/aggregated-order-book/entity/aggregated-order-book.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OrderBookEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  price: number;

  @Column()
  amount: number;

  
  @OneToMany(() => AggregatedOrderBook, (aggregatedOrderBook) => aggregatedOrderBook.buy)
  @OneToMany(() => AggregatedOrderBook, (aggregatedOrderBook) => aggregatedOrderBook.sell)
  aggregatedOrderBook: AggregatedOrderBook;

  
  
}
