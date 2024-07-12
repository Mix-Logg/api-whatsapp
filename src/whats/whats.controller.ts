import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WhatsService } from './whats.service';
import { CreateWhatDto } from './dto/create-what.dto';
import { UpdateWhatDto } from './dto/update-what.dto';

@Controller('whats')
export class WhatsController {
  constructor(private readonly whatsService: WhatsService) {}

  @Post()
  create(@Body() createWhatDto: CreateWhatDto) {
    return this.whatsService.create(createWhatDto);
  }

  @Get()
  findAll() {
    return this.whatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whatsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWhatDto: UpdateWhatDto) {
    return this.whatsService.update(+id, updateWhatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whatsService.remove(+id);
  }
}
