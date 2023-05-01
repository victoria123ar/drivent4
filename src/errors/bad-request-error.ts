import { ApplicationError } from '@/protocols';

export function badRequest(): ApplicationError {
  return {
    name: 'BadRequestError',
    message: 'BadRequest',
  };
}