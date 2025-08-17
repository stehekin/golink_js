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

  let currentEditingGolink = null;

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

  // Close modal when clicking outside
  editModal.addEventListener('click', function(e) {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  function loadGolinks() {
    loading.style.display = 'block';
    golinksSection.style.display = 'none';
    errorMessage.style.display = 'none';

    fetch('http://localhost:3030/golinks')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch golinks');
        }
        return response.json();
      })
      .then(golinks => {
        loading.style.display = 'none';
        golinksSection.style.display = 'block';
        
        if (golinks.length === 0) {
          golinksList.innerHTML = '';
          emptyState.style.display = 'block';
        } else {
          emptyState.style.display = 'none';
          displayGolinks(golinks);
        }
      })
      .catch(error => {
        console.error('Error loading golinks:', error);
        loading.style.display = 'none';
        errorMessage.style.display = 'block';
      });
  }

  function displayGolinks(golinks) {
    golinksList.innerHTML = '';
    
    golinks.forEach(golink => {
      const golinkItem = document.createElement('div');
      golinkItem.className = 'golink-item';
      
      golinkItem.innerHTML = `
        <div class="golink-info">
          <div class="golink-name">${golink.short_link}</div>
          <div class="golink-url">${golink.url}</div>
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

  function deleteGolink(golinkName) {
    fetch(`http://localhost:3030/golinks/${golinkName}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (response.ok) {
        alert(`Golink "${golinkName}" deleted successfully!`);
        loadGolinks(); // Reload the list
      } else {
        alert('Failed to delete golink. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error deleting golink:', error);
      alert('Error deleting golink. Please make sure the golink service is running.');
    });
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    
    const newUrl = editGolinkUrl.value.trim();
    if (!newUrl) {
      alert('Please enter a valid URL.');
      return;
    }

    const golinkName = currentEditingGolink.short_link;
    
    fetch(`http://localhost:3030/golinks/${golinkName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: newUrl })
    })
    .then(response => {
      if (response.ok) {
        alert(`Golink "${golinkName}" updated successfully!`);
        closeEditModal();
        loadGolinks(); // Reload the list
      } else {
        alert('Failed to update golink. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error updating golink:', error);
      alert('Error updating golink. Please make sure the golink service is running.');
    });
  }

  function closeEditModal() {
    editModal.style.display = 'none';
    currentEditingGolink = null;
    editForm.reset();
  }
});