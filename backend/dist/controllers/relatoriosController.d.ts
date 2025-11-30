import { Request, Response } from 'express';
export declare const gerarExtratoBank: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const gerarRelatorioDespesas: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioGas: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioConfiguracoes: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioDespesasParceladas: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioHistoricoApartamento: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioDevedores: (req: Request, res: Response) => Promise<void>;
export declare const gerarRelatorioSindico: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const gerarRelatorioKondor: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=relatoriosController.d.ts.map