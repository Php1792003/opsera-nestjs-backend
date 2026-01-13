import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
    constructor(private mailerService: NestMailerService) { }

    async sendRegistrationConfirmation(userEmail: string, userName: string) {
        await this.mailerService.sendMail({
            to: userEmail,
            subject: 'Chào mừng bạn đến với AEGISM - Kích hoạt tài khoản thành công!',
            template: 'welcome',
            context: {
                name: userName,
                loginLink: 'https://aegism.online/login.html',
            },
        });
    }
}