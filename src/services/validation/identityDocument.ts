import type { IdentityDocumentType } from "../../types/domain";

export const getDocumentLength = (type: IdentityDocumentType | null) =>
  type === "Carnet de extranjeria" ? 9 : 8;

export const sanitizeDocumentNumber = (value: string, type: IdentityDocumentType | null) =>
  value.replace(/\D/g, "").slice(0, getDocumentLength(type));

export const isValidDocumentNumber = (type: IdentityDocumentType | null, value: string) =>
  Boolean(type) && /^\d+$/.test(value) && value.length === getDocumentLength(type);
