const { pool, handleMySQLError } = require('../config/database');

const clienteController = {

  async listar(req, res) {
    try {
      const [rows] = await pool.query(
        'SELECT id, nome, cpf, telefone, email, endereco, data_cadastro, data_atualizacao FROM clientes ORDER BY nome ASC'
      );
      return res.json({ success: true, data: rows });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        'SELECT id, nome, cpf, telefone, email, endereco, data_cadastro, data_atualizacao FROM clientes WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
      }

      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async criar(req, res) {
    try {
      const { nome, cpf, telefone, email, endereco } = req.body;

      if (!nome || !cpf || !telefone || !email) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: nome, cpf, telefone e email devem ser informados.'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO clientes (nome, cpf, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)',
        [nome.trim(), cpf.trim(), telefone.trim(), email.trim(), endereco ? endereco.trim() : null]
      );

      return res.status(201).json({
        success: true,
        message: 'Cliente cadastrado com sucesso!',
        data: {
          id: result.insertId,
          nome,
          cpf,
          telefone,
          email,
          endereco
        }
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, cpf, telefone, email, endereco } = req.body;

      if (!nome || !cpf || !telefone || !email) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: nome, cpf, telefone e email devem ser informados.'
        });
      }

      const [check] = await pool.query('SELECT id FROM clientes WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Cliente não encontrado para atualização.' });
      }

      await pool.query(
        'UPDATE clientes SET nome = ?, cpf = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?',
        [nome.trim(), cpf.trim(), telefone.trim(), email.trim(), endereco ? endereco.trim() : null, id]
      );

      return res.json({
        success: true,
        message: 'Cliente atualizado com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;

      const [check] = await pool.query('SELECT id FROM clientes WHERE id = ?', [id]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Cliente não encontrado para exclusão.' });
      }

      const [[{ total: totalVeiculos }]] = await pool.query(
        'SELECT COUNT(*) AS total FROM veiculos WHERE cliente_id = ?',
        [id]
      );

      if (totalVeiculos > 0) {
        return res.status(409).json({
          success: false,
          code: 'ER_ROW_IS_REFERENCED_2',
          message: `Não é possível excluir este cliente: ele possui ${totalVeiculos} veículo(s) cadastrado(s). Exclua os veículos primeiro.`
        });
      }

      await pool.query('DELETE FROM clientes WHERE id = ?', [id]);

      return res.json({
        success: true,
        message: 'Cliente excluído com sucesso!'
      });
    } catch (error) {
      return handleMySQLError(error, res);
    }
  }
};

module.exports = clienteController;
