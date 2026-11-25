/**
 * AutoTrack — Lógica Completa da Interface do Usuário (Frontend)
 * Design System Oficial: Preto & Vermelho (Referência Visual Exata)
 */

const App = {
  // Estado local da aplicação
  state: {
    abaAtual: 'dashboard',
    clientes: [],
    veiculos: [],
    manutencoes: [],
    labQueryAtual: 'join',
    itemParaExcluir: null // { tipo: 'cliente'|'veiculo'|'manutencao', id: number, nome: string }
  },

  // Inicialização ao carregar a página
  async init() {
    console.log('[AutoTrack] Inicializando interface gráfica...');
    this.configurarMascaras();
    await this.verificarConexao();
    await this.carregarDadosIniciais();
  },

  // Verificação de status da conexão com MySQL
  async verificarConexao() {
    const dot = document.getElementById('db-status-dot');
    const text = document.getElementById('db-status-text');

    if (dot) dot.className = 'db-dot-connected animate-pulse';
    if (text) text.textContent = 'Verificando MySQL...';

    try {
      const res = await API.health();
      if (res.bancoDeDados && res.bancoDeDados.conectado) {
        if (dot) dot.className = 'db-dot-connected';
        if (text) text.textContent = `MySQL Conectado (${res.bancoDeDados.database})`;
      } else {
        if (dot) dot.className = 'db-dot-disconnected';
        if (text) text.textContent = 'MySQL Desconectado';
      }
    } catch (err) {
      if (dot) dot.className = 'db-dot-disconnected';
      if (text) text.textContent = 'Servidor Offline';
    }
  },

  // Navegação entre as abas do sistema
  navegar(aba) {
    this.state.abaAtual = aba;
    const abas = ['dashboard', 'clientes', 'veiculos', 'manutencoes', 'historico', 'sql'];

    abas.forEach(nome => {
      const section = document.getElementById(`view-${nome}`);
      const btn = document.getElementById(`nav-${nome}`);

      if (nome === aba) {
        section?.classList.remove('hidden');
        btn?.classList.add('active');
      } else {
        section?.classList.add('hidden');
        btn?.classList.remove('active');
      }
    });

    // Se navegou para alguma aba específica, recarrega seus dados
    if (aba === 'dashboard') {
      this.carregarDashboard();
    } else if (aba === 'clientes') {
      this.carregarClientes();
    } else if (aba === 'veiculos') {
      this.carregarVeiculos();
    } else if (aba === 'manutencoes') {
      this.carregarManutencoes();
    } else if (aba === 'historico') {
      this.carregarRelatorioJoin();
    } else if (aba === 'sql') {
      this.executarLaboratorioSQL(this.state.labQueryAtual || 'join');
    }
  },

  // Carregamento de dados iniciais
  async carregarDadosIniciais() {
    await this.carregarDashboard();
    // Pré-carrega listas para uso nos selects de modais
    this.carregarClientes(false);
    this.carregarVeiculos(false);
  },

  // ===========================================================================
  // DASHBOARD E RELATÓRIOS (CONSULTAS OBRIGATÓRIAS)
  // ===========================================================================
  async carregarDashboard() {
    try {
      // 1. KPIs
      const kpisRes = await API.relatorios.kpis();
      if (kpisRes.success && kpisRes.data) {
        document.getElementById('kpi-clientes').textContent = kpisRes.data.totalClientes;
        document.getElementById('kpi-veiculos').textContent = kpisRes.data.totalVeiculos;
        document.getElementById('kpi-manutencoes').textContent = kpisRes.data.totalManutencoes;
        document.getElementById('kpi-ativas').textContent = kpisRes.data.manutencoesAtivas;
        document.getElementById('kpi-faturamento').textContent = Formatters.moeda(kpisRes.data.faturamentoTotal);
      }

      // 2. Relatórios Obrigatórios
      await Promise.all([
        this.carregarRelatorioAgregacao(),
        this.carregarRelatorioSubquery(),
        this.carregarRelatorioJoin()
      ]);
    } catch (error) {
      console.warn('[Dashboard] Erro ao carregar métricas:', error.message);
    }
  },

  // Query Obrigatória 1: JOIN (Histórico Relacional Completo)
  async carregarRelatorioJoin() {
    const tbody = document.getElementById('tbody-relatorio-join');
    try {
      const res = await API.relatorios.join();
      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-[#9A9A9A]">Nenhum registro encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = res.data.map(m => `
        <tr>
          <td class="py-2.5 px-3 os-number">#${m.manutencao_id}</td>
          <td class="py-2.5 px-3">
            <span class="badge-${m.tipo.toLowerCase()}">
              ${m.tipo}
            </span>
          </td>
          <td class="py-2.5 px-3">
            <div class="vehicle-name">${m.marca} ${m.modelo}</div>
            <div class="vehicle-sub">${m.placa} (${m.ano})</div>
          </td>
          <td class="py-2.5 px-3">
            <div class="text-white text-xs">${m.proprietario}</div>
            <div class="vehicle-sub">${m.telefone}</div>
          </td>
          <td class="py-2.5 px-3">
            <div class="desc-truncate" title="${m.descricao}">${m.descricao}</div>
          </td>
          <td class="py-2.5 px-3 font-mono-data text-white text-xs">${m.data_formatada || Formatters.data(m.data_manutencao)}</td>
          <td class="py-2.5 px-3 text-right">
            <span class="currency-cell">${Formatters.moeda(m.valor)}</span>
          </td>
          <td class="py-2.5 px-3 text-center">
            <span class="badge-${m.status.toLowerCase()}">
              ${m.status.replace('_', ' ')}
            </span>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-[#D7261E]">Erro ao consultar JOIN: ${error.message}</td></tr>`;
    }
  },

  // Query Obrigatória 2: Agregação com GROUP BY
  async carregarRelatorioAgregacao() {
    const tbody = document.getElementById('tbody-relatorio-agregacao');
    try {
      const res = await API.relatorios.agregacao();
      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#9A9A9A]">Nenhum veículo encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = res.data.map(v => `
        <tr>
          <td class="py-2.5 px-3">
            <div class="vehicle-name">${v.marca} ${v.modelo}</div>
            <div class="vehicle-sub">${v.placa}</div>
          </td>
          <td class="py-2.5 px-3 text-white text-xs">${v.proprietario}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="qtd-os-box">${v.total_manutencoes}</span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <span class="currency-cell font-semibold">${Formatters.moeda(v.total_gasto)}</span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <span class="currency-cell text-[#9A9A9A]">${Formatters.moeda(v.ticket_medio)}</span>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-[#D7261E]">Erro na Agregação: ${error.message}</td></tr>`;
    }
  },

  // Query Obrigatória 3: Subquery
  async carregarRelatorioSubquery() {
    const tbody = document.getElementById('tbody-relatorio-subquery');
    const mediaLabel = document.getElementById('subquery-media-label');

    try {
      const res = await API.relatorios.subquery();
      if (res.media_geral_veiculos) {
        mediaLabel.textContent = Formatters.moeda(res.media_geral_veiculos);
      }

      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#9A9A9A]">Nenhum veículo acima da média encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = res.data.map(v => `
        <tr>
          <td class="py-2.5 px-3">
            <div class="vehicle-name">${v.veiculo}</div>
          </td>
          <td class="py-2.5 px-3">
            <span class="plate-red">${v.placa}</span>
          </td>
          <td class="py-2.5 px-3 text-white text-xs">${v.proprietario}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="qtd-os-box">${v.qtd_servicos}</span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <span class="currency-cell font-semibold">${Formatters.moeda(v.gasto_acumulado)}</span>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-[#D7261E]">Erro na Subquery: ${error.message}</td></tr>`;
    }
  },

  // ===========================================================================
  // CLIENTES (CRUD COMPLETO)
  // ===========================================================================
  async carregarClientes(renderizarTabela = true) {
    try {
      const res = await API.clientes.listar();
      this.state.clientes = res.data || [];
      if (renderizarTabela) this.renderizarTabelaClientes(this.state.clientes);
      this.atualizarSelectClientes();
    } catch (error) {
      Toast.error('Erro ao listar clientes: ' + error.message);
    }
  },

  renderizarTabelaClientes(lista) {
    const tbody = document.getElementById('tbody-clientes');
    if (!lista || lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-[#9A9A9A]">Nenhum cliente cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map(c => `
      <tr>
        <td class="py-2.5 px-4 font-mono-data text-[#9A9A9A]">#${c.id}</td>
        <td class="py-2.5 px-4 font-semibold text-white">${c.nome}</td>
        <td class="py-2.5 px-4 font-mono-data text-[#CCCCCC]">${c.cpf}</td>
        <td class="py-2.5 px-4 text-[#CCCCCC]">${c.telefone}</td>
        <td class="py-2.5 px-4 text-[#CCCCCC]">${c.email}</td>
        <td class="py-2.5 px-4 text-[#9A9A9A] max-w-xs truncate" title="${c.endereco || ''}">${c.endereco || '-'}</td>
        <td class="py-2.5 px-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="App.editarCliente(${c.id})" class="p-1.5 rounded hover:bg-[#262626] text-[#CCCCCC] hover:text-white" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="App.solicitarExclusao('cliente', ${c.id}, '${c.nome.replace(/'/g, "\\'")}')" class="p-1.5 rounded hover:bg-[#3A0F0F] text-[#D7261E]" title="Excluir">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  filtrarClientes() {
    const termo = document.getElementById('filtro-cliente').value.toLowerCase();
    const filtrados = this.state.clientes.filter(c => 
      c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo) || c.email.toLowerCase().includes(termo)
    );
    this.renderizarTabelaClientes(filtrados);
  },

  abrirModalCliente(cliente = null) {
    document.getElementById('modal-cliente').classList.remove('hidden');
    const form = document.getElementById('form-cliente');
    form.reset();

    if (cliente) {
      document.getElementById('modal-cliente-titulo').innerHTML = '<i class="fa-solid fa-pen text-[#D7261E]"></i><span>Editar Cliente</span>';
      document.getElementById('cliente-id').value = cliente.id;
      document.getElementById('cliente-nome').value = cliente.nome;
      document.getElementById('cliente-cpf').value = cliente.cpf;
      document.getElementById('cliente-telefone').value = cliente.telefone;
      document.getElementById('cliente-email').value = cliente.email;
      document.getElementById('cliente-endereco').value = cliente.endereco || '';
    } else {
      document.getElementById('modal-cliente-titulo').innerHTML = '<i class="fa-solid fa-user-plus text-[#D7261E]"></i><span>Cadastrar Cliente</span>';
      document.getElementById('cliente-id').value = '';
    }
  },

  fecharModalCliente() {
    document.getElementById('modal-cliente').classList.add('hidden');
  },

  async editarCliente(id) {
    try {
      const res = await API.clientes.buscarPorId(id);
      this.abrirModalCliente(res.data);
    } catch (err) {
      Toast.error('Erro ao buscar dados do cliente: ' + err.message);
    }
  },

  async salvarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('cliente-id').value;
    const dados = {
      nome: document.getElementById('cliente-nome').value,
      cpf: document.getElementById('cliente-cpf').value,
      telefone: document.getElementById('cliente-telefone').value,
      email: document.getElementById('cliente-email').value,
      endereco: document.getElementById('cliente-endereco').value
    };

    try {
      if (id) {
        await API.clientes.atualizar(id, dados);
        Toast.success('Cliente atualizado com sucesso no MySQL!');
      } else {
        await API.clientes.criar(dados);
        Toast.success('Cliente cadastrado com sucesso no MySQL!');
      }

      this.fecharModalCliente();
      await this.carregarClientes();
      await this.carregarDashboard();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  atualizarSelectClientes() {
    const select = document.getElementById('veiculo-cliente-id');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o proprietário...</option>' +
      this.state.clientes.map(c => `
        <option value="${c.id}">${c.nome} (CPF: ${c.cpf})</option>
      `).join('');
  },

  // ===========================================================================
  // VEÍCULOS (CRUD COMPLETO)
  // ===========================================================================
  async carregarVeiculos(renderizarTabela = true) {
    try {
      const res = await API.veiculos.listar();
      this.state.veiculos = res.data || [];
      if (renderizarTabela) this.renderizarTabelaVeiculos(this.state.veiculos);
      this.atualizarSelectVeiculos();
    } catch (error) {
      Toast.error('Erro ao listar veículos: ' + error.message);
    }
  },

  renderizarTabelaVeiculos(lista) {
    const tbody = document.getElementById('tbody-veiculos');
    if (!lista || lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-[#9A9A9A]">Nenhum veículo cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map(v => `
      <tr>
        <td class="py-2.5 px-4 font-mono-data text-[#9A9A9A]">#${v.id}</td>
        <td class="py-2.5 px-4 font-mono-data font-bold text-white tracking-wider">${v.placa}</td>
        <td class="py-2.5 px-4">
          <div class="font-semibold text-white">${v.marca} ${v.modelo}</div>
        </td>
        <td class="py-2.5 px-4 text-[#CCCCCC]">${v.ano} • ${v.cor}</td>
        <td class="py-2.5 px-4 font-mono-data text-[#CCCCCC]">${Formatters.km(v.quilometragem)}</td>
        <td class="py-2.5 px-4">
          <div class="text-white text-xs">${v.proprietario_nome || '-'}</div>
          <div class="vehicle-sub">${v.proprietario_telefone || ''}</div>
        </td>
        <td class="py-2.5 px-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="App.editarVeiculo(${v.id})" class="p-1.5 rounded hover:bg-[#262626] text-[#CCCCCC] hover:text-white" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="App.solicitarExclusao('veiculo', ${v.id}, '${v.placa} - ${v.modelo.replace(/'/g, "\\'")}')" class="p-1.5 rounded hover:bg-[#3A0F0F] text-[#D7261E]" title="Excluir">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  filtrarVeiculos() {
    const termo = document.getElementById('filtro-veiculo').value.toLowerCase();
    const filtrados = this.state.veiculos.filter(v => 
      v.placa.toLowerCase().includes(termo) || 
      v.modelo.toLowerCase().includes(termo) || 
      v.marca.toLowerCase().includes(termo) ||
      (v.proprietario_nome && v.proprietario_nome.toLowerCase().includes(termo))
    );
    this.renderizarTabelaVeiculos(filtrados);
  },

  abrirModalVeiculo(veiculo = null) {
    this.atualizarSelectClientes();
    document.getElementById('modal-veiculo').classList.remove('hidden');
    const form = document.getElementById('form-veiculo');
    form.reset();

    if (veiculo) {
      document.getElementById('modal-veiculo-titulo').innerHTML = '<i class="fa-solid fa-pen text-[#D7261E]"></i><span>Editar Veículo</span>';
      document.getElementById('veiculo-id').value = veiculo.id;
      document.getElementById('veiculo-cliente-id').value = veiculo.cliente_id;
      document.getElementById('veiculo-placa').value = veiculo.placa;
      document.getElementById('veiculo-marca').value = veiculo.marca;
      document.getElementById('veiculo-modelo').value = veiculo.modelo;
      document.getElementById('veiculo-ano').value = veiculo.ano;
      document.getElementById('veiculo-cor').value = veiculo.cor;
      document.getElementById('veiculo-km').value = veiculo.quilometragem;
    } else {
      document.getElementById('modal-veiculo-titulo').innerHTML = '<i class="fa-solid fa-car text-[#D7261E]"></i><span>Cadastrar Veículo</span>';
      document.getElementById('veiculo-id').value = '';
    }
  },

  fecharModalVeiculo() {
    document.getElementById('modal-veiculo').classList.add('hidden');
  },

  async editarVeiculo(id) {
    try {
      const res = await API.veiculos.buscarPorId(id);
      this.abrirModalVeiculo(res.data);
    } catch (err) {
      Toast.error('Erro ao buscar dados do veículo: ' + err.message);
    }
  },

  async salvarVeiculo(e) {
    e.preventDefault();
    const id = document.getElementById('veiculo-id').value;
    const dados = {
      cliente_id: Number(document.getElementById('veiculo-cliente-id').value),
      placa: document.getElementById('veiculo-placa').value,
      marca: document.getElementById('veiculo-marca').value,
      modelo: document.getElementById('veiculo-modelo').value,
      ano: Number(document.getElementById('veiculo-ano').value),
      cor: document.getElementById('veiculo-cor').value,
      quilometragem: Number(document.getElementById('veiculo-km').value || 0)
    };

    try {
      if (id) {
        await API.veiculos.atualizar(id, dados);
        Toast.success('Veículo atualizado com sucesso no MySQL!');
      } else {
        await API.veiculos.criar(dados);
        Toast.success('Veículo cadastrado com sucesso no MySQL!');
      }

      this.fecharModalVeiculo();
      await this.carregarVeiculos();
      await this.carregarDashboard();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  atualizarSelectVeiculos() {
    const select = document.getElementById('manutencao-veiculo-id');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o veículo...</option>' +
      this.state.veiculos.map(v => `
        <option value="${v.id}">${v.placa} — ${v.marca} ${v.modelo} (${v.proprietario_nome || 'Sem proprietário'})</option>
      `).join('');
  },

  // ===========================================================================
  // MANUTENÇÕES / OS (CRUD COMPLETO)
  // ===========================================================================
  async carregarManutencoes() {
    try {
      const res = await API.manutencoes.listar();
      this.state.manutencoes = res.data || [];
      this.renderizarTabelaManutencoes(this.state.manutencoes);
    } catch (error) {
      Toast.error('Erro ao listar manutenções: ' + error.message);
    }
  },

  renderizarTabelaManutencoes(lista) {
    const tbody = document.getElementById('tbody-manutencoes');
    if (!lista || lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-[#9A9A9A]">Nenhuma manutenção registrada.</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map(m => `
      <tr>
        <td class="py-2.5 px-3 os-number">#${m.id}</td>
        <td class="py-2.5 px-3">
          <span class="badge-${m.tipo.toLowerCase()}">
            ${m.tipo}
          </span>
        </td>
        <td class="py-2.5 px-3">
          <div class="vehicle-name">${m.marca} ${m.modelo}</div>
          <div class="vehicle-sub">${m.placa}</div>
        </td>
        <td class="py-2.5 px-3 text-white text-xs">${m.proprietario_nome || '-'}</td>
        <td class="py-2.5 px-3">
          <div class="desc-truncate" title="${m.descricao}">${m.descricao}</div>
        </td>
        <td class="py-2.5 px-3 font-mono-data text-white text-xs">${Formatters.data(m.data_manutencao)}</td>
        <td class="py-2.5 px-3 font-mono-data text-[#9A9A9A] text-xs">${Formatters.km(m.quilometragem_registro)}</td>
        <td class="py-2.5 px-3 text-right">
          <span class="currency-cell">${Formatters.moeda(m.valor)}</span>
        </td>
        <td class="py-2.5 px-3 text-center">
          <span class="badge-${m.status.toLowerCase()}">
            ${m.status.replace('_', ' ')}
          </span>
        </td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="App.editarManutencao(${m.id})" class="p-1.5 rounded hover:bg-[#262626] text-[#CCCCCC] hover:text-white" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="App.solicitarExclusao('manutencao', ${m.id}, 'OS #${m.id} (${m.placa})')" class="p-1.5 rounded hover:bg-[#3A0F0F] text-[#D7261E]" title="Excluir">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  filtrarManutencoes() {
    const termo = document.getElementById('filtro-manutencao').value.toLowerCase();
    const filtradas = this.state.manutencoes.filter(m => 
      m.placa.toLowerCase().includes(termo) ||
      m.descricao.toLowerCase().includes(termo) ||
      m.status.toLowerCase().includes(termo) ||
      m.tipo.toLowerCase().includes(termo) ||
      (m.proprietario_nome && m.proprietario_nome.toLowerCase().includes(termo))
    );
    this.renderizarTabelaManutencoes(filtradas);
  },

  abrirModalManutencao(m = null) {
    this.atualizarSelectVeiculos();
    document.getElementById('modal-manutencao').classList.remove('hidden');
    const form = document.getElementById('form-manutencao');
    form.reset();

    // Data padrão para hoje se novo
    const hoje = new Date().toISOString().split('T')[0];

    if (m) {
      document.getElementById('modal-manutencao-titulo').innerHTML = '<i class="fa-solid fa-pen text-[#D7261E]"></i><span>Editar Manutenção</span>';
      document.getElementById('manutencao-id').value = m.id;
      document.getElementById('manutencao-veiculo-id').value = m.veiculo_id;
      document.getElementById('manutencao-tipo').value = m.tipo;
      document.getElementById('manutencao-descricao').value = m.descricao;
      document.getElementById('manutencao-data').value = m.data_manutencao ? m.data_manutencao.split('T')[0] : hoje;
      document.getElementById('manutencao-km').value = m.quilometragem_registro;
      document.getElementById('manutencao-valor').value = m.valor;
      document.getElementById('manutencao-status').value = m.status;
      document.getElementById('manutencao-obs').value = m.observacoes || '';
    } else {
      document.getElementById('modal-manutencao-titulo').innerHTML = '<i class="fa-solid fa-wrench text-[#D7261E]"></i><span>Nova Ordem de Manutenção</span>';
      document.getElementById('manutencao-id').value = '';
      document.getElementById('manutencao-data').value = hoje;
      document.getElementById('manutencao-status').value = 'AGENDADA';
    }
  },

  fecharModalManutencao() {
    document.getElementById('modal-manutencao').classList.add('hidden');
  },

  async editarManutencao(id) {
    try {
      const res = await API.manutencoes.buscarPorId(id);
      this.abrirModalManutencao(res.data);
    } catch (err) {
      Toast.error('Erro ao buscar dados da manutenção: ' + err.message);
    }
  },

  async salvarManutencao(e) {
    e.preventDefault();
    const id = document.getElementById('manutencao-id').value;
    const dados = {
      veiculo_id: Number(document.getElementById('manutencao-veiculo-id').value),
      tipo: document.getElementById('manutencao-tipo').value,
      descricao: document.getElementById('manutencao-descricao').value,
      data_manutencao: document.getElementById('manutencao-data').value,
      quilometragem_registro: Number(document.getElementById('manutencao-km').value || 0),
      valor: parseFloat(document.getElementById('manutencao-valor').value),
      status: document.getElementById('manutencao-status').value,
      observacoes: document.getElementById('manutencao-obs').value
    };

    try {
      if (id) {
        await API.manutencoes.atualizar(id, dados);
        Toast.success('Manutenção atualizada com sucesso no MySQL!');
      } else {
        await API.manutencoes.criar(dados);
        Toast.success('Ordem de manutenção registrada com sucesso no MySQL!');
      }

      this.fecharModalManutencao();
      await this.carregarManutencoes();
      await this.carregarDashboard();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  // ===========================================================================
  // EXCLUSÃO COM TRATAMENTO DE ERRO 1451 (ER_ROW_IS_REFERENCED_2)
  // ===========================================================================
  solicitarExclusao(tipo, id, nome) {
    this.state.itemParaExcluir = { tipo, id, nome };
    const modal = document.getElementById('modal-confirmar');
    const msg = document.getElementById('confirmar-mensagem');

    if (tipo === 'cliente') {
      msg.textContent = `Deseja realmente excluir o cliente "${nome}"? Atenção: Se houver veículos vinculados a ele, o MySQL bloqueará a operação (Foreign Key).`;
    } else if (tipo === 'veiculo') {
      msg.textContent = `Deseja realmente excluir o veículo "${nome}"? Atenção: Se houver manutenções registradas para ele, o MySQL bloqueará a exclusão.`;
    } else {
      msg.textContent = `Deseja realmente excluir o registro de ${nome}?`;
    }

    document.getElementById('btn-confirmar-exclusao').onclick = () => this.confirmarExclusao();
    modal.classList.remove('hidden');
  },

  fecharModalConfirmar() {
    document.getElementById('modal-confirmar').classList.add('hidden');
    this.state.itemParaExcluir = null;
  },

  async confirmarExclusao() {
    const item = this.state.itemParaExcluir;
    if (!item) return;

    try {
      if (item.tipo === 'cliente') {
        await API.clientes.excluir(item.id);
        Toast.success('Cliente excluído com sucesso do MySQL!');
        await this.carregarClientes();
      } else if (item.tipo === 'veiculo') {
        await API.veiculos.excluir(item.id);
        Toast.success('Veículo excluído com sucesso do MySQL!');
        await this.carregarVeiculos();
      } else if (item.tipo === 'manutencao') {
        await API.manutencoes.excluir(item.id);
        Toast.success('Registro de manutenção excluído com sucesso!');
        await this.carregarManutencoes();
      }

      this.fecharModalConfirmar();
      await this.carregarDashboard();
    } catch (error) {
      this.fecharModalConfirmar();
      // O backend já formata erro 1451 com mensagem amigável
      Toast.error(error.message);
    }
  },

  // ===========================================================================
  // LABORATÓRIO SQL INTERATIVO (APRESENTAÇÃO ACADÊMICA)
  // ===========================================================================
  sqlQueriesText: {
    join: `-- CONSULTA OBRIGATÓRIA 1: JUNÇÃO RELACIONAL (INNER JOIN)
-- Combina 3 tabelas relacionadas com navegação por chave estrangeira
SELECT 
    m.id AS manutencao_id,
    m.tipo,
    m.descricao,
    DATE_FORMAT(m.data_manutencao, '%d/%m/%Y') AS data_formatada,
    m.valor,
    m.status,
    v.placa,
    v.marca,
    v.modelo,
    c.nome AS proprietario,
    c.telefone
FROM manutencoes m
INNER JOIN veiculos v ON m.veiculo_id = v.id
INNER JOIN clientes c ON v.cliente_id = c.id
ORDER BY m.data_manutencao DESC;`,

    agregacao: `-- CONSULTA OBRIGATÓRIA 2: AGREGAÇÃO COM GROUP BY (MYSQL 8 ONLY_FULL_GROUP_BY)
-- Agrupa por veículo e calcula COUNT de manutenções, soma e ticket médio
SELECT 
    v.id AS veiculo_id,
    v.placa,
    v.marca,
    v.modelo,
    v.ano,
    c.nome AS proprietario,
    COUNT(m.id) AS total_manutencoes,
    COALESCE(SUM(m.valor), 0.00) AS total_gasto,
    COALESCE(AVG(m.valor), 0.00) AS ticket_medio
FROM veiculos v
INNER JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN manutencoes m ON m.veiculo_id = v.id
GROUP BY 
    v.id,
    v.placa,
    v.marca,
    v.modelo,
    v.ano,
    c.nome
ORDER BY total_gasto DESC;`,

    subquery: `-- CONSULTA OBRIGATÓRIA 3: SUBCONSULTA (SUBQUERY COM HAVING)
-- Identifica veículos cujo gasto total excede a média global dinâmica
SELECT 
    v.id AS veiculo_id,
    v.placa,
    CONCAT(v.marca, ' ', v.modelo) AS veiculo,
    c.nome AS proprietario,
    COUNT(m.id) AS qtd_servicos,
    SUM(m.valor) AS gasto_acumulado
FROM veiculos v
INNER JOIN clientes c ON v.cliente_id = c.id
INNER JOIN manutencoes m ON m.veiculo_id = v.id
GROUP BY 
    v.id,
    v.placa,
    v.marca,
    v.modelo,
    c.nome
HAVING gasto_acumulado > (
    SELECT AVG(sub.gasto_veiculo)
    FROM (
        SELECT SUM(m2.valor) AS gasto_veiculo
        FROM manutencoes m2
        GROUP BY m2.veiculo_id
    ) AS sub
)
ORDER BY gasto_acumulado DESC;`
  },

  async executarLaboratorioSQL(tipo) {
    this.state.labQueryAtual = tipo;
    const pre = document.getElementById('lab-sql-code');
    const title = document.getElementById('lab-sql-title');
    const count = document.getElementById('lab-result-count');
    const thead = document.getElementById('lab-table-head');
    const tbody = document.getElementById('lab-table-body');

    // Atualiza botões
    ['join', 'agregacao', 'subquery'].forEach(t => {
      const btn = document.getElementById(`btn-lab-${t}`);
      if (t === tipo) {
        btn?.classList.remove('border-[#2A2A2A]');
        btn?.classList.add('border-[#D7261E]', 'bg-[#1A1A1A]');
      } else {
        btn?.classList.remove('border-[#D7261E]', 'bg-[#1A1A1A]');
        btn?.classList.add('border-[#2A2A2A]');
      }
    });

    pre.textContent = this.sqlQueriesText[tipo] || '';

    if (tipo === 'join') {
      title.textContent = 'Query 1: Junção Relacional (INNER JOIN entre manutencoes, veiculos e clientes)';
    } else if (tipo === 'agregacao') {
      title.textContent = 'Query 2: Agregação com GROUP BY, COUNT, SUM e AVG (MySQL 8)';
    } else if (tipo === 'subquery') {
      title.textContent = 'Query 3: Subconsulta (Subquery com HAVING para comparar com a média geral)';
    }

    tbody.innerHTML = '<tr><td class="p-3 text-center text-[#9A9A9A]">Executando consulta no MySQL 8...</td></tr>';
    thead.innerHTML = '<tr><th class="p-2.5">Processando...</th></tr>';

    try {
      let res;
      if (tipo === 'join') res = await API.relatorios.join();
      else if (tipo === 'agregacao') res = await API.relatorios.agregacao();
      else if (tipo === 'subquery') res = await API.relatorios.subquery();

      const dados = res.data || [];
      count.textContent = `${dados.length} registros retornados do MySQL`;

      if (dados.length === 0) {
        thead.innerHTML = '<tr><th class="p-2.5">Sem colunas</th></tr>';
        tbody.innerHTML = '<tr><td class="p-3 text-center text-[#9A9A9A]">Nenhum resultado retornado para esta consulta.</td></tr>';
        return;
      }

      const colunas = Object.keys(dados[0]);
      thead.innerHTML = `<tr>${colunas.map(c => `<th class="py-2 px-3 uppercase text-[11px]">${c}</th>`).join('')}</tr>`;

      tbody.innerHTML = dados.map(linha => `
        <tr>
          ${colunas.map(c => {
            let val = linha[c];
            let isMoney = c.toLowerCase().includes('valor') || c.toLowerCase().includes('gasto') || c.toLowerCase().includes('medio');
            if (isMoney) {
              val = Formatters.moeda(val);
            }
            return `<td class="py-2 px-3 text-xs text-[#CCCCCC] font-mono-data ${isMoney ? 'text-right text-white font-semibold' : ''}">${val !== null && val !== undefined ? val : '-'}</td>`;
          }).join('')}
        </tr>
      `).join('');

      Toast.success(`Query '${tipo}' executada com sucesso no MySQL!`);
    } catch (err) {
      count.textContent = 'Erro';
      tbody.innerHTML = `<tr><td class="p-3 text-center text-[#D7261E]">Falha na execução: ${err.message}</td></tr>`;
      Toast.error('Erro ao executar query: ' + err.message);
    }
  },

  reexecutarLaboratorioSQL() {
    this.executarLaboratorioSQL(this.state.labQueryAtual || 'join');
  },

  // Máscaras de entrada (CPF, Telefone, Placa)
  configurarMascaras() {
    const cpfInput = document.getElementById('cliente-cpf');
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = v;
      });
    }

    const telInput = document.getElementById('cliente-telefone');
    if (telInput) {
      telInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 10) {
          v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (v.length > 5) {
          v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (v.length > 2) {
          v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        }
        e.target.value = v;
      });
    }

    const placaInput = document.getElementById('veiculo-placa');
    if (placaInput) {
      placaInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      });
    }
  }
};

// Inicia a aplicação no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
