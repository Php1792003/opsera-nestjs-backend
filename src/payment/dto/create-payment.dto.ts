import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export enum PaymentType {
    CARD = 'card',
    QR = 'qr'
}

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    orderInfo: string;

    @IsNotEmpty()
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @IsOptional()
    @IsString()
    ipAddr?: string;
}