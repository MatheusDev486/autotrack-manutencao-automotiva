const { pool, handleMySQLError } = require('../config/database');

const manutencaoController = {

  async listar(req, res) {
    try {
      const sql = `
        SELECT
          m.id,
          m.veiculo_id,
          m.tipo,
          m.descricao,
          DATE_FORMAT(m.data_manutencao, '%Y-%m-%d') AS data_manutencao,
          m.quilometragem_registro,
          m.valor,
          m.status,
          m.observacoes,
          m.data_cadastro,
          m.data_atualizacao,
          v.placa,
          v.marca,
          v.modelo,
          v.ano,
          c.id AS cliente_id,
          c.nome AS proprietario_nome,
          c.telefone AS proprietario_telefone
        FROM manutencoes m
        INNER JOIN veiculos v ON m.veiculo_id = v.id
        INNER JOIN clientes c ON v.cliente_id = c.id
        ORDER BY m.data_manutencao DESC, m.id DESC
      `;
      const [rows] = await pool.query(sql);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT
          m.id,
          m.veiculo_id,
          m.tipo,
          m.descricao,
          DATE_FORMAT(m.data_manutencao, '%Y-%m-%d') AS data_manutencao,
          m.quilometragem_registro,
          m.valor,
          m.status,
          m.observacoes,
          m.data_cadastro,
          m.data_atualizacao,
          v.placa,
          v.marca,
          v.modelo,
          c.nome AS proprietario_nome
        FROM manutencoes m
        INNER JOIN veiculos v ON m.veiculo_id = v.id
        INNER JOIN clientes c ON v.cliente_id = c.id
        WHERE m.id = ?
      `;
      const [rows] = await pool.query(sql, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro de manutenção não encontrado.' });
      }

      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async criar(req, res) {
    try {
      const {
        veiculo_id,
        tipo,
        descricao,
        data_manutencao,
        quilometragem_registro,
        valor,
        status,
        observacoes
      } = req.body;

      if (!veiculo_id || !tipo || !descricao || !data_manutencao || valor === undefined || valor === null) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: veiculo_id, tipo, descricao, data_manutencao e valor são obrigatórios.'
        });
      }

      const tiposValidos = ['PREVENTIVA', 'CORRETIVA'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de manutenção inválido. Permitidos: ${tiposValidos.join(', ')}`
        });
      }

      const statusValidos = ['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
      const statusFinal = status && statusValidos.includes(status) ? status : 'AGENDADA';

      const [veiculoRows] = await pool.query('SELECT id, quilometragem FROM veiculos WHERE id = ?', [veiculo_id]);
      if (veiculoRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Veículo selecionado não existe.'
        });
      }

      const km = quilometragem_registro !== undefined && quilometragem_registro !== null && quilometragem_registro !== ''
        ? Number(quilometragem_registro)
        : veiculoRows[0].quilometragem;

      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor da manutenção deve ser um número positivo.'
        });
      }

      const [result] = await pool.query(
        `INSERT INTO manutencoes
          (veiculo_id, tipo, descricao, data_manutencao, quilometragem_registro, valor, status, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          veiculo_id,
          tipo,
          descricao.trim(),
          data_manutencao,
          km,
          valorNumerico,
          statusFinal,
          observacoes ? observacoes.trim() : null
        ]
      );

      if (km > veiculoRows[0].quilometragem) {
        await pool.query('UPDATE veiculos SET quilometragem = ? WHERE id = ?', [km, veiculo_id]);
      }

      return res.status(201).json({
        success: true,
        message: 'Ordem de manutenção registrada com sucesso!',
        data: {
          id: result.insertId,
          veiculo_id,
          tipo,
          descricao,
          data_manutencao,
          quilometragem_registro: km,
          valor: valorNumerico,
          status: statusFinal
        }
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        veiculo_id,
        tipo,
        descricao,
        data_manutencao,
        quilometragem_registro,
        valor,
        status,
        observacoes
      } = req.body;

      if (!veiculo_id || !tipo || !descricao || !data_manutencao || valor === undefined || valor === null) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: veiculo_id, tipo, descricao, data_manutencao e valor são obrigatórios.'
        });
      }

      const [check] = await pool.query('SELECT id FROM manutencoes WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Manutenção não encontrada para atualização.' });
      }

      const tiposValidos = ['PREVENTIVA', 'CORRETIVA'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de manutenção inválido. Permitidos: ${tiposValidos.join(', ')}`
        });
      }

      const statusValidos = ['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
      if (status && !statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status inválido. Permitidos: ${statusValidos.join(', ')}`
        });
      }

      const valorNumerico = parseFloat(valor);
      const km = Number(quilometragem_registro) || 0;

      await pool.query(
        `UPDATE manutencoes
         SET veiculo_id = ?, tipo = ?, descricao = ?, data_manutencao = ?, quilometragem_registro = ?, valor = ?, status = ?, observacoes = ?
         WHERE id = ?`,
        [
          veiculo_id,
          tipo,
          descricao.trim(),
          data_manutencao,
          km,
          valorNumerico,
          status || 'AGENDADA',
          observacoes ? observacoes.trim() : null,
          id
        ]
      );

      return res.json({
        success: true,
        message: 'Manutenção atualizada com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;

      const [check] = await pool.query('SELECT id FROM manutencoes WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Manutenção não encontrada para exclusão.' });
      }

      await pool.query('DELETE FROM manutencoes WHERE id = ?', [id]);

      return res.json({
        success: true,
        message: 'Registro de manutenção excluído com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  }
};

module.exports = manutencaoController;
