import { Module } from '@nestjs/common';
import { OrderBookController } from './order-book.controller';
import { OrderBookService } from './order-book.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../orders/entity/order.entity';
import { OrderMatch } from '../order-match/entity/order-match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderMatch])],
  controllers: [OrderBookController],
  providers: [OrderBookService],
})
export class OrderBookModule {}
