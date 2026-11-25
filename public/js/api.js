const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP ${response.status}: Falha na operação.`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  },

  async health() {
    return this.request('/health');
  },

  clientes: {
    listar: () => API.request('/clientes'),
    buscarPorId: (id) => API.request(`/clientes/${id}`),
    criar: (dados) => API.request('/clientes', { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id, dados) => API.request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    excluir: (id) => API.request(`/clientes/${id}`, { method: 'DELETE' })
  },

  veiculos: {
    listar: () => API.request('/veiculos'),
    buscarPorId: (id) => API.request(`/veiculos/${id}`),
    criar: (dados) => API.request('/veiculos', { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id, dados) => API.request(`/veiculos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    excluir: (id) => API.request(`/veiculos/${id}`, { method: 'DELETE' })
  },

  manutencoes: {
    listar: () => API.request('/manutencoes'),
    buscarPorId: (id) => API.request(`/manutencoes/${id}`),
    criar: (dados) => API.request('/manutencoes', { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id, dados) => API.request(`/manutencoes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    excluir: (id) => API.request(`/manutencoes/${id}`, { method: 'DELETE' })
  },

  relatorios: {
    kpis: () => API.request('/relatorios/kpis'),
    join: () => API.request('/relatorios/join'),
    agregacao: () => API.request('/relatorios/agregacao'),
    subquery: () => API.request('/relatorios/subquery'),
    resumoTipos: () => API.request('/relatorios/resumo-tipos'),
    resumoStatus: () => API.request('/relatorios/resumo-status')
  }
};

const Toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-3 border transition-all ${
      type === 'success'
        ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
        : type === 'error'
        ? 'bg-rose-950/90 text-rose-200 border-rose-700/60'
        : type === 'warning'
        ? 'bg-amber-950/90 text-amber-200 border-amber-700/60'
        : 'bg-slate-800 text-slate-200 border-slate-700'
    }`;

    const icon = type === 'success'
      ? '<i class="fa-solid fa-circle-check text-emerald-400"></i>'
      : type === 'error'
      ? '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i>'
      : type === 'warning'
      ? '<i class="fa-solid fa-circle-exclamation text-amber-400"></i>'
      : '<i class="fa-solid fa-info-circle text-blue-400"></i>';

    toast.innerHTML = `
      ${icon}
      <span class="flex-1">${message}</span>
      <button class="text-slate-400 hover:text-slate-200 ml-2" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning', 5000); },
  info(msg) { this.show(msg, 'info'); }
};

const Formatters = {
  moeda(valor) {
    const num = parseFloat(valor);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  data(dataStr) {
    if (!dataStr) return '-';

    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  },

  km(valor) {
    const num = parseInt(valor);
    if (isNaN(num)) return '0 km';
    return `${num.toLocaleString('pt-BR')} km`;
  }
};
