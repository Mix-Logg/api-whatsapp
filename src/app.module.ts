import {ConfigModule} from "@nestjs/config";
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsModule } from './whats/whats.module';
import { LeadModule } from "./lead/lead.module";
@Module({
  imports: [ConfigModule.forRoot({ envFilePath: ['.env.development.local', '.env.production'],}), WhatsModule, LeadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
