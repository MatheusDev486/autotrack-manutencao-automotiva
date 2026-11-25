USE autotrack_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE manutencoes;
TRUNCATE TABLE veiculos;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO clientes (id, nome, cpf, telefone, email, endereco) VALUES
(1, 'Rodrigo Fernandes Silveira', '111.222.333-44', '(14) 99811-2020', 'rodrigo.silveira@email.com', 'Rua das Flores, 120 - Centro, Ourinhos/SP'),
(2, 'Camila Beatriz de Souza', '222.333.444-55', '(14) 99722-3030', 'camila.souza@email.com', 'Av. Duque de Caxias, 450 - Jd. Paulista, Ourinhos/SP'),
(3, 'Fernando Henrique Alencar', '333.444.555-66', '(14) 99633-4040', 'fernando.alencar@email.com', 'Rua Paraná, 890 - Vila Nova, Santa Cruz do Rio Pardo/SP'),
(4, 'Juliana Mendes Moreira', '444.555.666-77', '(14) 99144-5050', 'juliana.moreira@email.com', 'Av. Altino Arantes, 310 - Centro, Ourinhos/SP'),
(5, 'Lucas Gabriel Ribeiro', '555.666.777-88', '(14) 98155-6060', 'lucas.ribeiro@email.com', 'Rua Antônio Prado, 55 - Vila Perino, Ourinhos/SP');

INSERT INTO veiculos (id, cliente_id, placa, marca, modelo, ano, cor, quilometragem) VALUES
(1, 1, 'BRA2E19', 'Toyota', 'Corolla XEi 2.0', 2021, 'Prata Metálico', 48500),
(2, 1, 'FXT9A82', 'Fiat', 'Strada Freedom 1.3', 2023, 'Branco Banchisa', 24200),
(3, 2, 'RHE4F71', 'Honda', 'Civic Touring 1.5 Turbo', 2020, 'Preto Cristal', 62000),
(4, 3, 'GCY7D33', 'Volkswagen', 'Gol 1.6 MSI Flex', 2019, 'Vermelho Flash', 89000),
(5, 3, 'QNP1B45', 'Chevrolet', 'Onix Premier 1.0 Turbo', 2022, 'Cinza Satin Steel', 35700),
(6, 4, 'MER8H90', 'Jeep', 'Compass Longitude 2.0 Diesel', 2021, 'Azul Jazz', 54000),
(7, 5, 'DJK3C12', 'Ford', 'Ka SE Plus 1.0', 2018, 'Branco Ártico', 97500);

INSERT INTO manutencoes (id, veiculo_id, tipo, descricao, data_manutencao, quilometragem_registro, valor, status, observacoes) VALUES
(1, 1, 'PREVENTIVA', 'Revisão periódica de 40.000 km: troca de óleo 0W-20, filtro de óleo, filtro de ar e filtro de combustível', '2026-03-10', 40200, 580.00, 'CONCLUIDA', 'Óleo genuíno Toyota utilizado. Pastilhas com 60% de vida útil restante.'),
(2, 1, 'PREVENTIVA', 'Troca de pastilhas de freio dianteiras e fluido de freio DOT 4', '2026-08-15', 46000, 420.00, 'CONCLUIDA', 'Discos de freio retificados sem necessidade de substituição.'),
(3, 1, 'PREVENTIVA', 'Alinhamento 3D, balanceamento das 4 rodas e rodízio de pneus', '2026-11-02', 48500, 150.00, 'CONCLUIDA', 'Calibragem correta e suspensão sem folgas.'),

(4, 2, 'PREVENTIVA', 'Revisão dos 20.000 km: troca de óleo mineral 5W-30, filtro de óleo e filtro de ar de cabine', '2026-05-20', 20100, 390.00, 'CONCLUIDA', 'Serviço realizado dentro do prazo de garantia.'),
(5, 2, 'CORRETIVA', 'Substituição de coifa homocinética dianteira direita danificada por cascalho', '2026-09-12', 23400, 260.00, 'CONCLUIDA', 'Sem vazamento residual na junta homocinética.'),

(6, 3, 'PREVENTIVA', 'Revisão dos 50.000 km: troca de óleo de câmbio CVT e velas de ignição de irídio', '2026-02-18', 50500, 1150.00, 'CONCLUIDA', 'Fluido original HCF-2 e velas NGK Laser Iridium aplicados.'),
(7, 3, 'CORRETIVA', 'Diagnóstico e reparo do atuador do compressor de ar-condicionado', '2026-07-22', 58000, 980.00, 'CONCLUIDA', 'Carga de gás R134a renovada e sistema com vazão nominal.'),
(8, 3, 'PREVENTIVA', 'Troca de pastilhas de freio traseiras e higienização de dutos de ar', '2026-11-20', 62000, 380.00, 'AGENDADA', 'Cliente solicitou agendamento para a semana que vem.'),

(9, 4, 'CORRETIVA', 'Troca da correia dentada, tensor e bomba d’água preventiva pós-ruído', '2026-04-05', 82000, 850.00, 'CONCLUIDA', 'Aditivo de arrefecimento orgânico G12 substituído.'),
(10, 4, 'CORRETIVA', 'Substituição do kit de embreagem (platô, disco e rolamento) e cabo', '2026-10-14', 88500, 1200.00, 'CONCLUIDA', 'Embreagem Sachs instalada com pedal macio.'),

(11, 5, 'PREVENTIVA', 'Revisão dos 30.000 km: óleo 5W-30 Dexos1 Gen2 e verificação da correia banhada a óleo', '2026-06-11', 30100, 490.00, 'CONCLUIDA', 'Correia dentada inspecionada visualmente sem sinais de delaminação.'),

(12, 6, 'PREVENTIVA', 'Revisão de 50.000 km: troca de filtros de diesel, filtro de ar do motor e óleo Selenia 5W-30', '2026-09-01', 50000, 890.00, 'CONCLUIDA', 'Verificação eletrônica via scanner sem falhas presentes.'),
(13, 6, 'CORRETIVA', 'Troca das bieletas dianteiras e buchas da barra estabilizadora', '2026-11-14', 54000, 440.00, 'EM_ANDAMENTO', 'Peças genuínas em montagem no elevador 2.')
;
