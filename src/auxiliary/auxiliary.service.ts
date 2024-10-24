import { Inject, Injectable } from '@nestjs/common';
import { CreateAuxiliaryDto } from './dto/create-auxiliary.dto';
import { IsNull, Repository } from 'typeorm';
import { UpdateStatus } from './dto/update-status-driver.dto';
import { Auxiliary } from './entities/auxiliary.entity';
import { UpdateCpf } from './dto/update-cpf-auxiliary.dto';
import { UpdateCnh } from './dto/update-cnh-auxiliary.dto';
import FindTimeSP from 'hooks/time';

@Injectable()
export class AuxiliaryService {
  constructor(
    @Inject('AUXILIARY_REPOSITORY') 
    private auxiliaryRepository: Repository<Auxiliary>,
  ){}

  async create(createAuxiliaryDto: CreateAuxiliaryDto) {
    const response = await this.auxiliaryRepository.save(createAuxiliaryDto);
    return response.id
  }

  async findAll() {
    return await this.auxiliaryRepository.createQueryBuilder('auxiliary')
    .where('auxiliary.delete_at IS NULL')
    .getMany();
  }

  async findAccepted(){
    return await this.auxiliaryRepository.createQueryBuilder('auxiliary')
    .where('auxiliary.delete_at IS NULL AND auxiliary.cadastralStatus = 1')
    .getMany();
  }

  async findNews(){
    return await this.auxiliaryRepository.createQueryBuilder('auxiliary')
    .where('auxiliary.delete_at IS NULL AND auxiliary.cadastralStatus = 0')
    .getMany();
  }

  async findByIds(Ids: number[]){
    if(Ids.length == 0){
      return {
        status: 500,
        message:'No have id'
      }
    }
    const auxiliary = await this.auxiliaryRepository.createQueryBuilder('auxiliary')
    .where('auxiliary.id IN (:...ids)', { ids: Ids })
    .getMany();
    return auxiliary
  }

  async findOne(id: number) {
    const response = await this.auxiliaryRepository.findOne({where:{id}});
    if(response != null){
      return response
    }
    return {
      status:500,
      message:'Auxiliary does not exist'
    }
  }

  async verifyCpf(cpf:string){
    const response = await this.auxiliaryRepository.findOne({where:{cpf}});
    if(response != null){
      return 200
    }
    return 500;
  }

  async findOneAuxiliary(cpf:string ,rg:string){
    const res = await this.auxiliaryRepository
      .createQueryBuilder("auxiliary")
      .where('cpf = :cpf',  { cpf} ) 
      .andWhere('rg = :rg', { rg } ) 
      .getOne();
    if(res != null){
      return res
    }else{
      return 500
    }
  }

  async findEmail(email: string) {
    const response = await this.auxiliaryRepository.findOne({where:{email}});
      if(response === null)
      {
        return {
          "email":"notExist"
        }
      }else{
        return response
      }
  }

  async findPhone(phone: string) {
    const response = await this.auxiliaryRepository.findOne({where:{phone}});
      if(response === null)
      {
        return {
          "phone":"notExist"
        }
      }else{
        return response
      }
  }

  async findAuxiliaryToOperation(cpf: string) {
    const response = await this.auxiliaryRepository.findOne(
      {
        where:{
          cpf,
          delete_at: IsNull()
        }
      }
    );
    if(response != null){
      return response
    }
    return {
      status: 500,
      message: 'Registereds not found'
    }
  }
  

  async update(id: number, UpdateStatus: UpdateStatus) {
    const res = await this.auxiliaryRepository.save({
      id: id,
      cadastralStatus: UpdateStatus.cadastralStatus,
    });
    return 200
  }

  async updateCnh(updateCnh: UpdateCnh) {
    const uuid = updateCnh.id
    const { id, ...updatedData } = updateCnh;
    const res = await this.auxiliaryRepository.update(uuid, updatedData);
    if(res.affected){
      return 200
    }else{
      return 500
    }
  }

  async updateCpf(updateCpf: UpdateCpf) {
    const uuid = updateCpf.id
    const res = await this.auxiliaryRepository.update(uuid, updateCpf);
    if(res.affected){
      return 200
    }else{
      return 500
    }
  }

  async remove(id: number) {
    const time = FindTimeSP();
    const DeleteDto = {
      delete_at:time
    }
    const response = await this.auxiliaryRepository.update(id, DeleteDto);
    if(response.affected){
      return {
        message: 'Successfully deleted',
        status: 200
      }
    }
    return {
      message: 'Error in deleting',
      status: 500
    }
  }
}
