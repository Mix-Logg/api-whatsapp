import { Inject, Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UploadLeadDto } from './dto/upload-lead-dto';
import { Lead } from './entities/lead.entity';
import { Raw, Repository } from 'typeorm';
import findTimeSP from 'hooks/time';
@Injectable()
export class LeadService {
  constructor(
    @Inject('LEAD_REPOSITORY') 
    private leadRepository: Repository<Lead>,
  ){}

  async create(createLeadDto: CreateLeadDto) {
    try{
      await this.leadRepository.save(createLeadDto);
      return {
        status:201,
        result:'Successfully created lead'
      }
    }catch(e){
      return {
        status:501,
        result:'Server error'
      }
    }
  };

  async findAll() {
    const response = await this.leadRepository.find();
    return response
  };

  async findOne(id: number) {
    const lead = await this.leadRepository.findOne({where:{id}});
    if(lead != null){
      return lead
    }
    return {
      status:500,
      message:'Lead does not exist'
    }
  };

  async findAllTypeVehicle(typeVehicle: string) {
    const lead = await this.leadRepository.find({where:{typeVehicle}});
    if(lead != null){
      return lead
    }
    return {
      status:500,
      message:'Lead does not exist'
    }
  };

  async findAllByEmailValid() {
    const lead = await this.leadRepository.find({
      where: {
        email: Raw((alias) => `
          ${alias} REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
          AND ${alias} NOT LIKE '%. %' 
          AND ${alias} NOT LIKE '% %' 
          AND ${alias} NOT LIKE '%@%@%' 
          AND ${alias} NOT LIKE '%@.%' 
          AND ${alias} NOT LIKE '%.coml' 
          AND ${alias} NOT LIKE '%.brl' 
          AND LENGTH(${alias}) BETWEEN 6 AND 320
        `),
      },
      // Removendo a propriedade 'distinct' que não existe em FindManyOptions<Lead>
    });
  
    if (lead.length > 0) {
      return {
        status:200,
        result:lead
      };
    }
  
    return {
      status: 500,
      message: 'Lead does not exist',
    };
  }
  

  async findOnePhone(phone: string) {
    console.log(phone)
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
