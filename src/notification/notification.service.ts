import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { User, Task } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  async createInAppNotification(
    tenantId: string,
    title: string,
    message: string,
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS',
    userId?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        title,
        message,
        type,
        userId: userId || null,
      },
    });
  }

  async sendTaskAssignedNotification(
    assignee: User,
    task: Task,
    assigner: User,
  ) {
    const title = `New Task Assigned: "${task.title}"`;
    const message = `${assigner.fullName} has assigned a new task to you.`;
    const taskUrl = ` http://localhost:3000/projects/${task.projectId}/tasks/${task.id}`;

    await this.createInAppNotification(
      assignee.tenantId,
      title,
      message,
      'INFO',
      assignee.id,
    );

    const emailHtml = `
      <h1>New Task Assigned</h1>
      <p>Hello ${assignee.fullName},</p>
      <p>${message}</p>
      <p><strong>Task:</strong> ${task.title}</p>
      <p><strong>Project:</strong> [Project Name]</p>
      <p><a href="${taskUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Task Details</a></p>
    `;

    this.mailerService
      .sendMail({
        to: assignee.email,
        subject: `[Opsera] ${title}`,
        html: emailHtml,
      })
      .catch((error) => {
        console.error(
          `Failed to send task assignment email to ${assignee.email}`,
          error,
        );
      });
  }
}
