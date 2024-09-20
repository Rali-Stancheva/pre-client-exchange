/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './modules/orders/orders.module';
import { AggregatedOrderBookModule } from './modules/aggregated-order-book/aggregated-order-book.module';
import { OrderBookModule } from './modules/order-book/order-book.module';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisGateway } from './modules/redis-client/redis-gateway';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 14,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'user',
      database: 'exchange',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
    }),
    OrdersModule,
    AggregatedOrderBookModule,
    OrderBookModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisGateway],
})
export class AppModule {}
