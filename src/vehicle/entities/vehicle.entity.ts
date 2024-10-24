import { Entity, Column, PrimaryGeneratedColumn , UpdateDateColumn, CreateDateColumn, } from 'typeorm';

@Entity()
export class Vehicle {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    uuid: number;

    @Column({ length: 25 })
    cadastre: string;

    @Column({ length: 20 })
    am: string;

    @Column({ length: 25 })
    owner: string;

    @Column({ length: 25 })
    type: string;

    @Column({ length: 20 })
    typeFull: string;

    @Column({ length: 20 })
    profile: string;

    @Column({ length: 25 })
    weight: string;

    @Column({ length: 50 })
    antt: string;

    @Column({ length: 50 })
    nameAntt: string;

    @Column({ length: 7 })
    plate: string;

    @Column({ length: 20 })
    chassis: string;

    @Column({ length: 4 })
    yearManufacture: string;

    @Column({ length: 20 })
    brand: string;
    
    @Column({ length: 40 })
    model: string;

    @Column({ length: 20 })
    color: string;

    @Column({ length: 50 })
    renavam: string;

    @Column({ length: 2 })
    uf: string;

    @Column({ length: 50 })
    city: string;

    @Column({ length: 20 })
    cubing: string;

    @Column({ length: 50 })
    cpfOwner: string;

    @Column({ length: 50 })
    rgOwner: string;

    @Column({ length: 50 })
    nameOwner: string;

    @Column({ length: 50 })
    phoneOwner: string;

    @Column({ length: 50 })
    relationOwner: string;

    @Column({ type:'date' })
    birthOwner: Date;

    @Column({ length: 50 })
    motherOwner: string;

    @Column({ length: 50 })
    cnpjOwner: string;

    @Column({ length: 50 })
    noStop: string;
    
    @Column({ length: 20 })
    noStopStatus: string;
 
    @Column({ length: 50 })
    stateRegistrationOwner: string;

    @Column({ length: 50 })
    companynameOwner: string;

    @Column({ length: 8 })
    zipCode: string;

    @Column({ length: 150 })
    street: string;

    @Column()
    number: number;

    @Column({ length: 80, default:null })
    complement: string;

    @Column({ length: 60 })
    district: string;

    @Column({ length: 50 })
    trackerBrand: string;

    @Column({ length: 50 })
    trackerStatus: string;

    @Column({ length: 50 })
    trackerNumber: string;

    @Column({ length: 40, default: null })
    cityOwner: string;

    @Column({ length: 2 })
    ufOwner: string;
}
