const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Phphcm179@', // Thay mật khẩu của bạn vào đây
    server: '52.220.122.42', // Thay IP của bạn vào đây
    database: 'master', // Kết nối thử vào database mặc định
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function connect() {
    try {
        await sql.connect(config);
        console.log("✅ Kết nối THÀNH CÔNG!");
    } catch (err) {
        console.error("❌ Kết nối THẤT BẠI:", err);
    }
}

connect();