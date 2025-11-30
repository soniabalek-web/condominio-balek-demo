import { Request, Response } from 'express';
export declare const salvarSaldoMensal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const obterSaldoMensal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const criarTransacao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarTransacoes: (req: Request, res: Response) => Promise<void>;
export declare const atualizarTransacao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const excluirTransacao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const calcularSaldo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const conferirSaldo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const mudarMesCobranca: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=bancoController.d.ts.map