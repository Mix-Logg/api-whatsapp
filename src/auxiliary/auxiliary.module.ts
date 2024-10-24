import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AuxiliaryService } from './auxiliary.service';
import { AuxiliaryController } from './auxiliary.controller';
import { AuxiliaryProviders } from './auxiliary.provider';

@Module({
  imports:[DatabaseModule,],
  controllers: [AuxiliaryController],
  providers: [...AuxiliaryProviders,AuxiliaryService],
  exports:[AuxiliaryService]
})

export class AuxiliaryModule {}
