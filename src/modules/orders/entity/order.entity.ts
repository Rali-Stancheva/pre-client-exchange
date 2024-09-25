/* eslint-disable prettier/prettier */

import { OrderDirection } from 'src/common/enums/order-direction.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderMatch } from 'src/modules/order-match/entity/order-match.entity';

import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  amount: number;

  @Column('float')
  price: number;

  @Column('float')
  remaining: number; // what is the amount of order that has not been filled yet

  @Column()
  status: OrderStatus;

  @Column()
  direction: OrderDirection; //@Column({ type: 'enum', enum: OrderDirection })

  @Column()
  createdAt: Date;



  @ManyToOne(() => OrderMatch, (matches) => matches.order) 
  matches: OrderMatch[];
}
