export interface Usuario {
  id: number;
  email: string;
  nome: string;
  tipo: 'administrador' | 'morador';
  apartamento?: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface CategoriaDespesa {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface DespesaCondominio {
  id: number;
  mes: number;
  ano: number;
  categoria_id?: number;
  categoria_nome?: string;
  descricao: string;
  valor: number;
  valor_por_apto: number;
}

export interface DespesaParcelada {
  id: number;
  descricao: string;
  valor_total: number;
  num_parcelas: number;
  valor_parcela: number;
  mes_inicio: number;
  ano_inicio: number;
  parcelas_cobradas?: number;
  parcelas?: ParcelaCobrada[];
}

export interface ParcelaCobrada {
  id: number;
  despesa_parcelada_id: number;
  mes: number;
  ano: number;
  parcela_numero: number;
  valor: number;
  cobrado: boolean;
}

export interface BancoTransacao {
  id: number;
  mes: number;
  ano: number;
  tipo: 'debito' | 'credito';
  categoria_id?: number;
  categoria_nome?: string;
  descricao: string;
  valor: number;
  ratear_condominos: boolean;
  data_transacao: string;
  criado_por_nome?: string;
}

export interface BancoSaldo {
  id: number;
  mes: number;
  ano: number;
  saldo_inicial: number;
  saldo_final?: number;
  saldo_extrato?: number;
  conferido: boolean;
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
  criado_por_nome?: string;
  criado_em: string;
}

export interface ResumoMensal {
  apartamento: string;
  valor_condominio: number;
  fundo_reserva: number;
  valor_gas: number;
  total: number;
}

export interface EmailPermitido {
  id: number;
  email: string;
  apartamento: string;
  usado: boolean;
}
