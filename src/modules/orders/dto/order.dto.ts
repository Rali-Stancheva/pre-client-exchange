/* eslint-disable prettier/prettier */

import { OrderDirection } from "../../../common/enums/order-direction.enum";
import { OrderStatus } from "../../../common/enums/order-status.enum";
import { OrderMatch } from '../../../modules/order-match/entity/order-match.entity';
import { IsNumber, IsNumberString } from 'class-validator';

export class OrderDto {
   
  @IsNumberString()
  id: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  price: number;

  @IsNumber()
  remaining: number;

  status: OrderStatus;

  direction: OrderDirection;

  createdAt: Date;

  matches: OrderMatch[];
}
