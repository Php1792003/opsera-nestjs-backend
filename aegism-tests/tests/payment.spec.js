// tests/payment.spec.js
const { test, expect } = require('@playwright/test');

test('Toggle Pricing Monthly/Yearly', async ({ page }) => {
    await page.goto('http://localhost:5500/pricing.html');

    // Mặc định là Tháng -> Giá Starter: 590k
    await expect(page.locator('text=590k')).toBeVisible();

    // Bấm Toggle sang Năm
    await page.click('#toggle'); // ID của checkbox toggle

    // Giá phải đổi thành 475k
    await expect(page.locator('text=475k')).toBeVisible();
});

test('Payment page calculates total correctly', async ({ page }) => {
    // Vào thẳng trang Payment với tham số
    await page.goto('http://localhost:3000/payment.html?plan=starter&cycle=yearly');

    // Kiểm tra tên gói
    await expect(page.locator('text=Gói Starter')).toBeVisible();

    // Kiểm tra tổng tiền (475k * 12 * 1.1 = 6.270.000)
    // Lưu ý: Cần match đúng format tiền tệ VN
    await expect(page.locator('text=6.270.000')).toBeVisible();
});