document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const golinksSection = document.getElementById('golinksSection');
  const golinksList = document.getElementById('golinksList');
  const emptyState = document.getElementById('emptyState');
  const errorMessage = document.getElementById('errorMessage');
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editGolinkName = document.getElementById('editGolinkName');
  const editGolinkUrl = document.getElementById('editGolinkUrl');
  const closeModal = document.getElementById('closeModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const backLink = document.getElementById('backLink');
  const golinksStats = document.getElementById('golinksStats');
  const paginationControls = document.getElementById('paginationControls');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const currentPageSpan = document.getElementById('currentPage');
  const totalPagesSpan = document.getElementById('totalPages');
  const showingCountSpan = document.getElementById('showingCount');
  const totalCountSpan = document.getElementById('totalCount');

  let currentEditingGolink = null;
  let currentPage = 1;
  const pageSize = 50;
  let totalPages = 1;
  let totalItems = 0;

  // Storage manager will be included via script tag in manage.html

  // Load golinks on page load
  loadGolinks();

  // Modal event listeners
  closeModal.addEventListener('click', closeEditModal);
  cancelEdit.addEventListener('click', closeEditModal);
  editForm.addEventListener('submit', handleSaveEdit);
  
  // Back link event listener
  backLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.close();
  });

  // Pagination event listeners
  prevBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      loadGolinks();
    }
  });

  nextBtn.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      loadGolinks();
    }
  });

  // Close modal when clicking outside
  editModal.addEventListener('click', function(e) {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  async function loadGolinks() {
    loading.style.display = 'block';
    golinksSection.style.display = 'none';
    errorMessage.style.display = 'none';
    golinksStats.style.display = 'none';
    paginationControls.style.display = 'none';

    try {
      const response = await storageManager.getGolinks(currentPage, pageSize);
      
      loading.style.display = 'none';
      golinksSection.style.display = 'block';
      
      const golinks = response.data;
      const pagination = response.pagination;
      
      totalItems = pagination.total_items;
      totalPages = pagination.total_pages;
      
      if (totalItems === 0) {
        golinksList.innerHTML = '';
        emptyState.style.display = 'block';
        golinksStats.style.display = 'none';
        paginationControls.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        displayGolinks(golinks);
        updatePaginationControls(pagination);
        updateStats(golinks.length, totalItems);
      }
    } catch (error) {
      console.error('Error loading golinks:', error);
      loading.style.display = 'none';
      errorMessage.style.display = 'block';
    }
  }

  function displayGolinks(golinks) {
    golinksList.innerHTML = '';
    
    golinks.forEach(golink => {
      const golinkItem = document.createElement('div');
      golinkItem.className = 'golink-item';
      
      golinkItem.innerHTML = `
        <div class="golink-info">
          <div class="golink-name">
            <a href="${golink.url}" target="_blank" rel="noopener noreferrer" class="golink-link" title="Click to visit ${golink.url}">${golink.short_link}</a>
          </div>
          <div class="golink-url">
            <a href="${golink.url}" target="_blank" rel="noopener noreferrer" class="golink-url-link" title="Click to visit ${golink.url}">${golink.url}</a>
          </div>
        </div>
        <div class="golink-actions">
          <button class="action-btn edit-btn" data-golink='${JSON.stringify(golink)}'>Edit</button>
          <button class="action-btn delete-btn" data-golink-name="${golink.short_link}">Delete</button>
        </div>
      `;
      
      golinksList.appendChild(golinkItem);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEditClick);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteClick);
    });
  }

  function handleEditClick(e) {
    const golinkData = JSON.parse(e.target.getAttribute('data-golink'));
    currentEditingGolink = golinkData;
    
    // Extract the name part after "go/"
    const golinkName = golinkData.short_link.replace('go/', '');
    editGolinkName.value = golinkName;
    editGolinkUrl.value = golinkData.url;
    
    editModal.style.display = 'flex';
  }

  function handleDeleteClick(e) {
    const golinkName = e.target.getAttribute('data-golink-name');
    
    if (confirm(`Are you sure you want to delete "${golinkName}"?`)) {
      deleteGolink(golinkName);
    }
  }

  async function deleteGolink(golinkName) {
    try {
      await storageManager.deleteGolink(golinkName);
      alert(`Golink "${golinkName}" deleted successfully!`);
      // Reset to page 1 after deletion in case current page becomes empty
      currentPage = 1;
      loadGolinks(); // Reload the list
    } catch (error) {
      console.error('Error deleting golink:', error);
      alert('Error deleting golink. Please check your connection or try again.');
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    
    const newUrl = editGolinkUrl.value.trim();
    if (!newUrl) {
      alert('Please enter a valid URL.');
      return;
    }

    const golinkName = currentEditingGolink.short_link;
    
    try {
      await storageManager.updateGolink(golinkName, { url: newUrl });
      alert(`Golink "${golinkName}" updated successfully!`);
      closeEditModal();
      loadGolinks(); // Reload the list
    } catch (error) {
      console.error('Error updating golink:', error);
      alert('Error updating golink. Please check your connection or try again.');
    }
  }

  function updatePaginationControls(pagination) {
    currentPageSpan.textContent = pagination.page;
    totalPagesSpan.textContent = pagination.total_pages;
    
    // Update button states
    prevBtn.disabled = pagination.page <= 1;
    nextBtn.disabled = pagination.page >= pagination.total_pages;
    
    // Show pagination controls only if there are multiple pages
    if (pagination.total_pages > 1) {
      paginationControls.style.display = 'flex';
    } else {
      paginationControls.style.display = 'none';
    }
  }

  function updateStats(showingCount, totalCount) {
    showingCountSpan.textContent = showingCount;
    totalCountSpan.textContent = totalCount;
    golinksStats.style.display = 'block';
  }

  function closeEditModal() {
    editModal.style.display = 'none';
    currentEditingGolink = null;
    editForm.reset();
  }
});