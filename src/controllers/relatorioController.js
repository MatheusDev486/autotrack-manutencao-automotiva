const { pool, handleMySQLError } = require('../config/database');

const relatorioController = {

  async consultaJoin(req, res) {
    try {
      const sql = `
        SELECT
          m.id AS manutencao_id,
          m.tipo,
          m.descricao,
          DATE_FORMAT(m.data_manutencao, '%d/%m/%Y') AS data_formatada,
          m.quilometragem_registro,
          m.valor,
          m.status,
          v.placa,
          v.marca,
          v.modelo,
          v.ano,
          c.id AS cliente_id,
          c.nome AS proprietario,
          c.telefone,
          c.email
        FROM manutencoes m
        INNER JOIN veiculos v ON m.veiculo_id = v.id
        INNER JOIN clientes c ON v.cliente_id = c.id
        ORDER BY m.data_manutencao DESC
      `;
      const [rows] = await pool.query(sql);
      return res.json({
        success: true,
        tipo_consulta: 'INNER JOIN (Relacional Completo)',
        descricao: 'Junção de 3 tabelas (manutencoes -> veiculos -> clientes) trazendo detalhes da OS, veículo e proprietário.',
        total_registros: rows.length,
        data: rows
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async consultaAgregacao(req, res) {
    try {
      const sql = `
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
        ORDER BY total_gasto DESC
      `;
      const [rows] = await pool.query(sql);
      return res.json({
        success: true,
        tipo_consulta: 'AGREGAÇÃO COM GROUP BY (MySQL 8 Ready)',
        descricao: 'Calcula COUNT, SUM e AVG agrupando por veículo e proprietário, incluindo veículos sem manutenção via LEFT JOIN.',
        total_registros: rows.length,
        data: rows
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async consultaSubquery(req, res) {
    try {
      const sql = `
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
        ORDER BY gasto_acumulado DESC
      `;
      const [rows] = await pool.query(sql);

      const [mediaGeralRows] = await pool.query(`
        SELECT AVG(sub.gasto_veiculo) AS media_geral
        FROM (
          SELECT SUM(m2.valor) AS gasto_veiculo
          FROM manutencoes m2
          GROUP BY m2.veiculo_id
        ) AS sub
      `);

      const mediaGeral = mediaGeralRows[0]?.media_geral ? parseFloat(mediaGeralRows[0].media_geral).toFixed(2) : 0;

      return res.json({
        success: true,
        tipo_consulta: 'SUBCONSULTA (SUBQUERY)',
        descricao: 'Filtra veículos cujo total gasto excede a média global de gastos calculada dinamicamente via subquery.',
        media_geral_veiculos: mediaGeral,
        total_registros: rows.length,
        data: rows
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async resumoTipos(req, res) {
    try {
      const sql = `
        SELECT
          m.tipo AS tipo_manutencao,
          COUNT(m.id) AS quantidade_servicos,
          COALESCE(SUM(m.valor), 0.00) AS custo_total,
          COALESCE(ROUND(AVG(m.valor), 2), 0.00) AS custo_medio,
          COALESCE(MIN(m.valor), 0.00) AS menor_valor,
          COALESCE(MAX(m.valor), 0.00) AS maior_valor
        FROM manutencoes m
        GROUP BY m.tipo
        ORDER BY custo_total DESC
      `;
      const [rows] = await pool.query(sql);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async resumoStatus(req, res) {
    try {
      const sql = `
        SELECT
          m.status AS status_ordem,
          COUNT(m.id) AS total_ordens,
          COALESCE(SUM(m.valor), 0.00) AS valor_vinculado
        FROM manutencoes m
        GROUP BY m.status
        ORDER BY total_ordens DESC
      `;
      const [rows] = await pool.query(sql);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async metricasGerais(req, res) {
    try {
      const [clientesCount] = await pool.query('SELECT COUNT(*) AS total FROM clientes');
      const [veiculosCount] = await pool.query('SELECT COUNT(*) AS total FROM veiculos');
      const [manutencoesCount] = await pool.query('SELECT COUNT(*) AS total FROM manutencoes');
      const [financeiro] = await pool.query(`
        SELECT
          COALESCE(SUM(valor), 0.00) AS faturamento_total,
          COALESCE(AVG(valor), 0.00) AS ticket_medio
        FROM manutencoes
        WHERE status != 'CANCELADA'
      `);
      const [pendentes] = await pool.query(`
        SELECT COUNT(*) AS ativas
        FROM manutencoes
        WHERE status IN ('AGENDADA', 'EM_ANDAMENTO')
      `);

      return res.json({
        success: true,
        data: {
          totalClientes: clientesCount[0].total,
          totalVeiculos: veiculosCount[0].total,
          totalManutencoes: manutencoesCount[0].total,
          faturamentoTotal: financeiro[0].faturamento_total,
          ticketMedio: financeiro[0].ticket_medio,
          manutencoesAtivas: pendentes[0].ativas
        }
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  }
};

module.exports = relatorioController;
