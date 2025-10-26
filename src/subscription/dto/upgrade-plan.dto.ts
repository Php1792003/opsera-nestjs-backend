import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../constants/subscription-plans.constant';

export class UpgradePlanDto {
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  newPlan: SubscriptionPlan;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // 'bank_transfer', 'momo', 'visa', 'credit_card'

  @IsString()
  @IsOptional()
  transactionId?: string; // ID giao dịch từ payment gateway

  @IsString()
  @IsOptional()
  paymentProof?: string; // URL ảnh chứng từ thanh toán
}
