import { DataSource } from 'typeorm';
import { Auxiliary } from './entities/auxiliary.entity';

export const AuxiliaryProviders = [
  {
    provide: 'AUXILIARY_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Auxiliary),
    inject: ['DATA_SOURCE'],
  },
];