import { Module } from '@nestjs/common';
import { OperationTodayService } from './operation_today.service';
import { OperationTodayController } from './operation_today.controller';
import { DatabaseModule } from 'src/database/database.module';
import { operationTodayProviders } from './operation_today.provider';

@Module({
  imports : [DatabaseModule],
  controllers: [OperationTodayController],
  providers: [...operationTodayProviders,OperationTodayService],
  exports: [OperationTodayService]
})

export class OperationTodayModule {}
