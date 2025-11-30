import { Request, Response } from 'express';
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const registrarMorador: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adicionarEmailPermitido: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listarEmailsPermitidos: (req: Request, res: Response) => Promise<void>;
export declare const removerEmailPermitido: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verificarToken: (req: Request, res: Response) => void;
//# sourceMappingURL=authController.d.ts.map