import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { CreateWhatDto } from './dto/create-what.dto';
import { UpdateWhatDto } from './dto/update-what.dto';

@Controller('whats')
export class WhatsController {
  constructor(private readonly whatsService: WhatsService) {}


}
