import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('vnpay')
    createVnpayPayment(
        @Body() createPaymentDto: CreatePaymentDto,
        @Req() req: Request
    ) {
        // Lấy IP address từ request
        const ipAddr = (
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1'
        ) as string;

        // Tạo URL thanh toán
        const paymentUrl = this.paymentService.createVnpayUrl(
            createPaymentDto,
            ipAddr.split(',')[0].trim()
        );

        return {
            success: true,
            paymentUrl
        };
    }

    @Get('vnpay-return')
    vnpayReturn(@Query() query: any) {
        const result = this.paymentService.verifyReturnUrl(query);

        return {
            success: result.isValid,
            message: result.message,
            data: {
                orderId: query.vnp_TxnRef,
                amount: query.vnp_Amount,
                orderInfo: query.vnp_OrderInfo,
                responseCode: query.vnp_ResponseCode,
                transactionNo: query.vnp_TransactionNo,
                bankCode: query.vnp_BankCode,
                payDate: query.vnp_PayDate,
            }
        };
    }

    @Post('vnpay-ipn')
    vnpayIPN(@Body() body: any) {
        // Xử lý IPN (Instant Payment Notification) từ VNPAY
        const result = this.paymentService.verifyReturnUrl(body);

        if (result.isValid && body.vnp_ResponseCode === '00') {
            // Cập nhật database, gửi email, etc.
            console.log('Payment successful:', body.vnp_TxnRef);

            return {
                RspCode: '00',
                Message: 'Confirm Success'
            };
        } else {
            return {
                RspCode: '97',
                Message: 'Invalid Signature'
            };
        }
    }
}