document.addEventListener('DOMContentLoaded', () => {
    const projectForm = document.getElementById('project-form');
    const notificationCenter = document.querySelector('.notification-center');
    const collaboratorsInput = document.getElementById('project-collaborators');
    const collaboratorsList = document.querySelector('.collaborators-list');
    const technologiesInput = document.getElementById('project-technologies');
    const technologiesList = document.querySelector('.technologies-list');
    const filesInput = document.getElementById('project-files');
    const filePreview = document.querySelector('.file-preview');
  
    // Função para exibir notificações
    const showNotification = (message, type) => {
      const notification = document.createElement('div');
      notification.className = `notification ${type} show`;
      notification.textContent = message;
      notificationCenter.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    };
  
    // Validação do formulário
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('project-title').value;
      const description = document.getElementById('project-description').value;
  
      if (!title || !description) {
        showNotification('Preencha todos os campos obrigatórios.', 'error');
        return;
      }
  
      showNotification('Projeto publicado com sucesso!', 'success');
      projectForm.reset();
      collaboratorsList.innerHTML = '';
      technologiesList.innerHTML = '';
      filePreview.innerHTML = '';
    });
  
    // Adicionar colaboradores
    collaboratorsInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && collaboratorsInput.value.trim()) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${collaboratorsInput.value.trim()} <i class="fas fa-times remove"></i>`;
        collaboratorsList.appendChild(chip);
        collaboratorsInput.value = '';
  
        chip.querySelector('.remove').addEventListener('click', () => chip.remove());
      }
    });
  
    // Adicionar tecnologias
    technologiesInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && technologiesInput.value.trim()) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${technologiesInput.value.trim()} <i class="fas fa-times remove"></i>`;
        technologiesList.appendChild(chip);
        technologiesInput.value = '';
  
        chip.querySelector('.remove').addEventListener('click', () => chip.remove());
      }
    });
  
    // Preview de arquivos
    filesInput.addEventListener('change', () => {
      filePreview.innerHTML = '';
      Array.from(filesInput.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          filePreview.appendChild(img);
        }
      });
    });
  
    // Botão Cancelar
    document.querySelector('.btn-cancel').addEventListener('click', () => {
      window.location.href = 'index.html'; // Redireciona para a página principal
    });
  
    // Botão Salvar Rascunho
    document.querySelector('.btn-draft').addEventListener('click', () => {
      showNotification('Projeto salvo como rascunho!', 'success');
    });
  
    // Toggle de Tema (reutilizando código existente)
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
    });
  });