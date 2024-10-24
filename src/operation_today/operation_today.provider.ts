import { DataSource } from 'typeorm';
import { OperationToday } from './entities/operation_today.entity';

export const operationTodayProviders = [
  {
    provide: 'OPERATIONTODAY_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OperationToday),
    inject: ['DATA_SOURCE'],
  },
];