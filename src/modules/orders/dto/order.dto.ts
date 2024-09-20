/* eslint-disable prettier/prettier */

import { OrderDirection } from 'src/common/enums/order-direction.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderMatch } from 'src/modules/order-match/entity/order-match.entity';

export class OrderDto {
    
  id: number;

  amount: number;

  price: number;

  remaining: number;

  status: OrderStatus;

  direction: OrderDirection;

  createdAt: Date;

  matches: OrderMatch[];
}
