import { Module, } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { DatabaseModule } from 'src/database/database.module';
import { driverProviders } from './driver.provider';

@Module({
  imports:[DatabaseModule],
  controllers: [DriverController],
  providers: [...driverProviders,DriverService],
  exports:[DriverService]
})
export class DriverModule {}
