import { IPasswordEncoder } from './interfaces';

/**
 * default password encoder
 * actually doing nothing, you should implement one using hash algorithm
 */
export class NoopPasswordEncoder implements IPasswordEncoder {
  encode(rawPassword: string): string {
    return rawPassword;
  }

  matches(rawPassword: string, encodedPassword: string): boolean {
    return rawPassword === encodedPassword;
  }
}
