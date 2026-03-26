import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

type ValidateBody = {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
};

export const validate = (schemas: ValidateBody) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as Query;
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params) as ParamsDictionary;
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
