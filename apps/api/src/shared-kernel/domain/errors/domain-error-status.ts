// domain-error-status.ts
export const DomainErrorStatus = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
} as const;

export type DomainErrorStatus =
  (typeof DomainErrorStatus)[keyof typeof DomainErrorStatus];
