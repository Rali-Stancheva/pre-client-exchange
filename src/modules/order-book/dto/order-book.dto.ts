/* eslint-disable prettier/prettier */

import { Order } from "../../../modules/orders/entity/order.entity";

export class OrderBookDto {

  buyOrders: Order[];

  sellOrders: Order[];
}