import { Request, Response } from 'express';
export declare const registrarLeitura: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const registrarLeiturasLote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarLeituras: (req: Request, res: Response) => Promise<void>;
export declare const obterLeituraApartamento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const obterHistoricoApartamento: (req: Request, res: Response) => Promise<void>;
export declare const obterRelatorioGeral: (req: Request, res: Response) => Promise<void>;
export declare const excluirLeitura: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=gasController.d.ts.map