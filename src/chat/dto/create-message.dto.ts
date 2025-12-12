import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateMessageDto {
    @IsNotEmpty()
    @IsUUID()
    conversationId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['TEXT', 'IMAGE', 'FILE'])
    type?: string;

    @IsOptional()
    @IsString()
    metadata?: string;
    replyToId?: string;
}