import { IsArray, IsNotEmpty, IsString, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateGroupDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsUUID()
    projectId: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID("4", { each: true })
    memberIds: string[];
}