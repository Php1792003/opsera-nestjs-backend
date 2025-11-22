async function includeHTML() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) {
    try {
      const response = await fetch('template/_navbar.html');
      if (!response.ok) {
        throw new Error('Could not load navbar template.');
      }
      const html = await response.text();
      placeholder.innerHTML = html;
      console.log('Navbar loaded successfully.');
    } catch (error) {
      console.error('Error including HTML:', error);
      placeholder.innerHTML =
        '<p style="color: red; text-align: center;">Error loading navbar.</p>';
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessageDiv = document.getElementById('error-message');
  const submitButton = document.querySelector(
    '#login-form button[type="submit"]',
  );

  submitButton.disabled = true;
  submitButton.textContent = 'Đang xử lý...';
  errorMessageDiv.style.display = 'none';

  try {
    // ✅ FIX: Thêm full URL và kiểm tra response
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // ✅ FIX: Kiểm tra content-type trước khi parse JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server không trả về JSON. Kiểm tra API endpoint!');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Email hoặc mật khẩu không chính xác.');
    }

    // ✅ FIX: Kiểm tra có accessToken không
    if (!data.accessToken) {
      throw new Error('Server không trả về access token!');
    }

    localStorage.setItem('accessToken', data.accessToken);
    console.log('Login successful, token saved:', data.accessToken);

    // ✅ FIX: Delay nhỏ trước khi redirect
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 100);
  } catch (error) {
    console.error('Login error:', error);
    errorMessageDiv.textContent = error.message;
    errorMessageDiv.style.display = 'block';

    submitButton.disabled = false;
    submitButton.textContent = 'Đăng Nhập';
  }
}

async function initDashboard() {
  const userInfoDiv = document.getElementById('user-info');
  const logoutButton = document.getElementById('logout-button');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('accessToken');
      window.location.href = 'login.html';
    });
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // ✅ FIX: Thêm full URL
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    // ✅ FIX: Kiểm tra content-type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server không trả về JSON.');
    }

    if (!response.ok) {
      throw new Error('Invalid session.');
    }

    const user = await response.json();
    if (userInfoDiv) {
      userInfoDiv.textContent = `Bạn đã đăng nhập với email: ${user.email}`;
    }
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
  }
}

async function initPage() {
  console.log('Page content loaded. Initializing functions...');

  await includeHTML();

  const navbar = document.getElementById('navbar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const menu = document.getElementById('navMenu');

  if (navbar) {
    if (window.pageYOffset > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      menu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const dashboardContainer = document.getElementById('logout-button');
  if (dashboardContainer) {
    initDashboard();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded. Initializing Swup...');

  if (typeof Swup !== 'undefined') {
    const swup = new Swup();
    console.log('Swup initialized.');

    initPage();

    swup.hooks.on('page:view', () => {
      initPage();
      window.scrollTo(0, 0);
    });

    document.addEventListener('click', function (event) {
      const link = event.target.closest('a[data-transition]');
      if (link) {
        const transitionName = link.dataset.transition;
        document.documentElement.setAttribute(
          'data-transition',
          transitionName,
        );
        console.log('Transition set to: ' + transitionName);
      }
    });

    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.pageYOffset > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    });
  } else {
    console.error('LỖI: Không thể tải thư viện Swup!');
    initPage();
  }
});
