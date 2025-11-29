import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssignIncidentDto {
    @IsNotEmpty()
    @IsString()
    department: string;
}