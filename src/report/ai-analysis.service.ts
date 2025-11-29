import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiAnalysisService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("❌ MISSING GOOGLE_API_KEY in .env file");
        }

        this.genAI = new GoogleGenerativeAI(apiKey || 'AIzaSy_DUMMY');

        // --- SỬA Ở ĐÂY ---
        // Thay 'gemini-1.5-flash' bằng 'gemini-pro' hoặc 'gemini-1.0-pro'
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async analyzeProjectPerformance(data: any): Promise<string> {
        if (!process.env.GOOGLE_API_KEY) {
            return "<p style='color:red'>Chưa cấu hình API Key cho AI.</p>";
        }

        // Prompt giữ nguyên, nhưng lưu ý Gemini Pro rất nhạy cảm với định dạng đầu vào
        const prompt = `
          Đóng vai một chuyên gia quản lý vận hành tòa nhà. Hãy phân tích ngắn gọn dữ liệu sau:
          - Dự án: ${data.projectName}
          - Số lượt tuần tra: ${data.stats.totalPatrols}
          - Tăng trưởng tuần tra: ${data.stats.patrolGrowth}%
          - Số sự cố phát sinh: ${data.stats.totalIncidents}
          - Tỷ lệ hoàn thành công việc: ${data.stats.taskCompletionRate}%
          - Số nhân sự: ${data.stats.activeStaff}

          Yêu cầu trả lời bằng tiếng Việt, định dạng HTML đơn giản (dùng thẻ <p>, <ul>, <li>, <b>), không dùng Markdown.
          Nội dung cần: Nhận xét chung, Rủi ro tiềm ẩn, và Đề xuất cải thiện.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Google Gemini Error:", error);
            return `<p style='color: red'>Lỗi khi gọi Google AI: ${error.message}</p>`;
        }
    }
}