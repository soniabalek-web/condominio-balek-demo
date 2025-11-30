import { Request, Response } from 'express';
export declare const listarCondominos: (req: Request, res: Response) => Promise<void>;
export declare const obterCondomino: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const atualizarCondomino: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const obterConfiguracoes: (req: Request, res: Response) => Promise<void>;
export declare const atualizarConfiguracao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const atualizarConfiguracoesBatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const obterFundoReserva: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=condominosController.d.ts.map