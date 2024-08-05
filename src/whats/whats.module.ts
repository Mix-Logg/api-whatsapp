import { Module } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { WhatsController } from './whats.controller';
import { LeadModule } from 'src/lead/lead.module';

@Module({
  imports: [LeadModule],
  controllers: [WhatsController],
  providers: [WhatsService],
})
export class WhatsModule {}
