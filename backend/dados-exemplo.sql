-- Script SQL com Dados de Exemplo para Testes
-- Execute este script DEPOIS de iniciar o servidor pela primeira vez

-- IMPORTANTE: Este script é apenas para testes/demonstração
-- Não use em produção!

-- 1. Inserir leituras de gás do mês anterior (Agosto/2025) - necessário para calcular consumo
INSERT INTO leituras_gas (apartamento, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total)
VALUES
  ('01', 8, 2025, 65.939, NULL, NULL, 21.37, NULL),
  ('02', 8, 2025, 131.801, NULL, NULL, 21.37, NULL),
  ('03', 8, 2025, 96.618, NULL, NULL, 21.37, NULL),
  ('04', 8, 2025, 141.254, NULL, NULL, 21.37, NULL),
  ('05', 8, 2025, 48.446, NULL, NULL, 21.37, NULL),
  ('06', 8, 2025, 129.166, NULL, NULL, 21.37, NULL);

-- 2. Inserir leituras de gás de Setembro/2025
INSERT INTO leituras_gas (apartamento, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total)
VALUES
  ('01', 9, 2025, 69.823, 65.939, 3.884, 21.37, 83.00),
  ('02', 9, 2025, 143.378, 131.801, 11.577, 21.37, 247.40),
  ('03', 9, 2025, 100.984, 96.618, 4.366, 21.37, 93.30),
  ('04', 9, 2025, 150.109, 141.254, 8.855, 21.37, 189.23),
  ('05', 9, 2025, 50.403, 48.446, 1.957, 21.37, 41.82),
  ('06', 9, 2025, 133.795, 129.166, 4.629, 21.37, 98.92);

-- 3. Configurar saldo bancário para Setembro/2025
INSERT INTO banco_saldo (mes, ano, saldo_inicial, saldo_final, saldo_extrato, conferido)
VALUES (9, 2025, 5000.00, NULL, NULL, false);

-- 4. Inserir despesas do condomínio para Setembro/2025
INSERT INTO despesas_condominio (mes, ano, categoria_id, descricao, valor, valor_por_apto)
VALUES
  (9, 2025, 1, 'Barigui Internet', 108.29, 18.05),
  (9, 2025, 2, 'Copel Energia', 113.00, 18.83),
  (9, 2025, 3, 'Sanepar água', 1048.76, 174.79),
  (9, 2025, 4, 'Jardineiro', 250.00, 41.67),
  (9, 2025, 6, 'Maria aux adm e limpeza', 900.00, 150.00),
  (9, 2025, NULL, 'Certificado Bombeiro', 175.44, 29.24);

-- 5. Criar despesa parcelada (exemplo: Manutenção do Prédio)
-- Este INSERT criará uma despesa parcelada de 5x de R$ 422.88
INSERT INTO despesas_parceladas (descricao, valor_total, num_parcelas, valor_parcela, mes_inicio, ano_inicio)
VALUES ('Manutenção Prédio (sensor portão, botão porta, fundo lixeira, molas 2 portas)', 2114.40, 5, 70.48, 8, 2025);

-- 6. Inserir as parcelas correspondentes
INSERT INTO parcelas_cobradas (despesa_parcelada_id, mes, ano, parcela_numero, valor, cobrado)
VALUES
  (1, 8, 2025, 1, 70.48, true),
  (1, 9, 2025, 2, 70.48, true),
  (1, 10, 2025, 3, 70.48, false),
  (1, 11, 2025, 4, 70.48, false),
  (1, 12, 2025, 5, 70.48, false);

-- 7. Adicionar as parcelas cobradas às despesas do condomínio
INSERT INTO despesas_condominio (mes, ano, descricao, valor, valor_por_apto)
VALUES
  (8, 2025, 'Manutenção Prédio (1/5)', 422.88, 70.48),
  (9, 2025, 'Manutenção Prédio (2/5)', 422.88, 70.48);

-- 8. Inserir transações bancárias para Setembro/2025
INSERT INTO banco_transacoes (mes, ano, tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao, criado_por)
VALUES
  (9, 2025, 'debito', 1, 'Barigui Internet', 108.29, true, '2025-09-05', 1),
  (9, 2025, 'debito', 2, 'Copel Energia', 113.00, true, '2025-09-10', 1),
  (9, 2025, 'debito', 3, 'Sanepar água', 1048.76, true, '2025-09-15', 1),
  (9, 2025, 'debito', 4, 'Jardineiro', 250.00, true, '2025-09-20', 1),
  (9, 2025, 'debito', 6, 'Maria aux adm e limpeza', 900.00, true, '2025-09-25', 1),
  (9, 2025, 'debito', NULL, 'Certificado Bombeiro', 175.44, true, '2025-09-16', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 01', 596.08, false, '2025-09-01', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 02', 748.27, false, '2025-09-01', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 03', 598.85, false, '2025-09-01', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 04', 805.28, false, '2025-09-01', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 05', 579.92, false, '2025-09-01', 1),
  (9, 2025, 'credito', NULL, 'Recebimento condomínio - Apto 06', 599.90, false, '2025-09-01', 1);

-- 9. Adicionar alguns emails permitidos para teste
INSERT INTO emails_permitidos (email, apartamento, usado)
VALUES
  ('morador1@email.com', '01', false),
  ('morador2@email.com', '02', false),
  ('morador3@email.com', '03', false),
  ('morador4@email.com', '04', false),
  ('morador5@email.com', '05', false),
  ('morador6@email.com', '06', false);

-- Pronto! Agora você tem dados de exemplo para testar o sistema

-- Para verificar os dados:
-- SELECT * FROM leituras_gas WHERE ano = 2025 AND mes = 9;
-- SELECT * FROM despesas_condominio WHERE ano = 2025 AND mes = 9;
-- SELECT * FROM banco_transacoes WHERE ano = 2025 AND mes = 9;
-- SELECT * FROM despesas_parceladas;
