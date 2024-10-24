import { Controller, Get, Post, Body, Patch, Param, Delete, Res, StreamableFile, } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {  UpdateAntt } from './dto/update-antt-vehicle.dto';
import { UpdateAddressDto } from './dto/update-address-dto'
import { UpdateClv } from './dto/update-clv-vehicle.dto'
import { UpdateOwner,UpdateCnpjOwner, UpdateLegalOwner } from './dto/update-owner-vehicle.dto'
import { createReadStream } from 'fs';
import { join } from 'path';
@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }

  @Get(':id/:am')
  findOne(
    @Param('id') id: number,
    @Param('am') am: string
    ) 
  {
    return this.vehicleService.findOne(id, am);
  }
  @Get(':plate')
  findPlate(@Param('plate') plate: string)
  {
    return this.vehicleService.findOnePlate(plate);
  }
  
  @Patch('antt')
  updateAntt(@Body() updateAntt: UpdateAntt) {
    return this.vehicleService.updateAntt(updateAntt);
  }

  @Patch('clv')
  updateClv(@Body() updateClv: UpdateClv) {
    return this.vehicleService.updateClv(updateClv);
  }

  @Patch('owner')
  updateOwner(@Body() updateOwner: UpdateOwner) {
    return this.vehicleService.updateOwner(updateOwner);
  }

  @Patch('legal')
  updateOwnerLegal(@Body() updateLegalOwner: UpdateLegalOwner) {
    return this.vehicleService.updateLegal(updateLegalOwner);
  }

  @Patch('cnpj')
  updateOwnerCnpj(@Body() updateCnpjOwner: UpdateCnpjOwner) {
    return this.vehicleService.updateCnpj(updateCnpjOwner);
  }

  @Patch('addressOwner')
  updateOwnerAddress(@Body() updateAddressDto: UpdateAddressDto) {
    return this.vehicleService.updateAddress(updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(+id);
  }
}
