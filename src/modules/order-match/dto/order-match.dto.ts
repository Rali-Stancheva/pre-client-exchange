/* eslint-disable prettier/prettier */
import { Order } from '../../../modules/orders/entity/order.entity';

export class OrderMatchDto {
  id: number;

  buyOrderId: number;

  sellOrderId: number;

  price: number;

  amount: number;

  createdAt: Date;

  order: Order;
}
