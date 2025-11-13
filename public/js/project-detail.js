
async function initProjectDetailPage() {
  console.log('Initializing Project Detail Page...');
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Lấy projectId từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  if (!projectId) {
    alert('Không tìm thấy ID dự án.');
    window.location.href = 'projects.html'; 
    return;
  }

  try {
    const projectRes = await fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!projectRes.ok) {
      throw new Error(
        'Không thể tải dữ liệu dự án hoặc bạn không có quyền truy cập.',
      );
    }

    const projectData = await projectRes.json();

    document.getElementById('project-header-name').textContent =
      `Dự án: ${projectData.name}`;

    const projectDescriptionEl = document.getElementById('project-description');
    if (projectDescriptionEl) {
      projectDescriptionEl.textContent =
        projectData.description || 'Chưa có mô tả.';
    }

    const tasksTableEl = document.getElementById('project-tasks-table');
    const projectTasks = projectData.tasks || [];
    document.getElementById('project-tasks-title').textContent =
      `Công Việc Thuộc Dự Án Này (${projectTasks.length})`;
    tasksTableEl.innerHTML = '';
    if (projectTasks.length > 0) {
      projectTasks.forEach((task) => {
        const taskRow = document.createElement('tr');
        tasksTableEl.appendChild(taskRow);
      });
    } else {
      tasksTableEl.innerHTML =
        '<tr><td colspan="4" class="text-center py-4 text-gray-500">Chưa có công việc nào trong dự án này.</td></tr>';
    }
  } catch (error) {
    console.error('Error loading project details:', error.message);
    document.body.innerHTML = `<div class="text-center text-red-500 p-10"><h1>Lỗi</h1><p>${error.message}</p><a href="/dashboard.html" class="text-blue-400">Quay về Dashboard</a></div>`;
  }
}
