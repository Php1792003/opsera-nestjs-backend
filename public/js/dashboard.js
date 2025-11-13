async function initDashboard() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  await loadProjects();
}

// Call initDashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);