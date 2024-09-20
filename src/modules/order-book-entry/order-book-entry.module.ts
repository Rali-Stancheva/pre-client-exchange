import { Module } from '@nestjs/common';
import { OrderBookEntryController } from './order-book-entry.controller';
import { OrderBookEntryService } from './order-book-entry.service';

@Module({
  controllers: [OrderBookEntryController],
  providers: [OrderBookEntryService]
})
export class OrderBookEntryModule {}
