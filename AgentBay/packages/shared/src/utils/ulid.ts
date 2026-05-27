import { ulid as _ulid } from 'ulid';

export function generateId(): string {
  return _ulid();
}

export function isValidId(id: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id);
}
