import { Entity, Column, PrimaryGeneratedColumn , UpdateDateColumn, CreateDateColumn, } from 'typeorm';

@Entity()
export class Lead {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    id_admin: number;

    @Column({length: 50, default:null})
    name: string;
    
    @Column({ length: 50, default:null })
    phone: string;

    @Column({ length: 50, default:null })
    label: string;

    @Column({ length: 50, default:null })
    region: string;

    @Column({ length: 50, default:null })
    measure: string;
    
    @Column({ length: 200, default:null })
    observation: string;

    @Column({ length: 50, default:null })
    typeVehicle: string;

    @Column({ length: 1, default:'0' })
    status: string;

    @Column({length: 50})
    create_at: string;

    @Column({ default:null })
    update_at_occurrence: string;

    @Column({ default:null })
    update_at: string;

    @Column({ default:null })
    delete_at: string;
}
