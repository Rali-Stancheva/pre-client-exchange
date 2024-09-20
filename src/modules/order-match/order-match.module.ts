import { Module } from '@nestjs/common';
import { OrderMatchController } from './order-match.controller';
import { OrderMatchService } from './order-match.service';

@Module({
  controllers: [OrderMatchController],
  providers: [OrderMatchService],
})
export class OrderMatchModule {}
