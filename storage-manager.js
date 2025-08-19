class StorageManager {
  constructor() {
    this.serviceUrlCache = null;
  }

  async getServiceUrl() {
    if (this.serviceUrlCache) {
      return this.serviceUrlCache;
    }
    
    return new Promise((resolve) => {
      chrome.storage.sync.get(['serviceUrl'], function(result) {
        const serviceUrl = result.serviceUrl || 'http://localhost:3030';
        resolve(serviceUrl);
      });
    });
  }

  async getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['authToken'], function(result) {
        const authToken = result.authToken || '';
        resolve(authToken);
      });
    });
  }

  async getAuthHeaders() {
    const authToken = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  }

  async getStorageMode() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['storageMode'], function(result) {
        const storageMode = result.storageMode || 'extension';
        resolve(storageMode);
      });
    });
  }

  async shouldUseService() {
    const storageMode = await this.getStorageMode();
    return storageMode === 'service';
  }

  async getGolinks(page = 1, pageSize = 50) {
    const useService = await this.shouldUseService();
    
    if (useService) {
      return this.getGolinksFromService(page, pageSize);
    } else {
      return this.getGolinksFromExtensionStorage(page, pageSize);
    }
  }

  async getGolinksFromService(page, pageSize) {
    const serviceUrl = await this.getServiceUrl();
    const headers = await this.getAuthHeaders();
    const url = `${serviceUrl}/golinks?page=${page}&page_size=${pageSize}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) {
      throw new Error('Failed to fetch golinks from service');
    }
    
    const data = await response.json();
    
    // Handle both paginated and non-paginated responses for backward compatibility
    if (Array.isArray(data)) {
      return {
        data: data,
        pagination: {
          page: 1,
          page_size: data.length,
          total_items: data.length,
          total_pages: 1
        }
      };
    }
    
    return data;
  }

  async getGolinksFromExtensionStorage(page, pageSize) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        const golinkArray = Object.values(golinks);
        
        const totalItems = golinkArray.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedGolinks = golinkArray.slice(startIndex, endIndex);
        
        resolve({
          data: paginatedGolinks,
          pagination: {
            page: page,
            page_size: pageSize,
            total_items: totalItems,
            total_pages: totalPages
          }
        });
      });
    });
  }

  async getGolink(golinkName) {
    const useService = await this.shouldUseService();
    
    if (useService) {
      return this.getGolinkFromService(golinkName);
    } else {
      return this.getGolinkFromExtensionStorage(golinkName);
    }
  }

  async getGolinkFromService(golinkName) {
    const serviceUrl = await this.getServiceUrl();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${serviceUrl}/golinks/go/${golinkName}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Golink not found');
    }
    
    return response.json();
  }

  async getGolinkFromExtensionStorage(golinkName) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        const golink = golinks[`go/${golinkName}`];
        
        if (golink) {
          resolve(golink);
        } else {
          reject(new Error('Golink not found'));
        }
      });
    });
  }

  async createGolink(golinkData) {
    const useService = await this.shouldUseService();
    
    if (useService) {
      return this.createGolinkInService(golinkData);
    } else {
      return this.createGolinkInExtensionStorage(golinkData);
    }
  }

  async createGolinkInService(golinkData) {
    const serviceUrl = await this.getServiceUrl();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${serviceUrl}/golinks`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(golinkData)
    });
    
    if (!response.ok) {
      const errorData = response.status === 409 ? await response.json() : null;
      throw { status: response.status, error: errorData?.error };
    }
    
    return response.json();
  }

  async createGolinkInExtensionStorage(golinkData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        
        if (golinks[golinkData.short_link]) {
          reject({ status: 409, error: 'Golink already exists' });
          return;
        }
        
        golinks[golinkData.short_link] = golinkData;
        
        chrome.storage.local.set({ golinks: golinks }, function() {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to save golink'));
          } else {
            resolve(golinkData);
          }
        });
      });
    });
  }

  async updateGolink(golinkName, updateData) {
    const useService = await this.shouldUseService();
    
    if (useService) {
      return this.updateGolinkInService(golinkName, updateData);
    } else {
      return this.updateGolinkInExtensionStorage(golinkName, updateData);
    }
  }

  async updateGolinkInService(golinkName, updateData) {
    const serviceUrl = await this.getServiceUrl();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${serviceUrl}/golinks/${golinkName}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update golink');
    }
    
    return response.json();
  }

  async updateGolinkInExtensionStorage(golinkName, updateData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        
        if (!golinks[golinkName]) {
          reject(new Error('Golink not found'));
          return;
        }
        
        golinks[golinkName] = { ...golinks[golinkName], ...updateData };
        
        chrome.storage.local.set({ golinks: golinks }, function() {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to update golink'));
          } else {
            resolve(golinks[golinkName]);
          }
        });
      });
    });
  }

  async deleteGolink(golinkName) {
    const useService = await this.shouldUseService();
    
    if (useService) {
      return this.deleteGolinkFromService(golinkName);
    } else {
      return this.deleteGolinkFromExtensionStorage(golinkName);
    }
  }

  async deleteGolinkFromService(golinkName) {
    const serviceUrl = await this.getServiceUrl();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${serviceUrl}/golinks/${golinkName}`, {
      method: 'DELETE',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete golink');
    }
    
    return true;
  }

  async deleteGolinkFromExtensionStorage(golinkName) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        
        if (!golinks[golinkName]) {
          reject(new Error('Golink not found'));
          return;
        }
        
        delete golinks[golinkName];
        
        chrome.storage.local.set({ golinks: golinks }, function() {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to delete golink'));
          } else {
            resolve(true);
          }
        });
      });
    });
  }
}

const storageManager = new StorageManager();