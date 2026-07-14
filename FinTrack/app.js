/**
 * FinTrack - Personal Finance Dashboard (SaaS App)
 * Core logic and UI rendering
 */

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------
  // 0. AUTHENTICATION & UTILITIES (BANCARIZATION)
  // -------------------------------------------------------------
  function generateRandomIban() {
    const randDigits = (count) => {
      let res = '';
      for (let i = 0; i < count; i++) {
        res += Math.floor(Math.random() * 10);
      }
      return res;
    };
    return `ES${randDigits(2)}-${randDigits(4)}-${randDigits(4)}-${randDigits(4)}-${randDigits(4)}-${randDigits(4)}`;
  }

  // Initialize usuarios array in localStorage if it doesn't exist
  if (!localStorage.getItem('usuarios')) {
    localStorage.setItem('usuarios', JSON.stringify([]));
  }

  function checkSession() {
    const session = localStorage.getItem('sesionUsuario');
    const loginScreen = document.getElementById('login-screen');
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (!session) {
      loginScreen.classList.remove('hidden');
      dashboardContainer.classList.add('hidden');
      setupAuthListeners();
      return false;
    } else {
      loginScreen.classList.add('hidden');
      dashboardContainer.classList.remove('hidden');
      return true;
    }
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  const recoveryState = {
    codigoGenerado: null,
    usuarioEnRecuperacion: null
  };

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `;
    if (type === 'success') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;
    } else if (type === 'error') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    }

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }

  function setupAuthListeners() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const recoveryCard = document.getElementById('recovery-card');
    const linkForgotPassword = document.getElementById('link-forgot-password');
    const linkBackToLogin = document.getElementById('link-back-to-login');

    const loginCard = document.querySelector('#login-screen .login-card:not(#recovery-card)');

    if (linkForgotPassword && loginCard && recoveryCard) {
      linkForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.classList.add('hidden');
        recoveryCard.classList.remove('hidden');

        // Reset recovery view steps
        document.getElementById('recovery-step-email').classList.remove('hidden');
        document.getElementById('recovery-step-code').classList.add('hidden');
        document.getElementById('recovery-step-password').classList.add('hidden');

        // Reset inputs and errors
        clearAuthErrors();
        const forms = recoveryCard.querySelectorAll('form');
        forms.forEach(f => f.reset());
      });
    }

    if (linkBackToLogin && loginCard && recoveryCard) {
      linkBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        recoveryCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        if (tabLogin) tabLogin.click();
      });
    }

    if (tabLogin && tabRegister && loginForm && registerForm) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        clearAuthErrors();
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        clearAuthErrors();
      });
    }

    function clearAuthErrors() {
      const inputs = document.querySelectorAll('#login-screen input');
      inputs.forEach(input => {
        const group = input.closest('.form-group');
        if (group) group.classList.remove('has-error');
      });
      const errors = document.querySelectorAll('#login-screen .error-message');
      errors.forEach(err => {
        if (err.classList.contains('general-error')) {
          err.style.display = 'none';
        }
      });
    }

    // LOGIN FORM SUBMISSION
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const usernameError = document.getElementById('login-username-error');
        const passwordError = document.getElementById('login-password-error');
        const generalError = document.getElementById('login-general-error');

        let isValid = true;
        clearInputError(usernameInput, usernameError);
        clearInputError(passwordInput, passwordError);
        if (generalError) generalError.style.display = 'none';

        if (usernameInput.value.trim() === '') {
          showInputError(usernameInput, usernameError, 'El nombre de usuario es requerido');
          isValid = false;
        }

        if (passwordInput.value.trim() === '') {
          showInputError(passwordInput, passwordError, 'La contraseña es requerida');
          isValid = false;
        }

        if (!isValid) return;

        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const user = users.find(u => u.username.toLowerCase() === username && u.password === password);

        if (!user) {
          if (generalError) {
            generalError.textContent = 'Usuario o contraseña incorrectos';
            generalError.style.display = 'block';
          }
          return;
        }

        const userData = {
          nombre: user.username,
          email: user.email,
          iban: user.iban || generateRandomIban()
        };

        localStorage.setItem('sesionUsuario', JSON.stringify(userData));

        const savedSettings = localStorage.getItem('fintrack_settings') ? JSON.parse(localStorage.getItem('fintrack_settings')) : {};
        savedSettings.username = userData.nombre;
        savedSettings.email = userData.email;
        savedSettings.iban = userData.iban;
        localStorage.setItem('fintrack_settings', JSON.stringify(savedSettings));

        window.location.reload();
      });
    }

    // REGISTER FORM SUBMISSION
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('register-username');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');

        const usernameError = document.getElementById('register-username-error');
        const emailError = document.getElementById('register-email-error');
        const passwordError = document.getElementById('register-password-error');
        const confirmPasswordError = document.getElementById('register-confirm-password-error');
        const generalError = document.getElementById('register-general-error');

        let isValid = true;
        clearInputError(usernameInput, usernameError);
        clearInputError(emailInput, emailError);
        clearInputError(passwordInput, passwordError);
        clearInputError(confirmPasswordInput, confirmPasswordError);
        if (generalError) generalError.style.display = 'none';

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (username === '') {
          showInputError(usernameInput, usernameError, 'El nombre de usuario es requerido');
          isValid = false;
        }

        if (email === '') {
          showInputError(emailInput, emailError, 'El correo electrónico es requerido');
          isValid = false;
        } else if (!validateEmail(email)) {
          showInputError(emailInput, emailError, 'Ingresa un correo electrónico válido');
          isValid = false;
        }

        if (password === '') {
          showInputError(passwordInput, passwordError, 'La contraseña es requerida');
          isValid = false;
        }

        if (confirmPassword === '') {
          showInputError(confirmPasswordInput, confirmPasswordError, 'Confirma tu contraseña');
          isValid = false;
        } else if (password !== confirmPassword) {
          showInputError(confirmPasswordInput, confirmPasswordError, 'Las contraseñas no coinciden');
          isValid = false;
        }

        if (!isValid) return;

        const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());

        if (usernameExists) {
          if (generalError) {
            generalError.textContent = 'El nombre de usuario ya está registrado';
            generalError.style.display = 'block';
          }
          showInputError(usernameInput, usernameError, 'El usuario ya existe');
          return;
        }

        const newIban = generateRandomIban();
        const newUser = {
          username: username,
          email: email,
          password: password,
          iban: newIban
        };

        users.push(newUser);
        localStorage.setItem('usuarios', JSON.stringify(users));

        const userData = {
          nombre: username,
          email: email,
          iban: newIban
        };

        localStorage.setItem('sesionUsuario', JSON.stringify(userData));

        const savedSettings = localStorage.getItem('fintrack_settings') ? JSON.parse(localStorage.getItem('fintrack_settings')) : {};
        savedSettings.username = userData.nombre;
        savedSettings.email = userData.email;
        savedSettings.iban = userData.iban;
        localStorage.setItem('fintrack_settings', JSON.stringify(savedSettings));

        window.location.reload();
      });
    }

    // RECOVERY EMAIL FORM SUBMISSION
    const recoveryEmailForm = document.getElementById('recovery-email-form');
    if (recoveryEmailForm) {
      recoveryEmailForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('recovery-email');
        const emailError = document.getElementById('recovery-email-error');
        const generalError = document.getElementById('recovery-email-general-error');

        let isValid = true;
        clearInputError(emailInput, emailError);
        if (generalError) generalError.style.display = 'none';

        const email = emailInput.value.trim();

        if (email === '') {
          showInputError(emailInput, emailError, 'El correo electrónico es requerido');
          isValid = false;
        } else if (!validateEmail(email)) {
          showInputError(emailInput, emailError, 'Ingresa un correo electrónico válido');
          isValid = false;
        }

        if (!isValid) return;

        const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          if (generalError) {
            generalError.textContent = 'Este correo no está registrado';
            generalError.style.display = 'block';
          }
          return;
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        recoveryState.codigoGenerado = code;
        recoveryState.usuarioEnRecuperacion = user;

        showToast(`[Email] Código de recuperación enviado a ${email}: <strong>${code}</strong>`, 'info');

        document.getElementById('recovery-step-email').classList.add('hidden');
        document.getElementById('recovery-step-code').classList.remove('hidden');
      });
    }

    // RECOVERY CODE FORM SUBMISSION
    const recoveryCodeForm = document.getElementById('recovery-code-form');
    if (recoveryCodeForm) {
      recoveryCodeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const codeInput = document.getElementById('recovery-code');
        const codeError = document.getElementById('recovery-code-error');
        const generalError = document.getElementById('recovery-code-general-error');

        let isValid = true;
        clearInputError(codeInput, codeError);
        if (generalError) generalError.style.display = 'none';

        const code = codeInput.value.trim();

        if (code === '') {
          showInputError(codeInput, codeError, 'El código es requerido');
          isValid = false;
        } else if (code !== recoveryState.codigoGenerado) {
          showInputError(codeInput, codeError, 'El código introducido no es correcto');
          isValid = false;
        }

        if (!isValid) return;

        document.getElementById('recovery-step-code').classList.add('hidden');
        document.getElementById('recovery-step-password').classList.remove('hidden');
      });
    }

    // RECOVERY PASSWORD FORM SUBMISSION
    const recoveryPasswordForm = document.getElementById('recovery-password-form');
    if (recoveryPasswordForm) {
      recoveryPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const passwordInput = document.getElementById('recovery-new-password');
        const confirmPasswordInput = document.getElementById('recovery-confirm-password');

        const passwordError = document.getElementById('recovery-new-password-error');
        const confirmPasswordError = document.getElementById('recovery-confirm-password-error');
        const generalError = document.getElementById('recovery-password-general-error');

        let isValid = true;
        clearInputError(passwordInput, passwordError);
        clearInputError(confirmPasswordInput, confirmPasswordError);
        if (generalError) generalError.style.display = 'none';

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password === '') {
          showInputError(passwordInput, passwordError, 'La contraseña es requerida');
          isValid = false;
        } else if (password.length < 6) {
          showInputError(passwordInput, passwordError, 'La contraseña debe tener al menos 6 caracteres');
          isValid = false;
        }

        if (confirmPassword === '') {
          showInputError(confirmPasswordInput, confirmPasswordError, 'Confirma tu contraseña');
          isValid = false;
        } else if (password !== confirmPassword) {
          showInputError(confirmPasswordInput, confirmPasswordError, 'Las contraseñas no coinciden');
          isValid = false;
        }

        if (!isValid) return;

        const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const userIndex = users.findIndex(u => u.username.toLowerCase() === recoveryState.usuarioEnRecuperacion.username.toLowerCase());

        if (userIndex !== -1) {
          users[userIndex].password = password;
          localStorage.setItem('usuarios', JSON.stringify(users));

          recoveryState.codigoGenerado = null;
          recoveryState.usuarioEnRecuperacion = null;

          document.getElementById('recovery-card').classList.add('hidden');
          const loginCard = document.querySelector('#login-screen .login-card:not(#recovery-card)');
          if (loginCard) loginCard.classList.remove('hidden');

          recoveryEmailForm.reset();
          recoveryCodeForm.reset();
          recoveryPasswordForm.reset();

          showToast('Contraseña restablecida con éxito. Inicia sesión con tus nuevas credenciales.', 'success');
        } else {
          if (generalError) {
            generalError.textContent = 'Error al actualizar la contraseña';
            generalError.style.display = 'block';
          }
        }
      });
    }
  }

  function showInputError(inputEl, errorEl, message) {
    if (inputEl) {
      const parent = inputEl.closest('.form-group');
      if (parent) parent.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearInputError(inputEl, errorEl) {
    if (inputEl) {
      const parent = inputEl.closest('.form-group');
      if (parent) parent.classList.remove('has-error');
    }
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }
  
  // -------------------------------------------------------------
  // 1. APPLICATION STATE
  // -------------------------------------------------------------
  let state = {
    transactions: [],
    filter: 'all',
    searchQuery: '',
    currentView: 'dashboard',
    settings: {
      username: 'Alejandro Sanz',
      currency: 'EUR',
      savingsGoal: 500
    },
    budgets: {
      alimentacion: 300,
      transporte: 100,
      entretenimiento: 150,
      servicios: 200,
      vivienda: 700,
      otros: 100
    }
  };

  // Default Fallback values for reset
  const defaultSettings = {
    username: "Alejandro Sanz",
    currency: "EUR",
    savingsGoal: 500
  };

  const defaultBudgets = {
    alimentacion: 300,
    transporte: 100,
    entretenimiento: 150,
    servicios: 200,
    vivienda: 700,
    otros: 100
  };

  const defaultTransactions = [
    {
      id: 1718000000001,
      description: "Nómina Mensual",
      amount: 2450.00,
      category: "nomina",
      type: "ingreso",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 1718000000002,
      description: "Compra Mercadona",
      amount: 68.45,
      category: "alimentacion",
      type: "gasto",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 1718000000003,
      description: "Suscripción Netflix & Spotify",
      amount: 22.98,
      category: "entretenimiento",
      type: "gasto",
      date: new Date().toISOString()
    }
  ];

  // -------------------------------------------------------------
  // 2. SVG ICONS MAPPING FOR CATEGORIES
  // -------------------------------------------------------------
  const categoryIcons = {
    nomina: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    `,
    alimentacion: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2v20M18 22V10M18 6V2M14 6h8M3 6h6M14 10h8M3 10h6"/>
      </svg>
    `,
    transporte: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="22" height="13" rx="2" ry="2" />
        <line x1="5" y1="21" x2="5" y2="16" />
        <line x1="19" y1="21" x2="19" y2="16" />
        <circle cx="7" cy="8" r="1.5" />
        <circle cx="17" cy="8" r="1.5" />
      </svg>
    `,
    entretenimiento: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 12h4M10 10v4M15 11v.01M18 13v.01" />
      </svg>
    `,
    servicios: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    `,
    vivienda: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    `,
    otros: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
      </svg>
    `
  };

  const categoryNames = {
    nomina: "Nómina / Salario",
    alimentacion: "Alimentación",
    transporte: "Transporte / Vehículo",
    entretenimiento: "Entretenimiento / Ocio",
    servicios: "Servicios / Facturas",
    vivienda: "Vivienda / Alquiler",
    otros: "Otros"
  };

  const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£'
  };

  // -------------------------------------------------------------
  // 3. DOM ELEMENTS
  // -------------------------------------------------------------
  const totalBalanceEl = document.getElementById('total-balance');
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpensesEl = document.getElementById('total-expenses');
  const balanceCardEl = document.getElementById('balance-card');
  
  const formEl = document.getElementById('transaction-form');
  const descInput = document.getElementById('desc-input');
  const amountInput = document.getElementById('amount-input');
  const categoryInput = document.getElementById('category-input');
  
  const labelIncome = document.getElementById('label-income');
  const labelExpense = document.getElementById('label-expense');
  const typeRadios = document.getElementsByName('transaction-type');
  
  const transactionsContainer = document.getElementById('transactions-container');
  const emptyStateEl = document.getElementById('empty-state');
  const recordCountEl = document.getElementById('record-count');
  
  const filterTabs = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('search-input');
  const greetingEl = document.getElementById('greeting');
  const currentDateEl = document.getElementById('current-date');
  
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  // Create Sidebar backdrop dynamically for mobile
  const sidebarBackdrop = document.querySelector('.sidebar-backdrop') || (() => {
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    return backdrop;
  })();

  // Modal elements
  const addTxModal = document.getElementById('add-transaction-modal');
  const budgetModal = document.getElementById('set-budget-modal');

  // -------------------------------------------------------------
  // 4. CORE CONTROLLERS & DATA WORKFLOW
  // -------------------------------------------------------------

  function init() {
    loadInitialData();
    setupDateTime();
    setupEventListeners();
    updateUI();
    updateSidebarProfile();
    updateCurrencyLabels();
  }

  function loadInitialData() {
    // Load Transactions
    const savedData = localStorage.getItem('fintrack_transactions');
    if (savedData) {
      try {
        state.transactions = JSON.parse(savedData);
      } catch (e) {
        state.transactions = [...defaultTransactions];
      }
    } else {
      state.transactions = [...defaultTransactions];
      saveToStorage('fintrack_transactions', state.transactions);
    }

    // Load Settings
    const savedSettings = localStorage.getItem('fintrack_settings');
    if (savedSettings) {
      try {
        state.settings = JSON.parse(savedSettings);
      } catch (e) {
        state.settings = { ...defaultSettings };
      }
    } else {
      state.settings = { ...defaultSettings };
      saveToStorage('fintrack_settings', state.settings);
    }

    // Sync from session if exists
    const session = localStorage.getItem('sesionUsuario');
    if (session) {
      const userData = JSON.parse(session);
      state.settings.username = userData.nombre;
      state.settings.email = userData.email;
      state.settings.iban = userData.iban;
    }

    // Load Budgets
    const savedBudgets = localStorage.getItem('fintrack_budgets');
    if (savedBudgets) {
      try {
        state.budgets = JSON.parse(savedBudgets);
      } catch (e) {
        state.budgets = { ...defaultBudgets };
      }
    } else {
      state.budgets = { ...defaultBudgets };
      saveToStorage('fintrack_budgets', state.budgets);
    }

    // Load Hucha
    const savedHucha = localStorage.getItem('fintrack_hucha');
    if (savedHucha) {
      try {
        state.hucha = JSON.parse(savedHucha);
      } catch (e) {
        state.hucha = { nombre: 'Viaje de Ensueño', meta: 1000, ahorrado: 0 };
      }
    } else {
      state.hucha = { nombre: 'Viaje de Ensueño', meta: 1000, ahorrado: 0 };
      saveToStorage('fintrack_hucha', state.hucha);
    }
  }

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function setupDateTime() {
    const now = new Date();
    const hour = now.getHours();
    let greetingText = '¡Hola!';
    const username = state.settings.username || 'Alejandro';

    if (hour >= 6 && hour < 13) {
      greetingText = `¡Buenos días, ${username}!`;
    } else if (hour >= 13 && hour < 21) {
      greetingText = `¡Buenas tardes, ${username}!`;
    } else {
      greetingText = `¡Buenas noches, ${username}!`;
    }
    greetingEl.textContent = greetingText;

    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let formattedDate = now.toLocaleDateString('es-ES', options);
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    currentDateEl.textContent = formattedDate;
  }

  /**
   * Helper to format currency dynamically based on state settings.
   */
  function formatMoney(value) {
    const currency = state.settings.currency || 'EUR';
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: currency 
    }).format(value);
  }

  /**
   * Updates balance cards and renders list items depending on the view.
   */
  function updateUI() {
    updateBalance();
    renderTransactions(); // Render Dashboard quick activity feed
    
    // Refresh secondary views if active
    if (state.currentView === 'transactions') {
      renderTransactionsView();
    } else if (state.currentView === 'budgets') {
      renderBudgetsView();
    }
  }

  function updateBalance() {
    const incomeTotal = state.transactions
      .filter(t => t.type === 'ingreso')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenseTotal = state.transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const huchaAhorrado = state.hucha ? state.hucha.ahorrado : 0;
    const netBalance = incomeTotal - expenseTotal - huchaAhorrado;

    totalIncomeEl.textContent = formatMoney(incomeTotal);
    totalExpensesEl.textContent = formatMoney(expenseTotal);
    totalBalanceEl.textContent = formatMoney(netBalance);

    if (netBalance < 0) {
      balanceCardEl.classList.add('balance-negative');
    } else {
      balanceCardEl.classList.remove('balance-negative');
    }
  }

  function updateSidebarProfile() {
    const username = state.settings.username || 'Alejandro Sanz';
    const profileNameEl = document.querySelector('.profile-name');
    const avatarTextEl = document.querySelector('.avatar-text');
    const avatarSmallEl = document.querySelector('.profile-avatar-small');

    if (profileNameEl) profileNameEl.textContent = username;
    
    // Initials calculation
    const initials = username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (avatarTextEl) avatarTextEl.textContent = initials;
    if (avatarSmallEl) avatarSmallEl.textContent = initials;
  }

  function updateCurrencyLabels() {
    const symbol = currencySymbols[state.settings.currency] || '€';
    
    const amountLabel = document.querySelector('label[for="amount-input"]');
    if (amountLabel) amountLabel.textContent = `Importe (${symbol})`;
    
    const modalAmountLabel = document.querySelector('label[for="modal-amount-input"]');
    if (modalAmountLabel) modalAmountLabel.textContent = `Importe (${symbol})`;

    const settingsGoalLabel = document.querySelector('label[for="settings-goal-input"]');
    if (settingsGoalLabel) settingsGoalLabel.textContent = `Meta de ahorro mensual (${symbol})`;
  }

  // -------------------------------------------------------------
  // 5. VIEW NAVIGATION (SPA ROUTER)
  // -------------------------------------------------------------

  function switchView(viewName) {
    state.currentView = viewName;

    // Toggle active sections using both .hidden and .active
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.add('hidden');
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.classList.add('active');
    }

    // Toggle active nav menu items
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close Mobile Menu if Open
    sidebar.classList.remove('show');
    sidebarBackdrop.classList.remove('show');

    // Toggle Search Box depending on View
    const searchBoxEl = document.querySelector('.search-box');
    if (searchBoxEl) {
      if (viewName === 'dashboard' || viewName === 'transactions') {
        searchBoxEl.style.display = 'flex';
        searchInput.value = state.searchQuery;
      } else {
        searchBoxEl.style.display = 'none';
      }
    }

    // Trigger View specific renders
    if (viewName === 'transactions') {
      renderTransactionsView();
    } else if (viewName === 'budgets') {
      renderBudgetsView();
    } else if (viewName === 'settings') {
      loadSettingsToForm();
    } else if (viewName === 'hucha') {
      renderHuchaView();
    } else if (viewName === 'perfil') {
      renderPerfilView();
    }
  }

  // -------------------------------------------------------------
  // 6. DASHBOARD QUICK ACTIVITY FEED RENDER
  // -------------------------------------------------------------

  function renderTransactions() {
    let filteredList = state.transactions.filter(t => {
      if (state.filter === 'all') return true;
      return t.type === state.filter;
    });

    if (state.searchQuery.trim() !== '') {
      const query = state.searchQuery.toLowerCase().trim();
      filteredList = filteredList.filter(t => 
        t.description.toLowerCase().includes(query) || 
        categoryNames[t.category].toLowerCase().includes(query)
      );
    }

    filteredList.sort((a, b) => b.id - a.id);

    // Limit feed to latest 5 items in dashboard mode
    const count = filteredList.length;
    recordCountEl.textContent = count === 1 ? 'Mostrando 1 registro' : `Mostrando ${count} registros`;

    // Clear feed
    transactionsContainer.innerHTML = '';

    if (count === 0) {
      emptyStateEl.style.display = 'flex';
      transactionsContainer.style.display = 'none';
      return;
    } else {
      emptyStateEl.style.display = 'none';
      transactionsContainer.style.display = 'flex';
    }

    const formatItemDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatAmount = (amount, type) => {
      const formatted = formatMoney(amount);
      return type === 'ingreso' ? `+ ${formatted}` : `- ${formatted}`;
    };

    // Show top 6 items in dashboard
    const dashboardItems = filteredList.slice(0, 6);

    dashboardItems.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'transaction-row';
      row.dataset.id = tx.id;

      const typeClass = tx.type === 'ingreso' ? 'amount-income' : 'amount-expense';
      const iconSVG = categoryIcons[tx.category] || categoryIcons['otros'];
      const catText = categoryNames[tx.category] || categoryNames['otros'];

      row.innerHTML = `
        <div class="transaction-left">
          <div class="category-badge badge-${tx.category}" title="${catText}">
            ${iconSVG}
          </div>
          <div class="transaction-details">
            <h4 class="transaction-desc" title="${tx.description}">${tx.description}</h4>
            <div class="transaction-meta">
              <span class="transaction-cat-name">${catText}</span>
              <span class="transaction-divider"></span>
              <span class="transaction-date">${formatItemDate(tx.date)}</span>
            </div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${typeClass}">${formatAmount(tx.amount, tx.type)}</span>
          <button class="delete-row-btn" data-id="${tx.id}" title="Eliminar registro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></polyline>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      transactionsContainer.appendChild(row);
    });
  }

  // -------------------------------------------------------------
  // 7. DETAILED TRANSACTIONS VIEW RENDER
  // -------------------------------------------------------------

  function renderTransactionsView() {
    const listBody = document.getElementById('view-transactions-list');
    const emptyState = document.getElementById('transactions-empty-state');
    const countEl = document.getElementById('transactions-view-count');
    
    if (!listBody) return;

    const activeTypeTab = document.querySelector('#transactions-type-tabs .filter-tab.active');
    const typeFilter = activeTypeTab ? activeTypeTab.dataset.filter : 'all';
    const categoryFilter = document.getElementById('transactions-category-filter').value;
    
    let filteredList = state.transactions.filter(t => {
      const matchesType = (typeFilter === 'all' || t.type === typeFilter);
      const matchesCategory = (categoryFilter === 'all' || t.category === categoryFilter);
      const matchesSearch = (state.searchQuery.trim() === '' || 
        t.description.toLowerCase().includes(state.searchQuery.toLowerCase().trim()) ||
        categoryNames[t.category].toLowerCase().includes(state.searchQuery.toLowerCase().trim())
      );
      return matchesType && matchesCategory && matchesSearch;
    });

    filteredList.sort((a, b) => b.id - a.id);

    listBody.innerHTML = '';

    const count = filteredList.length;
    countEl.textContent = count === 1 ? 'Mostrando 1 transacción' : `Mostrando ${count} transacciones`;

    if (count === 0) {
      emptyState.style.display = 'flex';
      listBody.parentElement.style.display = 'none';
      return;
    } else {
      emptyState.style.display = 'none';
      listBody.parentElement.style.display = 'block';
    }

    const formatItemDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    filteredList.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'transaction-row';
      row.dataset.id = tx.id;

      const typeClass = tx.type === 'ingreso' ? 'amount-income' : 'amount-expense';
      const iconSVG = categoryIcons[tx.category] || categoryIcons['otros'];
      const catText = categoryNames[tx.category] || categoryNames['otros'];

      row.innerHTML = `
        <div class="col-description">
          <div class="category-badge badge-${tx.category}" title="${catText}">
            ${iconSVG}
          </div>
          <span class="transaction-desc" title="${tx.description}">${tx.description}</span>
        </div>
        <div class="col-category">${catText}</div>
        <div class="col-date">${formatItemDate(tx.date)}</div>
        <div class="col-amount ${typeClass}">${tx.type === 'ingreso' ? '+' : '-'} ${formatMoney(tx.amount)}</div>
        <div class="col-actions">
          <button class="delete-row-btn" data-id="${tx.id}" title="Eliminar registro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></polyline>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
      listBody.appendChild(row);
    });
  }

  // -------------------------------------------------------------
  // 8. BUDGETS VIEW LÒGICA & RENDER
  // -------------------------------------------------------------

  function renderBudgetsView() {
    const grid = document.getElementById('budgets-grid');
    const totalBudgetEl = document.getElementById('budget-total-amount');
    const totalSpentEl = document.getElementById('budget-spent-amount');
    const savingsEl = document.getElementById('budget-savings-amount');
    
    if (!grid) return;

    const budgetCategories = ['alimentacion', 'transporte', 'entretenimiento', 'servicios', 'vivienda', 'otros'];
    
    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    grid.innerHTML = '';

    budgetCategories.forEach(cat => {
      const limit = state.budgets[cat] || 0;
      totalBudgeted += limit;

      const spent = state.transactions
        .filter(t => t.type === 'gasto' && t.category === cat)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      totalSpentInBudgets += spent;

      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      
      let colorClass = '';
      if (percent >= 100) {
        colorClass = 'danger';
      } else if (percent >= 75) {
        colorClass = 'warning';
      }

      const card = document.createElement('div');
      card.className = 'card budget-card';
      
      const iconSVG = categoryIcons[cat] || categoryIcons['otros'];
      const catText = categoryNames[cat] || categoryNames['otros'];

      card.innerHTML = `
        <div class="budget-card-header">
          <div class="budget-category-info">
            <div class="category-badge badge-${cat}">
              ${iconSVG}
            </div>
            <span class="budget-category-title">${catText}</span>
          </div>
          <button class="budget-card-limit-btn" data-category="${cat}" title="Ajustar Límite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <div class="budget-progress-container">
          <div class="budget-progress-meta">
            <span>Gastado: ${formatMoney(spent)} de ${formatMoney(limit)}</span>
            <span class="budget-percentage">${percent.toFixed(0)}%</span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill ${colorClass}" style="width: ${Math.min(percent, 100)}%"></div>
          </div>
          ${percent > 100 ? `
            <div class="budget-overspent-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
              </svg>
              <span>¡Superado por ${formatMoney(spent - limit)}!</span>
            </div>
          ` : ''}
        </div>
      `;
      grid.appendChild(card);
    });

    totalBudgetEl.textContent = formatMoney(totalBudgeted);
    totalSpentEl.textContent = formatMoney(totalSpentInBudgets);
    
    // Ahorro Estimado: Meta de ahorro mensual vs Ahorro real
    const incomeTotal = state.transactions
      .filter(t => t.type === 'ingreso')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expenseTotal = state.transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const netSavings = incomeTotal - expenseTotal;
    
    savingsEl.textContent = formatMoney(netSavings);
  }

  // -------------------------------------------------------------
  // 9. SETTINGS LOGIC
  // -------------------------------------------------------------

  function loadSettingsToForm() {
    const nameInput = document.getElementById('settings-name-input');
    const currencySelect = document.getElementById('settings-currency-select');
    const goalInput = document.getElementById('settings-goal-input');

    if (nameInput) nameInput.value = state.settings.username || '';
    if (currencySelect) currencySelect.value = state.settings.currency || 'EUR';
    if (goalInput) goalInput.value = state.settings.savingsGoal || '';
  }

  // -------------------------------------------------------------
  // 9b. HUCHA & PERFIL BANCARIO LOGIC
  // -------------------------------------------------------------

  function getAvailableBalance() {
    const incomeTotal = state.transactions
      .filter(t => t.type === 'ingreso')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenseTotal = state.transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return incomeTotal - expenseTotal - (state.hucha ? state.hucha.ahorrado : 0);
  }

  function renderHuchaView() {
    const goalNameInput = document.getElementById('hucha-goal-name-input');
    const goalTargetInput = document.getElementById('hucha-goal-target-input');
    
    if (goalNameInput) goalNameInput.value = state.hucha.nombre;
    if (goalTargetInput) goalTargetInput.value = state.hucha.meta;

    const metaNameEl = document.getElementById('hucha-meta-name');
    const currentAmountEl = document.getElementById('hucha-current-amount');
    const targetAmountEl = document.getElementById('hucha-target-amount');
    const progressBarFillEl = document.getElementById('hucha-progress-bar');
    const percentageTextEl = document.getElementById('hucha-percentage-text');

    if (metaNameEl) metaNameEl.textContent = state.hucha.nombre;
    if (currentAmountEl) currentAmountEl.textContent = formatMoney(state.hucha.ahorrado);
    if (targetAmountEl) targetAmountEl.textContent = `de ${formatMoney(state.hucha.meta)}`;

    let percentage = 0;
    if (state.hucha.meta > 0) {
      percentage = Math.round((state.hucha.ahorrado / state.hucha.meta) * 100);
    }
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    if (progressBarFillEl) progressBarFillEl.style.width = `${percentage}%`;
    if (percentageTextEl) percentageTextEl.textContent = `${percentage}% completado`;
  }

  function setupHuchaListeners() {
    const amountInput = document.getElementById('hucha-amount-input');
    const depositBtn = document.getElementById('btn-hucha-deposit');
    const withdrawBtn = document.getElementById('btn-hucha-withdraw');
    const metaForm = document.getElementById('hucha-meta-form');

    if (depositBtn) {
      depositBtn.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        const errorEl = document.getElementById('hucha-amount-error');
        
        if (isNaN(amount) || amount <= 0) {
          showInputError(amountInput, errorEl, 'Ingresa un importe mayor a cero');
          return;
        }
        
        const available = getAvailableBalance();
        if (amount > available) {
          showInputError(amountInput, errorEl, 'Saldo disponible insuficiente para esta aportación');
          return;
        }

        clearInputError(amountInput, errorEl);
        state.hucha.ahorrado += amount;
        saveToStorage('fintrack_hucha', state.hucha);
        
        amountInput.value = '';
        updateUI();
        renderHuchaView();
      });
    }

    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        const errorEl = document.getElementById('hucha-amount-error');
        
        if (isNaN(amount) || amount <= 0) {
          showInputError(amountInput, errorEl, 'Ingresa un importe mayor a cero');
          return;
        }
        
        if (amount > state.hucha.ahorrado) {
          showInputError(amountInput, errorEl, 'No puedes retirar una cantidad mayor a la ahorrada');
          return;
        }

        clearInputError(amountInput, errorEl);
        state.hucha.ahorrado -= amount;
        saveToStorage('fintrack_hucha', state.hucha);
        
        amountInput.value = '';
        updateUI();
        renderHuchaView();
      });
    }

    if (metaForm) {
      metaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalNameInput = document.getElementById('hucha-goal-name-input');
        const goalTargetInput = document.getElementById('hucha-goal-target-input');

        const name = goalNameInput.value.trim();
        const target = parseFloat(goalTargetInput.value);

        if (name && !isNaN(target) && target > 0) {
          state.hucha.nombre = name;
          state.hucha.meta = target;
          saveToStorage('fintrack_hucha', state.hucha);
          renderHuchaView();
        }
      });
    }
  }

  function renderPerfilView() {
    const cardIbanEl = document.getElementById('card-iban-display');
    const cardHolderEl = document.getElementById('card-holder-name-display');
    const formNameInput = document.getElementById('profile-name-input');
    const formEmailInput = document.getElementById('profile-email-input');
    const formIbanInput = document.getElementById('profile-iban-readonly');

    const session = localStorage.getItem('sesionUsuario');
    if (session) {
      const userData = JSON.parse(session);
      if (cardIbanEl) cardIbanEl.textContent = userData.iban;
      if (cardHolderEl) cardHolderEl.textContent = userData.nombre;
      if (formNameInput) formNameInput.value = userData.nombre;
      if (formEmailInput) formEmailInput.value = userData.email;
      if (formIbanInput) formIbanInput.value = userData.iban;
    }
  }

  function setupProfileListener() {
    const profileForm = document.getElementById('profile-update-form');
    if (!profileForm) return;

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('profile-name-input');
      const emailInput = document.getElementById('profile-email-input');
      const nameError = document.getElementById('profile-name-error');
      const emailError = document.getElementById('profile-email-error');

      let isValid = true;
      clearInputError(nameInput, nameError);
      clearInputError(emailInput, emailError);

      if (nameInput.value.trim() === '') {
        showInputError(nameInput, nameError, 'El nombre es requerido');
        isValid = false;
      }

      if (emailInput.value.trim() === '') {
        showInputError(emailInput, emailError, 'El correo electrónico es requerido');
        isValid = false;
      } else if (!validateEmail(emailInput.value.trim())) {
        showInputError(emailInput, emailError, 'Ingresa un correo electrónico válido');
        isValid = false;
      }

      if (!isValid) return;

      const session = localStorage.getItem('sesionUsuario');
      if (session) {
        const userData = JSON.parse(session);
        const oldUsername = userData.nombre;
        userData.nombre = nameInput.value.trim();
        userData.email = emailInput.value.trim();
        
        localStorage.setItem('sesionUsuario', JSON.stringify(userData));

        // Update in usuarios database
        const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const userIndex = users.findIndex(u => u.username.toLowerCase() === oldUsername.toLowerCase());
        if (userIndex !== -1) {
          users[userIndex].username = userData.nombre;
          users[userIndex].email = userData.email;
          localStorage.setItem('usuarios', JSON.stringify(users));
        }
        
        state.settings.username = userData.nombre;
        state.settings.email = userData.email;
        saveToStorage('fintrack_settings', state.settings);

        updateSidebarProfile();
        setupDateTime();
        renderPerfilView();
        
        // Also sync the settings screen if it's currently rendered
        const settingsNameInput = document.getElementById('settings-name-input');
        if (settingsNameInput) settingsNameInput.value = userData.nombre;
        
        alert('Perfil actualizado con éxito');
      }
    });
  }

  // -------------------------------------------------------------
  // 10. VALIDATIONS & FORM CONTROLS
  // -------------------------------------------------------------

  function validateForm(form, descSelector, amountSelector, catSelector) {
    let isValid = true;
    
    // Reset errors
    form.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));

    const desc = form.querySelector(descSelector);
    const amount = form.querySelector(amountSelector);
    const cat = form.querySelector(catSelector);

    if (desc && desc.value.trim() === '') {
      desc.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (amount) {
      const val = parseFloat(amount.value);
      if (isNaN(val) || val <= 0) {
        amount.closest('.form-group').classList.add('has-error');
        isValid = false;
      }
    }

    if (cat && cat.value === '') {
      cat.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    return isValid;
  }

  // Clear validation styling when user starts typing/correcting
  document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      if (group && group.classList.contains('has-error')) {
        group.classList.remove('has-error');
      }
    });
  });

  // -------------------------------------------------------------
  // 11. EVENT HANDLERS & LISTENERS
  // -------------------------------------------------------------

  function setupEventListeners() {
    
    // NAVIGATION LINKS CLICK
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) {
          switchView(view);
        }
      });
    });

    // DASHBOARD FORM SUBMIT
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!validateForm(formEl, '#desc-input', '#amount-input', '#category-input')) return;

      const descVal = descInput.value.trim();
      const amountVal = parseFloat(amountInput.value);
      const catVal = categoryInput.value;
      
      let typeVal = 'ingreso';
      for (const radio of typeRadios) {
        if (radio.checked) {
          typeVal = radio.value;
          break;
        }
      }

      const newTx = {
        id: Date.now(),
        description: descVal,
        amount: amountVal,
        category: catVal,
        type: typeVal,
        date: new Date().toISOString()
      };

      state.transactions.unshift(newTx);
      saveToStorage('fintrack_transactions', state.transactions);
      
      formEl.reset();
      
      labelIncome.classList.add('active');
      labelExpense.classList.remove('active');
      document.querySelector('input[name="transaction-type"][value="ingreso"]').checked = true;
      
      updateUI();
    });

    // Toggle radio button group visuals (Dashboard Form)
    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'ingreso' && radio.checked) {
          labelIncome.classList.add('active');
          labelExpense.classList.remove('active');
        } else if (radio.value === 'gasto' && radio.checked) {
          labelExpense.classList.add('active');
          labelIncome.classList.remove('active');
        }
      });
    });

    // MODAL ADD TRANSACTION SUBMIT
    const modalForm = document.getElementById('modal-transaction-form');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!validateForm(modalForm, '#modal-desc-input', '#modal-amount-input', '#modal-category-input')) return;

        const descVal = document.getElementById('modal-desc-input').value.trim();
        const amountVal = parseFloat(document.getElementById('modal-amount-input').value);
        const catVal = document.getElementById('modal-category-input').value;
        
        const modalTypeRadios = document.getElementsByName('modal-transaction-type');
        let typeVal = 'ingreso';
        for (const r of modalTypeRadios) {
          if (r.checked) {
            typeVal = r.value;
            break;
          }
        }

        const newTx = {
          id: Date.now(),
          description: descVal,
          amount: amountVal,
          category: catVal,
          type: typeVal,
          date: new Date().toISOString()
        };

        state.transactions.unshift(newTx);
        saveToStorage('fintrack_transactions', state.transactions);
        
        modalForm.reset();
        document.getElementById('modal-label-income').classList.add('active');
        document.getElementById('modal-label-expense').classList.remove('active');
        document.querySelector('input[name="modal-transaction-type"][value="ingreso"]').checked = true;

        addTxModal.classList.remove('show');
        updateUI();
      });

      // Toggle radio button group visuals (Modal form)
      const modalTypeRadios = document.getElementsByName('modal-transaction-type');
      modalTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          const modLabelIncome = document.getElementById('modal-label-income');
          const modLabelExpense = document.getElementById('modal-label-expense');
          if (radio.value === 'ingreso' && radio.checked) {
            modLabelIncome.classList.add('active');
            modLabelExpense.classList.remove('active');
          } else if (radio.value === 'gasto' && radio.checked) {
            modLabelExpense.classList.add('active');
            modLabelIncome.classList.remove('active');
          }
        });
      });
    }

    // MODAL SET BUDGET SUBMIT
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const catSelect = document.getElementById('budget-category-input');
        const limitInput = document.getElementById('budget-limit-input');

        let isValid = true;
        catSelect.closest('.form-group').classList.remove('has-error');
        limitInput.closest('.form-group').classList.remove('has-error');

        if (catSelect.value === '') {
          catSelect.closest('.form-group').classList.add('has-error');
          isValid = false;
        }

        const limitVal = parseFloat(limitInput.value);
        if (isNaN(limitVal) || limitVal < 0) {
          limitInput.closest('.form-group').classList.add('has-error');
          isValid = false;
        }

        if (!isValid) return;

        state.budgets[catSelect.value] = limitVal;
        saveToStorage('fintrack_budgets', state.budgets);

        budgetModal.classList.remove('show');
        budgetForm.reset();
        
        updateUI();
      });
    }

    // PROFILE SETTINGS FORM SUBMIT
    const profileForm = document.getElementById('settings-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('settings-name-input');
        if (nameInput && nameInput.value.trim() !== '') {
          const newName = nameInput.value.trim();
          const session = localStorage.getItem('sesionUsuario');
          if (session) {
            const userData = JSON.parse(session);
            const oldUsername = userData.nombre;
            userData.nombre = newName;
            localStorage.setItem('sesionUsuario', JSON.stringify(userData));

            const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const userIndex = users.findIndex(u => u.username.toLowerCase() === oldUsername.toLowerCase());
            if (userIndex !== -1) {
              users[userIndex].username = newName;
              localStorage.setItem('usuarios', JSON.stringify(users));
            }
          }

          state.settings.username = newName;
          saveToStorage('fintrack_settings', state.settings);
          
          updateSidebarProfile();
          setupDateTime(); // Reload header greeting
          
          // Toast or simple visual success indicator
          const btn = profileForm.querySelector('button[type="submit"]');
          const origText = btn.textContent;
          btn.textContent = '¡Guardado con éxito!';
          btn.style.backgroundColor = 'var(--color-success)';
          setTimeout(() => {
            btn.textContent = origText;
            btn.style.backgroundColor = '';
          }, 2000);
        }
      });
    }

    // PREFERENCES SETTINGS FORM SUBMIT
    const preferencesForm = document.getElementById('settings-preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currencySelect = document.getElementById('settings-currency-select');
        const goalInput = document.getElementById('settings-goal-input');

        if (currencySelect) {
          state.settings.currency = currencySelect.value;
        }
        if (goalInput && goalInput.value !== '') {
          state.settings.savingsGoal = parseFloat(goalInput.value);
        }

        saveToStorage('fintrack_settings', state.settings);
        
        updateCurrencyLabels();
        updateUI();

        // Visual Success Indicator
        const btn = preferencesForm.querySelector('button[type="submit"]');
        const origText = btn.textContent;
        btn.textContent = '¡Preferencias Guardadas!';
        btn.style.backgroundColor = 'var(--color-success)';
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.backgroundColor = '';
        }, 2000);
      });
    }

    // DELETING TRANSACTIONS (Dashboard Activity Feed & Transactions View Table)
    const handleTxDeleteClick = (e) => {
      const deleteBtn = e.target.closest('.delete-row-btn');
      if (deleteBtn) {
        const idToDelete = parseInt(deleteBtn.dataset.id);
        const rowElement = deleteBtn.closest('.transaction-row');
        
        if (rowElement) {
          rowElement.style.transform = 'translateX(100px)';
          rowElement.style.opacity = '0';
          
          setTimeout(() => {
            state.transactions = state.transactions.filter(t => t.id !== idToDelete);
            saveToStorage('fintrack_transactions', state.transactions);
            updateUI();
          }, 200);
        }
      }
    };

    transactionsContainer.addEventListener('click', handleTxDeleteClick);
    
    const viewTxListBody = document.getElementById('view-transactions-list');
    if (viewTxListBody) {
      viewTxListBody.addEventListener('click', handleTxDeleteClick);
    }

    // FILTER TAB CLICKS (Dashboard Feed)
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        state.filter = tab.dataset.filter;
        renderTransactions();
      });
    });

    // FILTER TAB CLICKS (Transactions View)
    const txTypeTabs = document.querySelectorAll('#transactions-type-tabs .filter-tab');
    txTypeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        txTypeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        renderTransactionsView();
      });
    });

    // CATEGORY FILTER SELECT (Transactions View)
    const txCatFilter = document.getElementById('transactions-category-filter');
    if (txCatFilter) {
      txCatFilter.addEventListener('change', () => {
        renderTransactionsView();
      });
    }

    // LIVE SEARCH INPUT (Global header search)
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.currentView === 'dashboard') {
        renderTransactions();
      } else if (state.currentView === 'transactions') {
        renderTransactionsView();
      }
    });

    // MOBILE SIDEBAR TOGGLES
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      sidebarBackdrop.classList.toggle('show');
    });

    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      sidebarBackdrop.classList.remove('show');
    });

    // MODAL TRIGGER BUTTONS
    const openAddTxBtn = document.getElementById('open-add-transaction-modal');
    if (openAddTxBtn) {
      openAddTxBtn.addEventListener('click', () => {
        addTxModal.classList.add('show');
      });
    }

    const openSetBudgetBtn = document.getElementById('open-set-budget-modal');
    if (openSetBudgetBtn) {
      openSetBudgetBtn.addEventListener('click', () => {
        document.getElementById('budget-category-input').value = '';
        document.getElementById('budget-limit-input').value = '';
        budgetModal.classList.add('show');
      });
    }

    // MODAL CLOSE BUTTONS
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addTxModal.classList.remove('show');
        budgetModal.classList.remove('show');
      });
    });

    // Close modals on backdrop click
    window.addEventListener('click', (e) => {
      if (e.target === addTxModal) addTxModal.classList.remove('show');
      if (e.target === budgetModal) budgetModal.classList.remove('show');
    });

    // Dynamic Edit Budget trigger on card buttons
    const budgetsGrid = document.getElementById('budgets-grid');
    if (budgetsGrid) {
      budgetsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.budget-card-limit-btn');
        if (btn) {
          const category = btn.dataset.category;
          const limit = state.budgets[category] || 0;
          
          document.getElementById('budget-category-input').value = category;
          document.getElementById('budget-limit-input').value = limit;
          
          budgetModal.classList.add('show');
        }
      });
    }

    // EXPORT DATA TO JSON FILE
    const exportBtn = document.getElementById('settings-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `fintrack_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }

    // RESET APP TO DEFAULTS
    const resetBtn = document.getElementById('settings-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer la aplicación? Se eliminarán todas tus transacciones y configuraciones.')) {
          localStorage.removeItem('fintrack_transactions');
          localStorage.removeItem('fintrack_settings');
          localStorage.removeItem('fintrack_budgets');
          localStorage.removeItem('fintrack_hucha');
          localStorage.removeItem('sesionUsuario');
          
          // Force reload to restart app state
          window.location.reload();
        }
      });
    }

    // LOGOUT BUTTONS
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('sesionUsuario');
        window.location.reload();
      });
    });

    // SETUP NEW BANCARIZATION LISTENERS
    setupHuchaListeners();
    setupProfileListener();
  }

  // -------------------------------------------------------------
  // 12. INITIATE APP
  // -------------------------------------------------------------
  if (checkSession()) {
    init();
  }

});
