import { PartialType } from '@nestjs/swagger';
import { CreateAuxiliaryDto } from './create-auxiliary.dto';

export class UpdateAuxiliaryDto extends PartialType(CreateAuxiliaryDto) {
    delete_at?: string;
}
