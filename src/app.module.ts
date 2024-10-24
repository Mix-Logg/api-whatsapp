import {ConfigModule} from "@nestjs/config";
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsModule } from './whats/whats.module';
import { DriverModule } from "./driver/driver.module";
import { AuxiliaryModule } from "./auxiliary/auxiliary.module";
import { VehicleModule } from "./vehicle/vehicle.module";
import { LeadModule } from "./lead/lead.module";
import { OperationTodayModule } from './operation_today/operation_today.module';
@Module({
  imports: [ConfigModule.forRoot({ envFilePath: ['.env.development.local', '.env.production'],}), WhatsModule, LeadModule, OperationTodayModule, DriverModule, AuxiliaryModule, VehicleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
