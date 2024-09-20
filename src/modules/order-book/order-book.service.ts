/* eslint-disable prettier/prettier */
 import { Injectable } from '@nestjs/common';
// import { OrderBook } from './entity/order-book.entity';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { OrderDirection } from 'src/common/enums/order-direction.enum';
//import { Order } from '../orders/entity/order.entity';
// import { OrderMatch } from '../order-match/entity/order-match.entity';

@Injectable()
export class OrderBookService {
//   constructor(
//     @InjectRepository(OrderBook) private orderBookRepository: Repository<OrderBook>,
//     //@InjectRepository(Order) private orderRepository: Repository<Order>,
//     @InjectRepository(OrderMatch) private orderMatchRepository: Repository<OrderMatch>,
//   ) {}

//   async placeOrderWithMatch(amount: number, price: number, direction: string) {
//     const orderBooks = await this.orderBookRepository.find({
//       relations: ['sellOrders'],
//     });

//     if (!orderBooks || orderBooks.length === 0) {
//       throw new Error('No OrderBooks fount');
//     }

//     let remainingAmount = amount;

//     for (const orderBook of orderBooks) {
//       if (!orderBook.sellOrders || orderBook.sellOrders.length === 0) {
//         //if there is no orders => continue
//         continue;
//       }


//       //   for (const sellOrder of orderBook.sellOrders) {
//       //     if (sellOrder.amount >= amount && sellOrder.price <= price) {
//       //       sellOrder.amount = -remainingAmount;
//       //       remainingAmount = 0;

//       //       break;
//       //     } else {
//       //       //ako order частично покрива заявката
//       //       remainingAmount -= sellOrder.amount;
//       //       sellOrder.amount = 0;
//       //     }

//       //   }

//       //   //запазваме промените = ще трябва корекция
//       //   await this.ordeMatchRepository.save(orderBook);

//       // }


//       for (const sellOrder of orderBook.sellOrders) {
//         if (sellOrder.price <= price) {
//           // check if the price is equal or lower
//           const matchAmount = Math.min(remainingAmount, sellOrder.amount);

//           // Намаляваме количеството на sellOrder
//           sellOrder.amount -= matchAmount;
//           remainingAmount -= matchAmount;

//           // Създаваме нов запис в OrderMatch
//           const orderMatch = new OrderMatch();
//           orderMatch.buyOrderId =
//             direction === OrderDirection.BUY ? 0 : sellOrder.id; // ID на купуващия или продаващия
//           orderMatch.sellOrderId = sellOrder.id; // ID на продадения ордер
//           orderMatch.amount = matchAmount; // Съвпадналото количество
//           orderMatch.price = price; // Цената от заявката

//           await this.orderMatchRepository.save(orderMatch); // Запазваме новото съвпадение

//           // Ако няма останало количество, излизаме от цикъла
//           if (remainingAmount === 0) {
//             break;
//           }
//         }
//       }

//       // Запазваме промените в sellOrder
//       await this.orderBookRepository.save(orderBook);

//       // Ако сме изпълнили поръчката напълно, излизаме
//       if (remainingAmount === 0) {
//         console.log('Order fully matched');
//         break;
//       }
//     }

//     // Ако остане количество, поръчката не е напълно изпълнена
//     if (remainingAmount > 0) {
//         console.log(`Order could not be fully matched, remaining amount: ${remainingAmount}`);
//       }
//   }
  
}

