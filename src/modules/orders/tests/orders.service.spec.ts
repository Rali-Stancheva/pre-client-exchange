/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { OrderDirection } from '../../../common/enums/order-direction.enum';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderDto } from '../dto/order.dto';
import { Order } from '../entity/order.entity';
//import { Repository } from 'typeorm';
import { RedisGateway } from '../../../modules/redis-client/redis-gateway';
import { OrderMatch } from '../../../modules/order-match/entity/order-match.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('OrdersService', () => {
  let service: OrdersService;
 // let orderRepository: Repository<Order>;
  //let orderMatchRepository: Repository<OrderMatch>;

  const mockOrderData: OrderDto = {
    id: 1,
    amount: 10,
    price: 26,
    remaining: 10,
    status: OrderStatus.OPEN,
    direction: OrderDirection.SELL,
    createdAt: new Date(),
    matches: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOneBy: jest.fn().mockResolvedValue(mockOrderData),
            find: jest.fn().mockResolvedValue(mockOrderData),
          },
        },

        {
          provide: RedisGateway,
          useValue: {
            set: jest.fn().mockResolvedValue({}),
            get: jest.fn().mockResolvedValue({}),
           
          },
        },
        
        {
          provide: getRepositoryToken(OrderMatch),
          useValue: {
            
           
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
   // orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    //orderMatchRepository = module.get<Repository<OrderMatch>>(getRepositoryToken(OrderMatch));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
