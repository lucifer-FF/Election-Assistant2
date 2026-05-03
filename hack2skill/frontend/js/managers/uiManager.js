/**
 * UI MANAGER
 * Centralized UI operations
 * Show/hide components, alerts, modals, loading states
 */

export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.modalContainer = document.getElementById('modal-container');
  }

  /**
   * Show loading state
   */
  showLoading(show = true) {
    if (show) {
      this.loadingOverlay.classList.remove('hidden');
    } else {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * Show alert/toast notification
   */
  showAlert(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
      <div class="alert-content">
        <span class="alert-icon">${this.getAlertIcon(type)}</span>
        <span class="alert-message">${this.escapeHtml(message)}</span>
        <button class="alert-close" aria-label="Close alert">×</button>
      </div>
    `;

    this.alertContainer.appendChild(alert);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        alert.remove();
      }, duration);
    }

    // Manual close
    alert.querySelector('.alert-close').addEventListener('click', () => {
      alert.remove();
    });

    return alert;
  }

  /**
   * Show success notification
   */
  showSuccess(message, duration = 4000) {
    return this.showAlert(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  showError(message, duration = 6000) {
    console.error('UI Error:', message);
    return this.showAlert(message, 'error', duration);
  }

  /**
   * Show warning notification
   */
  showWarning(message, duration = 5000) {
    return this.showAlert(message, 'warning', duration);
  }

  /**
   * Show info notification
   */
  showInfo(message, duration = 4000) {
    return this.showAlert(message, 'info', duration);
  }

  /**
   * Show confirmation modal
   */
  showConfirm(title, message, onConfirm, onCancel) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <h2>${this.escapeHtml(title)}</h2>
          <p>${this.escapeHtml(message)}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button class="btn btn-primary" data-action="confirm">Confirm</button>
          </div>
        </div>
      `;

      modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
        resolve(true);
      });

      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
        resolve(false);
      });

      this.modalContainer.appendChild(modal);
    });
  }

  /**
   * Show modal dialog
   */
  showModal(title, content, actions = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${this.escapeHtml(title)}</h2>
          <button class="modal-close" aria-label="Close modal">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${actions.length > 0 ? `
          <div class="modal-footer">
            ${actions.map((action, index) => `
              <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${index}">
                ${this.escapeHtml(action.label)}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Close button
    modal.querySelector('.modal-close')?.addEventListener('click', () => {
      modal.remove();
    });

    // Action buttons
    actions.forEach((action, index) => {
      modal.querySelector(`[data-action="${index}"]`)?.addEventListener('click', () => {
        if (action.callback) action.callback();
        modal.remove();
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    this.modalContainer.appendChild(modal);
  }

  /**
   * Get alert icon for type
   */
  getAlertIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show skeleton loader
   */
  showSkeletonLoader(container, count = 1) {
    container.innerHTML = Array(count).fill(`
      <div class="skeleton">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    `).join('');
  }

  /**
   * Show loading state for button
   */
  setButtonLoading(buttonElement, loading = true) {
    if (loading) {
      buttonElement.disabled = true;
      buttonElement.dataset.originalText = buttonElement.textContent;
      buttonElement.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
      buttonElement.disabled = false;
      buttonElement.textContent = buttonElement.dataset.originalText || 'Submit';
    }
  }
}
