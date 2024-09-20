/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { AggregatedOrderBookService } from './aggregated-order-book.service';

//@Controller('aggregated-order-book')
@Controller('api/exchange/order-book')
export class AggregatedOrderBookController {
  constructor(
    private aggregatedOrderBookService: AggregatedOrderBookService,
  ) {}



  @Get('/aggregated')
  async findAggregatedOrders(@Query('levels') levels: number) {
    return this.aggregatedOrderBookService.findAggregatedOrders(Number(levels));
  }
}
