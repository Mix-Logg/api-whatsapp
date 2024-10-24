import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { WhatsController } from './whats.controller';
import { LeadModule } from 'src/lead/lead.module';
import { OperationTodayModule } from 'src/operation_today/operation_today.module';
import { DriverModule } from 'src/driver/driver.module';
import { AuxiliaryModule } from 'src/auxiliary/auxiliary.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';

@Module({
  imports: [LeadModule, OperationTodayModule, AuxiliaryModule, DriverModule, VehicleModule],
  controllers: [WhatsController],
  providers: [WhatsService],
})
export class WhatsModule {}
