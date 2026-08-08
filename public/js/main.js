/**
 * Smart Hostel Complaint Management System
 * Main JavaScript - UI interactions, toasts, modals, etc.
 */

// ─── DOM Ready ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initToasts();
    initModals();
    initPasswordToggle();
    initPasswordStrength();
    initFormValidation();
    initConfirmDelete();
    initAutoHideAlerts();
    initTableSort();
    initCharCounter();
});

// ─── Sidebar Toggle (Mobile) ────────────────────────────────────────────────
function initSidebar() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ─── Toast Notifications ────────────────────────────────────────────────────
function initToasts() {
    // Auto-show flash toasts rendered from server
    const flashEl = document.getElementById('flash-data');
    if (flashEl) {
        const type = flashEl.dataset.type;
        const message = flashEl.dataset.message;
        if (type && message) showToast(message, type);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The notification message
 * @param {string} type - success | error | warning | info
 * @param {number} duration - Duration in ms (default 5000)
 */
function showToast(message, type = 'info', duration = 5000) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─── Modal System ───────────────────────────────────────────────────────────
function initModals() {
    // Open modal buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            openModal(modalId);
        });
    });

    // Close modal buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modalClose || btn.closest('.modal-backdrop')?.id;
            closeModal(modalId);
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) closeModal(backdrop.id);
        });
    });

    // Close on ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => {
                closeModal(m.id);
            });
        }
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = id ? document.getElementById(id) : document.querySelector('.modal-backdrop:not(.hidden)');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ─── Password Toggle ────────────────────────────────────────────────────────
function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
                btn.title = 'Hide password';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
                btn.title = 'Show password';
            }
        });
    });
}

// ─── Password Strength Meter ────────────────────────────────────────────────
function initPasswordStrength() {
    const pwInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (!pwInput || !strengthBar) return;

    pwInput.addEventListener('input', () => {
        const strength = checkPasswordStrength(pwInput.value);
        const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

        strengthBar.style.width = `${strength * 25}%`;
        strengthBar.style.background = colors[strength];
        if (strengthText) {
            strengthText.textContent = labels[strength];
            strengthText.style.color = colors[strength];
        }
    });
}

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
}

// ─── Client-side Form Validation Feedback ───────────────────────────────────
function initFormValidation() {
    // Confirm password match
    const confirmInput = document.getElementById('confirm_password');
    const passwordInput = document.getElementById('password');

    if (confirmInput && passwordInput) {
        const checkMatch = () => {
            if (confirmInput.value && confirmInput.value !== passwordInput.value) {
                confirmInput.classList.add('is-invalid');
                confirmInput.classList.remove('is-valid');
            } else if (confirmInput.value) {
                confirmInput.classList.add('is-valid');
                confirmInput.classList.remove('is-invalid');
            }
        };
        confirmInput.addEventListener('input', checkMatch);
        passwordInput.addEventListener('input', checkMatch);
    }

    // Phone number - numbers only
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
}

// ─── Confirm Delete ─────────────────────────────────────────────────────────
function initConfirmDelete() {
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', e => {
            const msg = form.dataset.confirm || 'Are you sure you want to delete this?';
            if (!confirm(msg)) e.preventDefault();
        });
    });
}

// ─── Auto-hide Alerts ───────────────────────────────────────────────────────
function initAutoHideAlerts() {
    document.querySelectorAll('.alert[data-auto-hide]').forEach(alert => {
        const delay = parseInt(alert.dataset.autoHide) || 5000;
        setTimeout(() => {
            alert.style.animation = 'fadeOut 0.4s ease forwards';
            setTimeout(() => alert.remove(), 400);
        }, delay);
    });

    document.querySelectorAll('.alert .alert-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const alert = btn.closest('.alert');
            if (alert) alert.remove();
        });
    });
}

// ─── Simple Table Sort ──────────────────────────────────────────────────────
function initTableSort() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const table = th.closest('table');
            const col = Array.from(th.parentElement.children).indexOf(th);
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            const asc = th.dataset.sortDir !== 'asc';
            th.dataset.sortDir = asc ? 'asc' : 'desc';

            rows.sort((a, b) => {
                const aVal = a.cells[col]?.textContent.trim() || '';
                const bVal = b.cells[col]?.textContent.trim() || '';
                return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });

            const tbody = table.querySelector('tbody');
            rows.forEach(r => tbody.appendChild(r));

            // Reset other headers
            table.querySelectorAll('th[data-sort]').forEach(h => {
                if (h !== th) h.dataset.sortDir = '';
            });
        });
    });
}

// ─── Character Counter ──────────────────────────────────────────────────────
function initCharCounter() {
    document.querySelectorAll('[data-max-chars]').forEach(el => {
        const max = parseInt(el.dataset.maxChars);
        const counterId = el.dataset.counter;
        const counter = counterId ? document.getElementById(counterId) : null;

        if (!counter) return;
        counter.textContent = `0 / ${max}`;

        el.addEventListener('input', () => {
            const len = el.value.length;
            counter.textContent = `${len} / ${max}`;
            counter.style.color = len > max * 0.9 ? '#ef4444' : '#64748b';
        });
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Debounce utility
 */
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Live search - submits form on input (debounced)
 */
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
        searchInput.closest('form')?.submit();
    }, 500));
}

// ─── Print Report ───────────────────────────────────────────────────────────
function printReport() {
    window.print();
}

// Export for use in inline scripts
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.printReport = printReport;
