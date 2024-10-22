import { Inject, Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UploadLeadDto } from './dto/upload-lead-dto';
import { Lead } from './entities/lead.entity';
import { Repository } from 'typeorm';
import findTimeSP from 'hooks/time';
@Injectable()
export class LeadService {

  constructor(
    @Inject('LEAD_REPOSITORY') 
    private leadRepository: Repository<Lead>,
  ){}

  async create(createLeadDto: CreateLeadDto) {
    try{
      const lead = await this.leadRepository.save(createLeadDto);
      createLeadDto.phone = createLeadDto.phone.replace('@c.us', '');
      return {
        status:201,
        result:lead
      }
    }catch(e){
      return {
        status:501,
        result:'Server error'
      }
    }
  };

  findAll() {
    return this.leadRepository.find();
  };

  async findOne(id: number) {
    const lead = await this.leadRepository.findOne({where:{id}});
    if(lead){
      return lead
    }
    return {
      status:500,
      message:'Lead does not exist'
    }
  };

  async findOnePhone(phone: string) {
    phone = phone.replace('@c.us', '');
    const lead = await this.leadRepository.findOne({where:{phone}});
    if(lead){
      return {
        status:200,
        result:lead
      }
    }
    return {
      status:500,
      message:'Lead does not exist'
    }
  };

  async update(id: number, updateLeadDto: UpdateLeadDto) {
    const lead = await this.findOne(id);
    if(lead.status == 500){
      return {
        status:404,
        message:'Lead does not exist'
      }
    }
    const res = await this.leadRepository.update(id, updateLeadDto);
    if(res.affected){
      return {
        status:200,
         message:'Lead updated successfully'
      }
    }
    return {
      status:500,
      message:'Server error'
    }

  };

  async remove(id: number) {
    return `This action removes a #${id} lead`;
  };

}
