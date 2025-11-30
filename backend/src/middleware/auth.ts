import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      usuario?: JWTPayload;
    }
  }
}

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

export const verificarAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario?.tipo !== 'administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

export const verificarProprioUsuarioOuAdmin = (req: Request, res: Response, next: NextFunction) => {
  const apartamentoParam = req.params.apartamento;
  const isAdmin = req.usuario?.tipo === 'administrador';
  const isProprioApartamento = req.usuario?.apartamento === apartamentoParam;

  if (!isAdmin && !isProprioApartamento) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  next();
};
