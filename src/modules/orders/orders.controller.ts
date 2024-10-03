/* eslint-disable prettier/prettier */

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderDirection } from '../../common/enums/order-direction.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Order } from './entity/order.entity';

@Controller('api/exchange/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('id/:id')
  async findSpecificOrder(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return await this.ordersService.findOrder(id);
  }

  @Get(':direction')
  async getOrdersByDirectionAndStatus(
    @Param('direction') direction: OrderDirection,
    @Query('status') status: OrderStatus,
  ): Promise<Order[]> {
    if (
      !Object.values(OrderDirection).includes(
        direction.toLowerCase() as OrderDirection,
      )
    ) {
      throw new NotFoundException('Invalid Order Direction');
    }

    const statusList = status
      .split('|')
      .map((s) => s.toLowerCase() as OrderStatus);
    const validStatuses = Object.values(OrderStatus);

    if (statusList.some((s) => !validStatuses.includes(s))) {
      throw new NotFoundException('Invalid Order Status');
    }

    return this.ordersService.findOrderByDirectionAndStatus(
      direction as OrderDirection,
      statusList,
    );
  }

  @Post()
  async createOrder(
    @Body()
    body: {
      id: number;
      amount: number;
      price: number;
      direction: string;
    },
  ) {
    const { id, amount, price, direction } = body;

    const result = await this.ordersService.placeOrder(
      id,
      amount,
      price,
      direction,
    );

    return result;
  }
}
