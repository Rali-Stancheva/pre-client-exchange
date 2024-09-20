/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { AggregatedOrderBook } from './entity/aggregated-order-book.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AggregatedOrderBookService {
  constructor(
    @InjectRepository(AggregatedOrderBook)
    private aggregatedOrderRepository: Repository<AggregatedOrderBook>,
  ) {}




async findAggregatedOrders(levels: number) {
    const sellOrders = await this.aggregatedOrderRepository.find({
      where: {
        orderType: 'sell',  
      },
      take: levels,  
    });


    const buyOrders = await this.aggregatedOrderRepository.find({
      where: {
        orderType: 'buy', 
      },
      take: levels,  
    });

    return { sellOrders, buyOrders };
  }

}
