/* eslint-disable prettier/prettier */

import { Order } from 'src/modules/orders/entity/order.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OrderMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  buyOrderId: number;

  @Column()
  sellOrderId: number;

  @Column('float')
  price: number;

  @Column('float')
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.matches)
  order: Order;
}
