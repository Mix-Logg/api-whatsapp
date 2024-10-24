import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OperationTodayService } from './operation_today.service';
import { CreateOperationTodayDto } from './dto/create-operation_today.dto';
import { UpdateOperationTodayDto } from './dto/update-operation_today.dto';

@Controller('operation-today')
export class OperationTodayController {
  constructor(private readonly operationTodayService: OperationTodayService) {}

  @Post()
  create(@Body() createOperationTodayDto: CreateOperationTodayDto) {
    return this.operationTodayService.create(createOperationTodayDto);
  }

  @Get()
  findAll() {
    return this.operationTodayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operationTodayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOperationTodayDto: UpdateOperationTodayDto) {
    return this.operationTodayService.update(+id, updateOperationTodayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.operationTodayService.remove(+id);
  }
}
