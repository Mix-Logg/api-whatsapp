import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuxiliaryService } from './auxiliary.service';
import { CreateAuxiliaryDto } from './dto/create-auxiliary.dto';
import { UpdateStatus } from './dto/update-status-driver.dto';
import { UpdateCnh } from './dto/update-cnh-auxiliary.dto';
import { UpdateCpf } from './dto/update-cpf-auxiliary.dto';
import { getCpf } from './dto/get-auxiliary.dto';
import { FindIds } from './dto/findIds-auxiliary-dto';
@Controller('auxiliary')
export class AuxiliaryController {
  constructor(private readonly auxiliaryService: AuxiliaryService) {}

  @Post()
  create(@Body() createAuxiliaryDto: CreateAuxiliaryDto) {
    return this.auxiliaryService.create(createAuxiliaryDto);
  }

  @Post('findByIds')
  findByIds(@Body() findIds: FindIds ){
    return this.auxiliaryService.findByIds(findIds.Ids);
  }

  @Get()
  findAll() {
    return this.auxiliaryService.findAll();
  }

  @Get(':cpf/:rg')
  findOneAuxiliary(
    @Param('cpf') cpf: string,
    @Param('rg')  rg: string,
    ){
    return this.auxiliaryService.findOneAuxiliary(cpf,rg);
  }

  @Get('operation/:cpf')
  findAuxiliaryToOperation(
    @Param('cpf') cpf: string,
  ){
    return this.auxiliaryService.findAuxiliaryToOperation(cpf);
  }

  @Get('find/ByCpf/:cpf')
  findAuxiliaryById(
    @Param('cpf') cpf: string,
  ){
    return this.auxiliaryService.findAuxiliaryToOperation(cpf);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auxiliaryService.findOne(+id);
  } 

  @Post('cnh')
  updateCnh(@Body() updateCnh: UpdateCnh) {
    return this.auxiliaryService.updateCnh(updateCnh);
  }

  @Post('cpf')
  updateCpf(@Body() updateCpf: UpdateCpf) {
    return this.auxiliaryService.updateCpf(updateCpf);
  }

  @Post('verifyCpf')
  verifyCpf(@Body() params: getCpf) {
    return this.auxiliaryService.verifyCpf(params.cpf);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateStatus) {
    return this.auxiliaryService.update(+id, updateDriverDto);
  }

  @Patch('delete/:id')
  remove(@Param('id') id: string) {
    return this.auxiliaryService.remove(+id);
  }
}
