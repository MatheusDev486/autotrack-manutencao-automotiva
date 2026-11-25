const { pool, handleMySQLError } = require('../config/database');

const veiculoController = {

  async listar(req, res) {
    try {
      const sql = `
        SELECT
          v.id,
          v.cliente_id,
          v.placa,
          v.marca,
          v.modelo,
          v.ano,
          v.cor,
          v.quilometragem,
          v.data_cadastro,
          v.data_atualizacao,
          c.nome AS proprietario_nome,
          c.telefone AS proprietario_telefone,
          c.email AS proprietario_email
        FROM veiculos v
        INNER JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.modelo ASC
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
          v.id,
          v.cliente_id,
          v.placa,
          v.marca,
          v.modelo,
          v.ano,
          v.cor,
          v.quilometragem,
          v.data_cadastro,
          v.data_atualizacao,
          c.nome AS proprietario_nome,
          c.telefone AS proprietario_telefone
        FROM veiculos v
        INNER JOIN clientes c ON v.cliente_id = c.id
        WHERE v.id = ?
      `;
      const [rows] = await pool.query(sql, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Veículo não encontrado.' });
      }

      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async criar(req, res) {
    try {
      const { cliente_id, placa, marca, modelo, ano, cor, quilometragem } = req.body;

      if (!cliente_id || !placa || !marca || !modelo || !ano || !cor) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: cliente_id, placa, marca, modelo, ano e cor são obrigatórios.'
        });
      }

      const [clienteRows] = await pool.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
      if (clienteRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cliente selecionado não existe.'
        });
      }

      const km = quilometragem !== undefined && quilometragem !== null && quilometragem !== ''
        ? Number(quilometragem)
        : 0;

      const [result] = await pool.query(
        'INSERT INTO veiculos (cliente_id, placa, marca, modelo, ano, cor, quilometragem) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cliente_id, placa.trim().toUpperCase(), marca.trim(), modelo.trim(), Number(ano), cor.trim(), km]
      );

      return res.status(201).json({
        success: true,
        message: 'Veículo cadastrado com sucesso!',
        data: {
          id: result.insertId,
          cliente_id,
          placa: placa.trim().toUpperCase(),
          marca,
          modelo,
          ano,
          cor,
          quilometragem: km
        }
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { cliente_id, placa, marca, modelo, ano, cor, quilometragem } = req.body;

      if (!cliente_id || !placa || !marca || !modelo || !ano || !cor) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: cliente_id, placa, marca, modelo, ano e cor são obrigatórios.'
        });
      }

      const [check] = await pool.query('SELECT id FROM veiculos WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Veículo não encontrado para atualização.' });
      }

      const km = quilometragem !== undefined && quilometragem !== null && quilometragem !== ''
        ? Number(quilometragem)
        : 0;

      await pool.query(
        'UPDATE veiculos SET cliente_id = ?, placa = ?, marca = ?, modelo = ?, ano = ?, cor = ?, quilometragem = ? WHERE id = ?',
        [cliente_id, placa.trim().toUpperCase(), marca.trim(), modelo.trim(), Number(ano), cor.trim(), km, id]
      );

      return res.json({
        success: true,
        message: 'Veículo atualizado com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;

      const [check] = await pool.query('SELECT id FROM veiculos WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Veículo não encontrado para exclusão.' });
      }

      const [[{ total: totalManutencoes }]] = await pool.query(
        'SELECT COUNT(*) AS total FROM manutencoes WHERE veiculo_id = ?',
        [id]
      );

      if (totalManutencoes > 0) {
        return res.status(409).json({
          success: false,
          code: 'ER_ROW_IS_REFERENCED_2',
          message: `Não é possível excluir este veículo: ele possui ${totalManutencoes} manutenção(ões) registrada(s). Exclua as manutenções primeiro.`
        });
      }

      await pool.query('DELETE FROM veiculos WHERE id = ?', [id]);

      return res.json({
        success: true,
        message: 'Veículo excluído com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  }
};

module.exports = veiculoController;
