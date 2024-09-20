/* eslint-disable prettier/prettier */

import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  Query,
  BadRequestException,
  Post,
  Body,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderDirection } from 'src/common/enums/order-direction.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Controller('api/exchange/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('id/:id')
  async findSpecificOrder(@Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.findOrder(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }


  
  @Get(':direction')
  async getOrdersByDirection(
    @Param('direction') direction: string,
    @Query('status') status: string
  ) {
   
    if (!Object.values(OrderDirection).includes(direction.toLowerCase() as OrderDirection)) {
      throw new BadRequestException('Invalid Order Direction');
    }

   
    const statusList = status.split('|').map(s => s.toLowerCase() as OrderStatus);
    const validStatuses = Object.values(OrderStatus);

    if (statusList.some(s => !validStatuses.includes(s))) {
      throw new BadRequestException('Invalid Order Status');
    }

    return this.ordersService.findOrderByDirectionAndStatus(direction as OrderDirection, statusList);
  }


  @Post()
  async createOrder(@Body() body: { id: number, amount: number, price: number, direction: string}) {
    const { id, amount, price, direction } = body;

   const result = await this.ordersService.newOrderWithMatch(id, amount, price, direction);

   // return  { message: 'Order matched successfully' };

   return result;
  }

}
