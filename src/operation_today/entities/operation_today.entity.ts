import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OperationToday {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    idDriver   : number;

    @Column()
    idAdmin  : number;

    @Column()
    idAuxiliary: number;

    @Column()
    date: string;

    @Column({ length: 200 })
    team: string;

    @Column({ length: 20, default:'0' })
    status: string;
    
    @Column({ length: 50 })
    operation: string;

    @Column({ length: 50, default:null })
    start: string;

    @Column({ length: 200, default:null })
    occurrence: string;

    @Column({length: 50})
    create_at: string;

    @Column({ default:null })
    update_at: string;

    @Column({ default:null })
    delete_at: string;
}
