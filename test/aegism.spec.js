// tests/login.spec.js
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000'; // Hoặc URL thật của bạn

test('User should login successfully', async ({ page }) => {
    // 1. Vào trang Login
    await page.goto(`${BASE_URL}/login.html`);

    // 2. Điền thông tin
    await page.fill('#email', 'admin@opsera.com');
    await page.fill('#password', 'Admin123@');

    // 3. Bấm nút Login
    await page.click('button[type="submit"]');

    // 4. Chờ chuyển trang và kiểm tra URL
    await page.waitForURL('**/dashboard.html');
    await expect(page).toHaveURL(`${BASE_URL}/ternants/dashboard.html`);

    // 5. Kiểm tra xem có hiện tên User không
    await expect(page.locator('text=System Admin')).toBeVisible();
});

test('User should see error with wrong password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#email', 'admin@opsera.com');
    await page.fill('#password', 'WrongPass123');
    await page.click('button[type="submit"]');

    // Kiểm tra thông báo lỗi
    const errorMessage = page.locator('.bg-red-100'); // Class của hộp báo lỗi
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid credentials');
});