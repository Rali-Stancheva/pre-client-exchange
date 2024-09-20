/* eslint-disable prettier/prettier */
 import {Controller  } from '@nestjs/common';
// import { OrderBookService } from './order-book.service';
//import { OrderBookDto } from './dto/order-book.dto';
// import { OrderDto } from '../orders/dto/order.dto';



@Controller('order-book')
export class OrderBookController {
    // constructor(private orderBookService: OrderBookService) {}

    // @Post('place-order')
    // async newOrders(@Body() orderDto: OrderDto) {
    //     const { amount, price, direction } = orderDto;

    //     try {
    //         await this.orderBookService.placeOrderWithMatch(amount, price, direction);
    //         return { message: 'Order placed successfully' };
    //     } catch (error) {
    //         return { message: 'Error placing order', error: error.message };
    //     }
    // }
}
