/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderMatch } from '../order-match/entity/order-match.entity';

import { RedisGateway } from '../redis-client/redis-gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderMatch])],
  providers: [OrdersService, RedisGateway],
  controllers: [OrdersController],
})
export class OrdersModule {}
