// tests/qrcode.spec.js
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    // Đăng nhập trước mỗi test
    await page.goto('http://localhost:5500/login.html');
    await page.fill('#email', 'admin@opsera.com');
    await page.fill('#password', 'Admin123@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html');
});

test('Admin can see Create QR button', async ({ page }) => {
    // Vào trang QR
    await page.goto('http://localhost:5500/ternants/qrcodes.html');

    // Chờ danh sách load
    await page.waitForSelector('.grid');

    // Kiểm tra nút "Thêm QR" có hiện không
    const createBtn = page.locator('text=Thêm QR');
    await expect(createBtn).toBeVisible();
});

test('Admin can create a new QR Code', async ({ page }) => {
    await page.goto('http://localhost:5500/ternants/qrcodes.html');

    // Bấm nút thêm
    await page.click('text=Thêm QR');

    // Điền form Modal
    await page.fill('input[placeholder="Ví dụ: Cổng chính..."]', 'Cổng Test Auto');
    await page.fill('input[placeholder="Ví dụ: Tòa nhà A..."]', 'Tầng 1');

    // Bấm Lưu
    await page.click('text=Lưu Thông Tin');

    // Kiểm tra thông báo thành công (SweetAlert)
    await expect(page.locator('.swal2-success')).toBeVisible();

    // Kiểm tra xem QR mới có hiện trong lưới không
    await expect(page.locator('text=Cổng Test Auto')).toBeVisible();
});