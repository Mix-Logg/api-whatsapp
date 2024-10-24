import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateCnh } from './dto/update-cnh-driver.dto';
import { UpdateCpf } from './dto/update-cpf-driver.dto';
import { UpdateStatus } from './dto/update-status-driver.dto';
import { getCpf } from './dto/get-driver.dto';
import { ValidateDates } from './dto/validate-driver.dto';
import { FindIds  } from './dto/findIds-driver-dto';
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  
  @Post()
  async create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }
  
  @Post('findByIds')
  findByIds(@Body() findIds: FindIds ){
    return this.driverService.findByIds(findIds.Ids);
  }

  @Post('getUser')
  async getUser(@Body() getUser: getCpf) {
    return this.driverService.getUser(getUser.cpf);
  }

  @Post('validate')
  async validate(@Body() validateDates:ValidateDates){
    return this.driverService.validateDates(validateDates);
  }

  @Post('cnh')
  updateCnh(@Body() updateCnh: UpdateCnh) {
    return this.driverService.updateCnh(updateCnh);
  }

  @Post('cpf')
  updateCpf(@Body() updateCpf: UpdateCpf) {
    return this.driverService.updateCpf(updateCpf);
  }

  @Get()
  findAll() {
    return this.driverService.findAll();
  }

  @Get('find/ByCpf/:cpf')
  findByCpf(
    @Param('cpf') cpf: string,
  ) {
    return this.driverService.findByCpf(cpf);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverService.findOne(+id);
  }

  @Get(':cpf/:rg')
  findOneDriver(
    @Param('cpf') cpf: string,
    @Param('rg')  rg: string,
    ){
    return this.driverService.findOneDriver(cpf,rg);
  }

  @Post('verifyCpf')
  verifyCpf(@Body() params: getCpf) {
    return this.driverService.verifyCpf(params.cpf);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateStatus) {
    return this.driverService.update(+id, updateDriverDto);
  }

  @Patch('delete/:id')
  remove(@Param('id') id: string) {
    return this.driverService.remove(+id);
  }
}
