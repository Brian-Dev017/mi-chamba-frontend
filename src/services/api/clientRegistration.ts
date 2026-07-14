import type { RegisteredClient, RegistrationDraft } from "../../types/domain";
import { isValidDocumentNumber } from "../validation/identityDocument";

const isSecurePassword = (value: string) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

const coordinatesToAddress = (latitude: number | null, longitude: number | null) => {
  if (latitude === null || longitude === null) {
    return "";
  }

  return `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
};

export async function registerClientInMemory(draft: RegistrationDraft): Promise<RegisteredClient> {
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const phone = draft.clientPhone.replace(/\D/g, "");
  const address = draft.clientAddress.trim() || coordinatesToAddress(draft.clientLatitude, draft.clientLongitude);
  const hasCoordinates = draft.clientLatitude !== null && draft.clientLongitude !== null;

  if (!firstName || !lastName) {
    throw new Error("Completa el nombre y apellido del cliente.");
  }

  if (!isValidDocumentNumber(draft.documentType, draft.documentNumber)) {
    throw new Error("Ingresa un documento de identidad valido.");
  }

  if (phone.length !== 9) {
    throw new Error("Ingresa un celular valido de 9 digitos.");
  }

  if (!isSecurePassword(draft.clientPassword) || draft.clientPassword !== draft.clientPasswordConfirmation) {
    throw new Error("Revisa la contrasena y su confirmacion.");
  }

  if ((draft.clientAddress.trim().length < 6 && !hasCoordinates) || !address) {
    throw new Error("Ingresa una ubicacion valida.");
  }

  if (!draft.clientPropertyType) {
    throw new Error("Selecciona el tipo de inmueble.");
  }

  return {
    id: `client-${draft.documentNumber}`,
    firstName,
    lastName,
    documentType: draft.documentType!,
    documentNumber: draft.documentNumber,
    phone,
    password: draft.clientPassword,
    address,
    latitude: draft.clientLatitude,
    longitude: draft.clientLongitude,
    propertyType: draft.clientPropertyType,
    referenceDetails: draft.clientReferenceDetails.trim()
  };
}
