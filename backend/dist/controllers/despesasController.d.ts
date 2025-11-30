import { Request, Response } from 'express';
export declare const listarCategorias: (req: Request, res: Response) => Promise<void>;
export declare const criarCategoria: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const atualizarCategoria: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const desativarCategoria: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarDespesasCondominio: (req: Request, res: Response) => Promise<void>;
export declare const salvarDespesaCondominio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const atualizarDespesaCondominio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const excluirDespesaCondominio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const criarDespesaParcelada: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarDespesasParceladas: (req: Request, res: Response) => Promise<void>;
export declare const atualizarStatusParcela: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const obterResumoMensal: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=despesasController.d.ts.map