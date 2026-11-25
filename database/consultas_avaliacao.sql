-- =============================================================================
-- PROJETO: AutoTrack - Sistema de Gestão de Manutenção Automotiva
-- ARQUIVO: database/consultas_avaliacao.sql
-- SGBD: MySQL 8.x / MariaDB
-- AUTORES: Matheus da Silva Gomes (RA: 273137)
--          Guilherme Coco da Costa (RA: 272449)
--          Carlos Henrique Beltramo Rodrigues (RA: 272766)
-- =============================================================================

USE autotrack_db;

-- -----------------------------------------------------------------------------
-- CONSULTA OBRIGATÓRIA 1: JUNÇÃO RELACIONAL (INNER JOIN / MULTI-JOIN)
-- -----------------------------------------------------------------------------
-- Objetivo: Demonstrar a navegação relacional 1:N entre 'manutencoes', 'veiculos'
-- e 'clientes', exibindo o histórico de ordens de serviço com os dados completos
-- do veículo atendido e o nome/telefone do cliente proprietário.
-- -----------------------------------------------------------------------------
SELECT 
    m.id AS manutencao_id,
    m.tipo,
    m.descricao,
    m.data_manutencao,
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
ORDER BY m.data_manutencao DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA OBRIGATÓRIA 2: AGREGAÇÃO COM GROUP BY (COMPATÍVEL MYSQL 8)
-- -----------------------------------------------------------------------------
-- Objetivo: Calcular métricas financeiras e operacionais consolidadas por veículo.
-- Utiliza COUNT(m.id), SUM(m.valor) e AVG(m.valor), aplicando LEFT JOIN para 
-- incluir também veículos cadastrados que ainda não realizaram manutenção (COALESCE).
-- 
-- ATENÇÃO À REGRA MYSQL 8: Todos os campos não-agregados no SELECT constam 
-- explicitamente na cláusula GROUP BY para satisfazer o modo 'ONLY_FULL_GROUP_BY'.
-- -----------------------------------------------------------------------------
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
ORDER BY total_gasto DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA OBRIGATÓRIA 3: SUBCONSULTA (SUBQUERY COM HAVING / AVG)
-- -----------------------------------------------------------------------------
-- Objetivo: Identificar quais veículos geraram um custo acumulado de manutenção
-- SUPERIOR à média geral de gastos de todos os veículos que passaram pela oficina.
-- A subconsulta calcula dinamicamente a média global dos totais por veículo.
-- -----------------------------------------------------------------------------
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
    -- Subconsulta que extrai o valor médio de gastos entre os veículos atendidos
    SELECT AVG(sub.gasto_veiculo)
    FROM (
        SELECT SUM(m2.valor) AS gasto_veiculo
        FROM manutencoes m2
        GROUP BY m2.veiculo_id
    ) AS sub
)
ORDER BY gasto_acumulado DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA ADICIONAL 4: DISTRIBUIÇÃO ESTATÍSTICA POR TIPO DE MANUTENÇÃO
-- -----------------------------------------------------------------------------
-- Objetivo: Comparar a proporção e impacto financeiro de serviços preventivos vs corretivos.
-- -----------------------------------------------------------------------------
SELECT 
    m.tipo AS tipo_manutencao,
    COUNT(m.id) AS quantidade_servicos,
    SUM(m.valor) AS custo_total,
    ROUND(AVG(m.valor), 2) AS custo_medio,
    MIN(m.valor) AS menor_valor,
    MAX(m.valor) AS maior_valor
FROM manutencoes m
GROUP BY m.tipo
ORDER BY custo_total DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA ADICIONAL 5: RESUMO POR STATUS OPERACIONAL
-- -----------------------------------------------------------------------------
-- Objetivo: Acompanhar o fluxo de ordens de serviço no pátio (Agendada, Em Andamento, Concluída, etc.)
-- -----------------------------------------------------------------------------
SELECT 
    m.status AS status_ordem,
    COUNT(m.id) AS total_ordens,
    COALESCE(SUM(m.valor), 0.00) AS valor_vinculado
FROM manutencoes m
GROUP BY m.status
ORDER BY total_ordens DESC;
