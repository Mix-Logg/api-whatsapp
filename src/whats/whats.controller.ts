import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { CreateWhatDto } from './dto/create-what.dto';
import { UpdateWhatDto } from './dto/update-what.dto';

@Controller('whats')
export class WhatsController {
  constructor(private readonly whatsService: WhatsService) {}

  @Get('operation/availability/:number/:status/:date')
  availability(@Param('number') number: string, @Param('status') status: string, @Param('date') date: string) {
    return this.whatsService.availability(number, status, date);
  }

  @Get('appDriver/avalidPhoto/:number/:photo')
  avalidPhotoReproved(@Param('number') number: string, @Param('photo') photo: string) {
    return this.whatsService.avalidPhotoReproved(number, photo);
  }

  @Get('appDriver/forgotPassword/:number/:code')
  forgotPassword(@Param('number') number: string, @Param('code') code: string) {
    return this.whatsService.forgotPassword(number, code);
  }

}
