import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentController {
    constructor(private readonly incidentService: IncidentService) { }

    @Post()
    async report(
        @Body() body: {
            projectId: string;
            qrCode: string;
            description: string;
            images: string[];
        },
        @Request() req: RequestWithUser,
    ) {
        const { tenantId, userId } = req.user;
        return this.incidentService.create(body, tenantId, userId);
    }

    @Get()
    async findAll(
        @Query('projectId') projectId: string,
        @Request() req: RequestWithUser,
    ) {
        const { tenantId } = req.user;
        return this.incidentService.findAll(tenantId, projectId);
    }

    @Put(':id/assign')
    async assign(
        @Param('id') id: string,
        @Body('department') department: string,
        @Request() req: RequestWithUser,
    ) {
        const { tenantId, userId } = req.user;
        return this.incidentService.assignIncident(id, department, tenantId, userId);
    }
}