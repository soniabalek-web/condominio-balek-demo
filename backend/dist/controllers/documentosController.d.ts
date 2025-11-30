import { Request, Response } from 'express';
export declare const uploadDocumento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarDocumentos: (req: Request, res: Response) => Promise<void>;
export declare const listarTodosDocumentos: (req: Request, res: Response) => Promise<void>;
export declare const obterDocumento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadDocumento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const excluirDocumento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const atualizarDocumento: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=documentosController.d.ts.map