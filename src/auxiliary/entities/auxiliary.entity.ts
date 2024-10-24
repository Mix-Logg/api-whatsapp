import { Entity, Column, PrimaryGeneratedColumn , UpdateDateColumn, CreateDateColumn, } from 'typeorm';

@Entity()
export class Auxiliary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, default:null })
    name: string;

    @Column({type: "date", default:null})
    birth: Date;
    
    @Column({ length: 50, default:null })
    father: string;

    @Column({ length: 50, default:null })
    mother: string;

    @Column({ length: 200 })
    email: string;

    @Column({ length: 50, default:null })
    pix: string;

    @Column({ length: 11 })
    phone: string;

    @Column({ length: 11, default:null })
    cpf: string;

    @Column({ length: 50, default:null })
    rg: string;

    @Column({ length: 50, default:null })
    dispatchingAgencyRg: string;

    @Column({ type:"date", default:null })
    dateIssueRg: Date;

    @Column({ length: 50, default:null })
    cnh: string;

    @Column({ length: 20, default:null })
    registerCnh: string;

    @Column({ length: 10, default:null })
    categoryCnh: string;

    @Column({ type:"date", default:null })
    validityCnh: Date;

    @Column({ length: 2, default:null })
    ufCnh: string;

    @Column({ length: 1, default:'0' })
    cadastralStatus: string;

    @CreateDateColumn({type: "timestamp"})
    create_at: Date;

    @UpdateDateColumn({type: "timestamp", default:null, })
    update_at: Date;

    @Column({ default:null, })
    delete_at: string;
}
