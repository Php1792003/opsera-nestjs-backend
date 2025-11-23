import { PartialType } from '@nestjs/mapped-types';
import { CreateQrCodeDto } from './create-qrcode.dto';

export class UpdateQrCodeDto extends PartialType(CreateQrCodeDto) { }