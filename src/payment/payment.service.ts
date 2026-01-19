import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto, PaymentType } from './dto/create-payment.dto';
import * as moment from 'moment';
import * as crypto from 'crypto';
import * as qs from 'qs'; // Cần cài thêm: npm i qs @types/qs

@Injectable()
export class PaymentService {
    constructor(private configService: ConfigService) { }

    createVnpayUrl(dto: CreatePaymentDto, ipAddr: string) {
        const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
        const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET') || ''; // Fix lỗi undefined
        const vnpUrl = this.configService.get<string>('VNPAY_URL');
        const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || 'http://localhost:3000/payment_return.html';

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = moment(date).format('DDHHmmss');

        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = dto.orderInfo;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = dto.amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        if (dto.paymentType === PaymentType.CARD) {
            vnp_Params['vnp_BankCode'] = 'INTCARD';
        } else {
            vnp_Params['vnp_BankCode'] = 'VNPAYQR';
        }

        vnp_Params = this.sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnp_Params['vnp_SecureHash'] = signed;

        return vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
    }

    private sortObject(obj: any): any {
        const sorted: any = {};
        const str: string[] = [];
        let key;
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
        }
        return sorted;
    }

    verifyReturnUrl(vnpParams: any): { isValid: boolean; message: string; responseCode?: string } {
        const secureHash = vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        const sortedParams = this.sortObject(vnpParams);
        const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET') || '';

        const signData = qs.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const responseCode = vnpParams['vnp_ResponseCode'];
            if (responseCode === '00') {
                return {
                    isValid: true,
                    message: 'Giao dịch thành công',
                    responseCode: '00'
                };
            } else {
                return {
                    isValid: true,
                    message: 'Giao dịch không thành công',
                    responseCode: responseCode
                };
            }
        } else {
            return {
                isValid: false,
                message: 'Chữ ký không hợp lệ'
            };
        }
    }
}