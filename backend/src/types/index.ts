export interface Usuario {
  id: number;
  email: string;
  senha: string;
  nome: string;
  tipo: 'administrador' | 'morador';
  apartamento?: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export interface EmailPermitido {
  id: number;
  email: string;
  apartamento: string;
  usado: boolean;
  criado_em: Date;
}

export interface CategoriaDespesa {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
  criado_em: Date;
}

export interface BancoTransacao {
  id: number;
  mes: number;
  ano: number;
  tipo: 'debito' | 'credito';
  categoria_id?: number;
  descricao: string;
  valor: number;
  ratear_condominos: boolean;
  data_transacao: Date;
  criado_em: Date;
  criado_por: number;
}

export interface BancoSaldo {
  id: number;
  mes: number;
  ano: number;
  saldo_inicial: number;
  saldo_final?: number;
  saldo_extrato?: number;
  conferido: boolean;
  criado_em: Date;
}

export interface DespesaCondominio {
  id: number;
  mes: number;
  ano: number;
  categoria_id?: number;
  descricao: string;
  valor: number;
  valor_por_apto: number;
  criado_em: Date;
}

export interface DespesaParcelada {
  id: number;
  descricao: string;
  valor_total: number;
  num_parcelas: number;
  valor_parcela: number;
  mes_inicio: number;
  ano_inicio: number;
  criado_em: Date;
}

export interface ParcelaCobrada {
  id: number;
  despesa_parcelada_id: number;
  mes: number;
  ano: number;
  parcela_numero: number;
  valor: number;
  cobrado: boolean;
  criado_em: Date;
}

export interface LeituraGas {
  id: number;
  apartamento: string;
  mes: number;
  ano: number;
  leitura_atual: number;
  leitura_anterior?: number;
  consumo?: number;
  valor_m3: number;
  valor_total?: number;
  criado_em: Date;
}

export interface Documento {
  id: number;
  mes: number;
  ano: number;
  tipo: string;
  nome_arquivo: string;
  caminho_arquivo: string;
  tamanho?: number;
  mime_type?: string;
  descricao?: string;
  criado_em: Date;
  criado_por: number;
}

export interface PagamentoMorador {
  id: number;
  apartamento: string;
  mes: number;
  ano: number;
  valor_condominio: number;
  valor_gas: number;
  valor_total: number;
  pago: boolean;
  data_pagamento?: Date;
  criado_em: Date;
}

export interface JWTPayload {
  id: number;
  email: string;
  tipo: 'administrador' | 'morador';
  apartamento?: string;
}
