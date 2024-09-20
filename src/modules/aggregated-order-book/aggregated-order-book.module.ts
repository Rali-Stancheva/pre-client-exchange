import { Module } from '@nestjs/common';
import { AggregatedOrderBookController } from './aggregated-order-book.controller';
import { AggregatedOrderBookService } from './aggregated-order-book.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregatedOrderBook } from './entity/aggregated-order-book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AggregatedOrderBook])],
  controllers: [AggregatedOrderBookController],
  providers: [AggregatedOrderBookService],
})
export class AggregatedOrderBookModule {}
