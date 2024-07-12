import { PartialType } from '@nestjs/swagger';
import { CreateWhatDto } from './create-what.dto';

export class UpdateWhatDto extends PartialType(CreateWhatDto) {}
