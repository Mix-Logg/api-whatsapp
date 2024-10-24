import { Inject, Injectable } from '@nestjs/common';
import { CreateOperationTodayDto } from './dto/create-operation_today.dto';
import { UpdateOperationTodayDto } from './dto/update-operation_today.dto';
import { Repository } from 'typeorm';
import { OperationToday } from './entities/operation_today.entity';

@Injectable()
export class OperationTodayService {
  constructor(
    @Inject('OPERATIONTODAY_REPOSITORY') 
    private operationTodayRepository: Repository<OperationToday>,
  ){}

  create(createOperationTodayDto: CreateOperationTodayDto) {
    return 'This action adds a new operationToday';
  }

  findAll() {
    return `This action returns all operationToday`;
  }

  async findAllOneDate(date:string, operation:string) {
    const response = await this.operationTodayRepository.find({
      where: {
        date,
        operation,
        status : 'confirm'
      }
    });
    if(response != null){
      return response
    }
    return {
      status: 500,
      message: 'Registereds not found'
    }
  };

  findOne(id: number) {
    return `This action returns a #${id} operationToday`;
  }

  update(id: number, updateOperationTodayDto: UpdateOperationTodayDto) {
    return `This action updates a #${id} operationToday`;
  }

  remove(id: number) {
    return `This action removes a #${id} operationToday`;
  }
}

