USE autotrack_db;

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
ORDER BY gasto_acumulado DESC;

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

SELECT 
    m.status AS status_ordem,
    COUNT(m.id) AS total_ordens,
    COALESCE(SUM(m.valor), 0.00) AS valor_vinculado
FROM manutencoes m
GROUP BY m.status
ORDER BY total_ordens DESC;
