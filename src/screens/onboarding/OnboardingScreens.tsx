import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import type { TextInputProps } from "react-native";
import { ResponsiveText as Text } from "../../components/ResponsiveText";
import {
  ConfirmationDialog,
  Ionicons,
  ScreenFrame,
  styles
} from "../../components/ui";
import type { ClientPropertyType, ScreenKey, ScreenRenderProps } from "../../types/domain";

const sanitizeLetters = (value: string) => value.replace(/[^A-Za-z\u00C0-\u017F\s]/g, "");
const sanitizeDigits = (value: string, maxLength: number) => value.replace(/\D/g, "").slice(0, maxLength);
const formatClientPhone = (value: string) => sanitizeDigits(value, 9).replace(/(\d{3})(?=\d)/g, "$1 ");
const formatReverseGeocodedAddress = (address: Location.LocationGeocodedAddress) => {
  const street = [address.streetNumber, address.street].filter(Boolean).join(" ").trim();
  const parts = [street || address.name, address.district, address.city, address.region].filter(
    (part, index, values): part is string => Boolean(part) && values.indexOf(part) === index
  );

  return parts.join(", ");
};

const isSecurePassword = (value: string) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

const formatBirthDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
};

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];

type IdentityDocumentType = "DNI" | "Carnet de extranjeria";
type DniSide = "ANVERSO" | "REVERSO";
type ProfessionalTrade = "Cerrajero" | "Plomero" | "Pintor" | "Gasfitero";

const identityDocumentOptions: IdentityDocumentType[] = ["DNI", "Carnet de extranjeria"];
const professionalTradeOptions: ProfessionalTrade[] = ["Cerrajero", "Plomero", "Pintor", "Gasfitero"];
const clientPropertyOptions: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: ClientPropertyType;
}> = [
  { icon: "home-outline", label: "Casa" },
  { icon: "business-outline", label: "Departamento" },
  { icon: "briefcase-outline", label: "Oficina" },
  { icon: "storefront-outline", label: "Local Comercial" },
  { icon: "business-outline", label: "Otros" }
];

type ExitIntent = {
  action: "cancel" | "back";
  target: ScreenKey;
} | null;

const formatDateForInput = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const getToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const getMaxAdultBirthDate = (today: Date) => {
  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() - 18);

  return maxDate;
};

const parseBirthDate = (value: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [dayText, monthText, yearText] = value.split("/");
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const validateBirthDate = (value: string, today: Date) => {
  if (!value) {
    return "Ingresa tu fecha de nacimiento";
  }

  if (value.length < 10) {
    return "Completa la fecha en formato DD/MM/YYYY";
  }

  const parsedDate = parseBirthDate(value);

  if (!parsedDate) {
    return "Ingresa una fecha valida";
  }

  if (parsedDate > today) {
    return "La fecha no puede ser mayor a la fecha actual";
  }

  if (parsedDate > getMaxAdultBirthDate(today)) {
    return "Debes ser mayor de 18 anos para registrarte";
  }

  return "";
};

const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const addYears = (date: Date, amount: number) => new Date(date.getFullYear() + amount, date.getMonth(), 1);

const getCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: Array<Date | null> = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};

const isSameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const isSameDate = (left: Date, right: Date) =>
  isSameMonth(left, right) && left.getDate() === right.getDate();

export function ClientPersonalInformationScreen({
  navigate,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const { clientPassword, clientPasswordConfirmation, clientPhone, firstName, lastName } = registrationDraft;
  const isPhoneValid = clientPhone.length === 9;
  const isPasswordValid = isSecurePassword(clientPassword);
  const doPasswordsMatch = clientPassword.length > 0 && clientPassword === clientPasswordConfirmation;
  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isPhoneValid &&
    isPasswordValid &&
    doPasswordsMatch;

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { action, target } = exitIntent;
    setExitIntent(null);

    if (action === "cancel") {
      resetRegistrationDraft();
    }

    navigate(target);
  };

  return (
    <View style={styles.screen}>
      <View style={local.personalTopBand} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={local.clientKeyboardArea}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={local.clientBodyScroll}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={local.keyboardScroll}
        >
          <View style={local.clientPersonalScreen}>
            <View style={local.personalHeader}>
              <View style={local.personalTitleBlock}>
                <Text style={local.personalTitle}>Información personal</Text>
                <View style={local.personalTitleUnderline} />
              </View>
              <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color="#111111" />
              </Pressable>
            </View>

            <Text style={local.clientIntro}>
              Ingresa tus datos principales para configurar tu cuenta de cliente.
            </Text>

            <View style={local.clientForm}>
              <PersonalField
                label="Nombre"
                onChangeText={(value) =>
                  setRegistrationDraft((currentDraft) => ({ ...currentDraft, firstName: sanitizeLetters(value) }))
                }
                placeholder="Juan Manuel"
                value={firstName}
              />
              <PersonalField
                label="Apellido"
                onChangeText={(value) =>
                  setRegistrationDraft((currentDraft) => ({ ...currentDraft, lastName: sanitizeLetters(value) }))
                }
                placeholder="Perez Fernandez"
                value={lastName}
              />
              <PersonalField
                inputMode="numeric"
                keyboardType="number-pad"
                label="Celular"
                maxLength={11}
                onChangeText={(value) =>
                  setRegistrationDraft((currentDraft) => ({ ...currentDraft, clientPhone: sanitizeDigits(value, 9) }))
                }
                placeholder="999 999 999"
                value={formatClientPhone(clientPhone)}
              />
              {clientPhone.length > 0 && !isPhoneValid ? (
                <Text style={local.clientValidationText}>Ingresa un celular de 9 números.</Text>
              ) : null}
              <PersonalField
                icon={showPassword ? "eye-off-outline" : "eye-outline"}
                label="Contraseña"
                onChangeText={(value) =>
                  setRegistrationDraft((currentDraft) => ({ ...currentDraft, clientPassword: value }))
                }
                onIconPress={() => setShowPassword((currentValue) => !currentValue)}
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                value={clientPassword}
              />
              <Text style={[local.passwordHelpText, clientPassword.length > 0 && !isPasswordValid && local.errorHelpText]}>
                Usa al menos 8 caracteres, una mayuscula, una minuscula y un numero por seguridad.
              </Text>
              <PersonalField
                icon={showPasswordConfirmation ? "eye-off-outline" : "eye-outline"}
                label="Repetir contraseña"
                onChangeText={(value) =>
                  setRegistrationDraft((currentDraft) => ({
                    ...currentDraft,
                    clientPasswordConfirmation: value
                  }))
                }
                onIconPress={() => setShowPasswordConfirmation((currentValue) => !currentValue)}
                placeholder="Repita su contraseña"
                secureTextEntry={!showPasswordConfirmation}
                value={clientPasswordConfirmation}
              />
              {clientPasswordConfirmation.length > 0 && !doPasswordsMatch ? (
                <Text style={local.clientValidationText}>Las contraseñas deben coincidir.</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
        <View style={local.personalFooter}>
        <View style={local.singleActionStepBlock}>
          <Text style={local.stepText}>Paso 1 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={local.personalStepBar} />
            <View style={local.personalStepBar} />
          </View>
        </View>
        <Pressable
          disabled={!canContinue}
          onPress={() => navigate("clientLocation")}
          style={[local.nextButton, !canContinue && local.nextButtonDisabled]}
        >
          <Text style={[local.nextButtonText, !canContinue && local.nextButtonTextDisabled]}>Siguiente</Text>
          <Ionicons name="play-forward" size={14} color={canContinue ? "#FFFFFF" : "#6D7B88"} />
        </Pressable>
        </View>
      </KeyboardAvoidingView>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

export function ClientLocationScreen({
  navigate,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const { clientAddress, clientLatitude, clientLongitude } = registrationDraft;
  const hasRealLocation = clientLatitude !== null && clientLongitude !== null;
  const coordinateText = hasRealLocation
    ? `${clientLatitude.toFixed(5)}, ${clientLongitude.toFixed(5)}`
    : "Ubicacion pendiente";
  const canContinue = clientAddress.trim().length >= 6 || hasRealLocation;

  const updateAddress = (value: string) => {
    setRegistrationDraft((currentDraft) => ({
      ...currentDraft,
      clientAddress: value,
      clientLatitude: null,
      clientLongitude: null
    }));
  };

  const updateResolvedAddress = (address: string, latitude: number, longitude: number) => {
    setRegistrationDraft((currentDraft) => ({
      ...currentDraft,
      clientAddress: address,
      clientLatitude: latitude,
      clientLongitude: longitude
    }));
  };

  const useCurrentLocation = async () => {
    setIsResolvingLocation(true);
    setLocationMessage("Obteniendo tu ubicacion actual...");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationMessage("Activa el permiso de ubicacion para usar tu direccion actual.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = position.coords;
      const coordinateFallback = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
      let resolvedAddress = coordinateFallback;

      try {
        const [geocodedAddress] = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geocodedAddress) {
          resolvedAddress = formatReverseGeocodedAddress(geocodedAddress) || coordinateFallback;
        }
      } catch {
        resolvedAddress = coordinateFallback;
      }

      updateResolvedAddress(resolvedAddress, latitude, longitude);
      setLocationMessage("Ubicacion detectada y asociada a tu perfil.");
    } catch {
      setLocationMessage("No se pudo obtener tu ubicacion. Intenta nuevamente.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { action, target } = exitIntent;
    setExitIntent(null);

    if (action === "cancel") {
      resetRegistrationDraft();
    }

    navigate(target);
  };

  return (
    <View style={styles.screen}>
      <View style={local.personalTopBand} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={local.clientKeyboardArea}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={local.clientBodyScroll}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={local.keyboardScroll}
        >
          <View style={local.clientLocationScreen}>
            <View style={local.personalHeader}>
              <View style={local.personalTitleBlock}>
                <Text style={local.personalTitle}>Ubicación</Text>
                <View style={local.personalTitleUnderline} />
              </View>
              <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color="#111111" />
              </Pressable>
            </View>

            <Text style={local.locationIntro}>Ingresa tu ubicación exacta donde se dará el servicio</Text>

            <View style={local.locationForm}>
              <View>
                <PersonalField
                  label="Ubicación exacta"
                  onChangeText={updateAddress}
                  placeholder="Referencia o direccion manual"
                  value={clientAddress}
                />
                {locationMessage ? <Text style={local.locationStatusText}>{locationMessage}</Text> : null}
              </View>

              <View style={local.locationDividerRow}>
                <View style={local.locationDividerLine} />
                <Text style={local.locationDividerText}>o</Text>
                <View style={local.locationDividerLine} />
              </View>

              <View style={local.mapPreview}>
                <View style={[local.mapRoad, local.mapRoadHorizontalTop]} />
                <View style={[local.mapRoad, local.mapRoadHorizontalBottom]} />
                <View style={[local.mapRoad, local.mapRoadVerticalLeft]} />
                <View style={[local.mapRoad, local.mapRoadVerticalRight]} />
                <View style={local.mapBlockLarge} />
                <View style={local.mapBlockSmall} />
                <View style={local.mapPinPulse}>
                  <View style={local.mapPin}>
                    <Ionicons name="location" size={22} color="#FFFFFF" />
                  </View>
                </View>
                <View style={local.mapLabel}>
                  <Text style={local.mapLabelTitle}>Punto de servicio</Text>
                  <Text style={local.mapLabelText}>
                    {hasRealLocation ? coordinateText : "Presiona usar mi ubicacion actual"}
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={isResolvingLocation}
                onPress={useCurrentLocation}
                style={({ pressed }) => [
                  local.currentLocationButton,
                  pressed && local.currentLocationButtonPressed,
                  isResolvingLocation && local.currentLocationButtonDisabled
                ]}
              >
                <Ionicons name="locate" size={22} color={isResolvingLocation ? "#6D7B88" : "#1976D2"} />
                <Text style={[local.currentLocationText, isResolvingLocation && local.currentLocationTextDisabled]}>
                  {isResolvingLocation ? "Buscando ubicacion..." : "Usar mi ubicacion actual"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <View style={local.identityFooter}>
        <View style={local.dualActionStepBlock}>
          <Text style={local.stepText}>Paso 2 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={local.personalStepBar} />
          </View>
        </View>
        <View style={[local.identityFooterActions, local.clientWizardFooterActions]}>
          <Pressable onPress={() => navigate("clientPersonalInformation")} style={local.backButton}>
            <Ionicons name="play-back" size={14} color="#FFFFFF" />
            <Text style={local.nextButtonText}>Regresar</Text>
          </Pressable>
          <Pressable
            disabled={!canContinue}
            onPress={() => navigate("clientPropertyType")}
            style={[local.identityNextButton, !canContinue && local.nextButtonDisabled]}
          >
            <Text style={[local.nextButtonText, !canContinue && local.nextButtonTextDisabled]}>Siguiente</Text>
            <Ionicons name="play-forward" size={14} color={canContinue ? "#FFFFFF" : "#6D7B88"} />
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

export function ClientPropertyTypeScreen({
  navigate,
  registerClient,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const { clientPropertyType, clientReferenceDetails } = registrationDraft;

  const handleConfirmExit = () => {
    setExitIntent(null);
    resetRegistrationDraft();
    navigate("login");
  };

  const finishRegistration = async () => {
    if (!clientPropertyType || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setRegistrationError("");

    try {
      await registerClient();
      resetRegistrationDraft();
      navigate("login");
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : "No se pudo completar el registro. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={local.personalTopBand} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={local.clientKeyboardArea}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={local.clientPropertyBodyScroll}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={local.keyboardScroll}
        >
          <View style={local.clientPropertyScreen}>
            <View style={local.personalHeader}>
              <View style={local.personalTitleBlock}>
                <Text style={local.personalTitle}>Tipo de inmueble</Text>
                <View style={local.personalTitleUnderline} />
              </View>
              <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color="#111111" />
              </Pressable>
            </View>

            <Text style={local.clientPropertyIntro}>
              Señala el tipo de lugar donde se realizará el servicio.
            </Text>

            <View style={local.clientPropertyPanel}>
              {clientPropertyOptions.map((option) => {
                const isSelected = clientPropertyType === option.label;

                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    key={option.label}
                    onPress={() =>
                      setRegistrationDraft((currentDraft) => ({
                        ...currentDraft,
                        clientPropertyType: option.label
                      }))
                    }
                    style={({ pressed }) => [
                      local.clientPropertyCard,
                      isSelected && local.clientPropertyCardSelected,
                      pressed && local.clientPropertyCardPressed
                    ]}
                  >
                    <View style={[local.clientPropertyIcon, isSelected && local.clientPropertyIconSelected]}>
                      <Ionicons name={option.icon} size={25} color={isSelected ? "#FFFFFF" : "#25364A"} />
                    </View>
                    <Text style={[local.clientPropertyLabel, isSelected && local.clientPropertyLabelSelected]}>
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <View style={local.clientPropertyCheck}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={local.clientReferenceBlock}>
              <Text style={local.personalFieldLabel}>Detalles de referencia</Text>
              <View style={local.clientReferenceShell}>
                <TextInput
                  maxLength={180}
                  multiline
                  numberOfLines={3}
                  onChangeText={(value) =>
                    setRegistrationDraft((currentDraft) => ({
                      ...currentDraft,
                      clientReferenceDetails: value
                    }))
                  }
                  placeholder="Ej: puerta azul, segundo piso (opcional)"
                  placeholderTextColor="#A5AFBA"
                  style={local.clientReferenceInput}
                  textAlignVertical="top"
                  value={clientReferenceDetails}
                />
              </View>
              <Text style={local.clientReferenceCount}>{clientReferenceDetails.length}/180</Text>
            </View>

            {registrationError ? (
              <View style={local.clientRegistrationError}>
                <Ionicons name="alert-circle-outline" size={18} color="#C92A2A" />
                <Text style={local.clientRegistrationErrorText}>{registrationError}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={!clientPropertyType || isSubmitting}
              onPress={finishRegistration}
              style={({ pressed }) => [
                local.clientFinishButton,
                (!clientPropertyType || isSubmitting) && local.clientFinishButtonDisabled,
                pressed && clientPropertyType && !isSubmitting && local.clientFinishButtonPressed
              ]}
            >
              {isSubmitting ? <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" /> : null}
              <Text
                style={[
                  local.clientFinishButtonText,
                  (!clientPropertyType || isSubmitting) && local.nextButtonTextDisabled
                ]}
              >
                {isSubmitting ? "Registrando..." : "Finalizar registro"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
        <View style={local.identityFooter}>
        <View style={local.dualActionStepBlock}>
          <Text style={local.stepText}>Paso 3 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
          </View>
        </View>
        <View style={[local.identityFooterActions, local.clientWizardFooterActions]}>
          <Pressable onPress={() => navigate("clientLocation")} style={local.backButton}>
            <Ionicons name="play-back" size={14} color="#FFFFFF" />
            <Text style={local.nextButtonText}>Regresar</Text>
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>

      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

export function PersonalInformationScreen({
  navigate,
  profilePhotoUri,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [birthDateTouched, setBirthDateTouched] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [showWorkerPassword, setShowWorkerPassword] = useState(false);
  const [showWorkerPasswordConfirmation, setShowWorkerPasswordConfirmation] = useState(false);
  const workerPersonalScrollRef = useRef<ScrollView | null>(null);
  const { birthDate, firstName, lastName, workerPassword, workerPasswordConfirmation } = registrationDraft;
  const today = getToday();
  const maxAdultBirthDate = getMaxAdultBirthDate(today);
  const selectedBirthDate = parseBirthDate(birthDate);
  const [calendarMonth, setCalendarMonth] = useState(selectedBirthDate ?? maxAdultBirthDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const birthDateError = birthDateTouched ? validateBirthDate(birthDate, today) : "";
  const isBirthDateValid = !validateBirthDate(birthDate, today);
  const isWorkerPasswordValid = isSecurePassword(workerPassword);
  const doWorkerPasswordsMatch = workerPassword.length > 0 && workerPassword === workerPasswordConfirmation;
  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    Boolean(profilePhotoUri) &&
    isBirthDateValid &&
    isWorkerPasswordValid &&
    doWorkerPasswordsMatch;

  const openCalendar = () => {
    setCalendarMonth(selectedBirthDate ?? maxAdultBirthDate);
    setIsCalendarOpen(true);
  };

  const handleBirthDateChange = (value: string) => {
    setBirthDateTouched(true);
    setRegistrationDraft((currentDraft) => ({ ...currentDraft, birthDate: formatBirthDate(value) }));
  };

  const handleCalendarSelect = (date: Date) => {
    setBirthDateTouched(true);
    setRegistrationDraft((currentDraft) => ({ ...currentDraft, birthDate: formatDateForInput(date) }));
    setIsCalendarOpen(false);
  };

  const focusWorkerCredentialField = (y: number) => {
    setTimeout(() => {
      workerPersonalScrollRef.current?.scrollTo({ y, animated: true });
    }, 120);
  };

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { action, target } = exitIntent;
    setExitIntent(null);

    if (action === "cancel") {
      resetRegistrationDraft();
    }

    navigate(target);
  };

  return (
    <View style={styles.screen}>
      <View style={local.personalTopBand} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={local.clientKeyboardArea}
      >
        <ScrollView
          ref={workerPersonalScrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={local.workerPersonalBodyScroll}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={local.keyboardScroll}
        >
          <View style={local.personalScreen}>
            <View style={local.personalHeader}>
              <View style={local.personalTitleBlock}>
                <Text style={local.personalTitle}>Informacion personal</Text>
                <View style={local.personalTitleUnderline} />
              </View>
              <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color="#111111" />
              </Pressable>
            </View>

            <Pressable onPress={() => navigate("profilePhotoInstructions")} style={local.avatarPicker}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={local.avatarPreview} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color="#1976D2" />
                  <Text style={local.avatarText}>Tomar foto</Text>
                </>
              )}
            </Pressable>
            <Text style={local.avatarCaption}>Agrega una foto de perfil</Text>
            <Text style={[local.requiredHint, profilePhotoUri && local.successHint]}>
              {profilePhotoUri ? "Foto cargada correctamente" : "Foto requerida para continuar"}
            </Text>

            <View style={local.personalForm}>
          <PersonalField
            label="Nombre"
            onChangeText={(value) =>
              setRegistrationDraft((currentDraft) => ({ ...currentDraft, firstName: sanitizeLetters(value) }))
            }
            placeholder="Juan Manuel"
            value={firstName}
          />
          <PersonalField
            label="Apellido"
            onChangeText={(value) =>
              setRegistrationDraft((currentDraft) => ({ ...currentDraft, lastName: sanitizeLetters(value) }))
            }
            placeholder="Perez Fernandez"
            value={lastName}
          />
          <PersonalField
            icon="calendar-outline"
            keyboardType="number-pad"
            label="Fecha de nacimiento"
            maxLength={10}
            onIconPress={openCalendar}
            onChangeText={handleBirthDateChange}
            placeholder="DD/MM/YYYY"
            value={birthDate}
          />
          {birthDateError ? <Text style={local.validationText}>{birthDateError}</Text> : null}
          <PersonalField
            icon={showWorkerPassword ? "eye-off-outline" : "eye-outline"}
            label="Contrasena"
            onChangeText={(value) =>
              setRegistrationDraft((currentDraft) => ({ ...currentDraft, workerPassword: value }))
            }
            onFocus={() => focusWorkerCredentialField(360)}
            onIconPress={() => setShowWorkerPassword((currentValue) => !currentValue)}
            placeholder="Ingrese su contrasena"
            secureTextEntry={!showWorkerPassword}
            value={workerPassword}
          />
          <Text style={[local.passwordHelpText, workerPassword.length > 0 && !isWorkerPasswordValid && local.errorHelpText]}>
            Usa al menos 8 caracteres, una mayuscula, una minuscula y un numero.
          </Text>
          <PersonalField
            icon={showWorkerPasswordConfirmation ? "eye-off-outline" : "eye-outline"}
            label="Repetir contrasena"
            onChangeText={(value) =>
              setRegistrationDraft((currentDraft) => ({
                ...currentDraft,
                workerPasswordConfirmation: value
              }))
            }
            onFocus={() => focusWorkerCredentialField(440)}
            onIconPress={() => setShowWorkerPasswordConfirmation((currentValue) => !currentValue)}
            placeholder="Repita su contrasena"
            secureTextEntry={!showWorkerPasswordConfirmation}
            value={workerPasswordConfirmation}
          />
          {workerPasswordConfirmation.length > 0 && !doWorkerPasswordsMatch ? (
            <Text style={local.validationText}>Las contrasenas deben coincidir.</Text>
          ) : null}
            </View>
          </View>
        </ScrollView>
        <View style={[local.personalFooter, local.workerPersonalFooter]}>
        <View style={[local.singleActionStepBlock, local.workerPersonalStepBlock]}>
          <Text style={local.stepText}>Paso 1 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={local.personalStepBar} />
            <View style={local.personalStepBar} />
          </View>
        </View>
        <Pressable
          disabled={!canContinue}
          onPress={() => navigate("identity")}
          style={[local.nextButton, local.workerPersonalNextButton, !canContinue && local.nextButtonDisabled]}
        >
          <Text style={[local.nextButtonText, !canContinue && local.nextButtonTextDisabled]}>Siguiente</Text>
          <Ionicons name="play-forward" size={14} color={canContinue ? "#FFFFFF" : "#6D7B88"} />
        </Pressable>
        </View>
      </KeyboardAvoidingView>
      <BirthDateCalendar
        maxDate={maxAdultBirthDate}
        month={calendarMonth}
        onChangeMonth={setCalendarMonth}
        onClose={() => setIsCalendarOpen(false)}
        onSelect={handleCalendarSelect}
        selectedDate={selectedBirthDate}
        visible={isCalendarOpen}
      />
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

function RegistrationExitConfirmation({
  intent,
  onCancel,
  onConfirm
}: {
  intent: ExitIntent;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isCanceling = intent?.action === "cancel";

  return (
    <ConfirmationDialog
      confirmLabel={isCanceling ? "Cancelar registro" : "Regresar"}
      message={
        isCanceling
          ? "Estas cancelando el registro. Si confirmas, se perdera la informacion ingresada."
          : "Estas regresando a un paso anterior. La informacion ingresada se mantendra guardada."
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={isCanceling ? "Cancelar registro?" : "Regresar al paso anterior?"}
      visible={Boolean(intent)}
    />
  );
}

function PersonalField({
  icon,
  inputMode,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  editable = true,
  onFocus,
  onIconPress,
  placeholder,
  secureTextEntry = false,
  value
}: {
  editable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  inputMode?: TextInputProps["inputMode"];
  keyboardType?: TextInputProps["keyboardType"];
  label: string;
  maxLength?: number;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  onIconPress?: () => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={local.personalFieldBlock}>
      <Text style={local.personalFieldLabel}>{label}</Text>
      <View style={[local.personalInputShell, !editable && local.personalInputShellDisabled]}>
        <TextInput
          editable={editable}
          inputMode={inputMode}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#B6BEC9"
          secureTextEntry={secureTextEntry}
          style={[local.personalInput, !editable && local.personalInputDisabled]}
          value={value}
        />
        {icon ? (
          <Pressable onPress={onIconPress} hitSlop={10}>
            <Ionicons name={icon} size={23} color="#1976D2" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BirthDateCalendar({
  maxDate,
  month,
  onChangeMonth,
  onClose,
  onSelect,
  selectedDate,
  visible
}: {
  maxDate: Date;
  month: Date;
  onChangeMonth: (date: Date) => void;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  visible: boolean;
}) {
  const calendarDays = getCalendarDays(month);
  const canGoNextMonth = addMonths(month, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const canGoNextYear = addYears(month, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={local.calendarOverlay}>
        <View style={local.calendarCard}>
          <View style={local.calendarHeader}>
            <Pressable onPress={() => onChangeMonth(addMonths(month, -1))} style={local.calendarNavButton}>
              <Ionicons name="chevron-back" size={22} color="#09243A" />
            </Pressable>
            <Text style={local.calendarTitle}>
              {monthLabels[month.getMonth()]} {month.getFullYear()}
            </Text>
            <Pressable
              disabled={!canGoNextMonth}
              onPress={() => onChangeMonth(addMonths(month, 1))}
              style={[local.calendarNavButton, !canGoNextMonth && local.calendarNavButtonDisabled]}
            >
              <Ionicons name="chevron-forward" size={22} color={canGoNextMonth ? "#09243A" : "#AEB7C2"} />
            </Pressable>
          </View>

          <View style={local.calendarYearRow}>
            <Pressable onPress={() => onChangeMonth(addYears(month, -1))} style={local.calendarYearButton}>
              <Text style={local.calendarYearText}>Ano anterior</Text>
            </Pressable>
            <Pressable
              disabled={!canGoNextYear}
              onPress={() => onChangeMonth(addYears(month, 1))}
              style={[local.calendarYearButton, !canGoNextYear && local.calendarYearButtonDisabled]}
            >
              <Text style={[local.calendarYearText, !canGoNextYear && local.calendarYearTextDisabled]}>
                Ano siguiente
              </Text>
            </Pressable>
          </View>

          <View style={local.weekdayRow}>
            {weekdayLabels.map((weekday, index) => (
              <Text key={`${weekday}-${index}`} style={local.weekdayText}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={local.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={local.calendarDay} />;
              }

              const isDisabled = day > maxDate;
              const isSelected = selectedDate ? isSameDate(day, selectedDate) : false;

              return (
                <Pressable
                  disabled={isDisabled}
                  key={day.toISOString()}
                  onPress={() => onSelect(day)}
                  style={[
                    local.calendarDay,
                    isSelected && local.calendarDaySelected,
                    isDisabled && local.calendarDayDisabled
                  ]}
                >
                  <Text
                    style={[
                      local.calendarDayText,
                      isSelected && local.calendarDayTextSelected,
                      isDisabled && local.calendarDayTextDisabled
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={local.calendarHelpText}>Selecciona una fecha hasta {formatDateForInput(maxDate)}.</Text>
          <Pressable onPress={onClose} style={local.calendarCloseButton}>
            <Text style={local.calendarCloseText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function IdentityScreen({
  backDniPhotoUri,
  frontDniPhotoUri,
  navigate,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [documentTouched, setDocumentTouched] = useState(false);
  const [isDocumentMenuOpen, setIsDocumentMenuOpen] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const documentType = registrationDraft.documentType;
  const documentNumber = registrationDraft.documentNumber;
  const expectedLength = documentType === "Carnet de extranjeria" ? 9 : 8;
  const documentLabel = documentType ?? "Seleccionar documento";
  const documentKeyboardType = Platform.select<TextInputProps["keyboardType"]>({
    ios: "number-pad",
    android: "numeric",
    default: "number-pad"
  });
  const documentNumberError =
    documentTouched && documentType && documentNumber.length !== expectedLength
      ? `${documentType} debe tener ${expectedLength} numeros`
      : "";
  const canContinue = Boolean(documentType) && documentNumber.length === expectedLength;

  const handleDocumentTypeSelect = (selectedType: IdentityDocumentType) => {
    setRegistrationDraft((currentDraft) => ({
      ...currentDraft,
      documentType: selectedType,
      documentNumber: ""
    }));
    setDocumentTouched(false);
    setIsDocumentMenuOpen(false);
  };

  const handleDocumentNumberChange = (value: string) => {
    setDocumentTouched(true);
    setRegistrationDraft((currentDraft) => ({
      ...currentDraft,
      documentNumber: value.replace(/\D/g, "").slice(0, expectedLength)
    }));
  };

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { action, target } = exitIntent;
    setExitIntent(null);

    if (action === "cancel") {
      resetRegistrationDraft();
    }

    navigate(target);
  };

  return (
    <ScreenFrame noPadding scrollable={false}>
      <View style={local.personalTopBand} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={local.identityKeyboardArea}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={local.identityScreen}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={local.keyboardScroll}
        >
          <View style={local.personalHeader}>
            <View style={local.personalTitleBlock}>
              <Text style={local.personalTitle}>Cedula de identidad</Text>
              <View style={local.personalTitleUnderline} />
            </View>
            <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
              <Ionicons name="close-circle" size={24} color="#111111" />
            </Pressable>
          </View>

          <View style={local.identityDocumentPhotoRow}>
            <IdentityPhotoUpload label="Anverso" onPress={() => navigate("frontDniInstructions")} photoUri={frontDniPhotoUri} />
            <IdentityPhotoUpload label="Reverso" onPress={() => navigate("backDniInstructions")} photoUri={backDniPhotoUri} />
          </View>

          <View style={local.identityForm}>
            <View style={local.personalFieldBlock}>
              <Text style={local.personalFieldLabel}>Tipo de documento</Text>
              <Pressable onPress={() => setIsDocumentMenuOpen(true)} style={local.identitySelectShell}>
                <Text style={[local.identitySelectText, !documentType && local.identitySelectPlaceholder]}>
                  {documentLabel}
                </Text>
                <Ionicons name="chevron-down" size={22} color="#B6BEC9" />
              </Pressable>
            </View>

            <PersonalField
              editable={Boolean(documentType)}
              inputMode="numeric"
              keyboardType={documentKeyboardType}
              label="Numero de documento"
              maxLength={expectedLength}
              onChangeText={handleDocumentNumberChange}
              placeholder={
                documentType
                  ? documentType === "Carnet de extranjeria"
                    ? "Ej: 123456789"
                    : "Ej: 12345678"
                  : "Selecciona primero el tipo"
              }
              value={documentNumber}
            />
            {documentNumberError ? <Text style={local.validationText}>{documentNumberError}</Text> : null}
          </View>

          <View style={local.identityInfoPill}>
            <Ionicons name="information-circle-outline" size={20} color="#00A6FF" />
            <View style={local.identityInfoCopy}>
              <Text style={local.identityInfoTitle}>Al momento de tomar la foto:</Text>
              <Text style={local.identityInfoText}>
                Asegurate de que sea clara y que todos los datos sean legibles para evitar retrasos en tu verificacion.
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={[local.identityFooter, local.workerIdentityFooter]}>
        <View style={local.dualActionStepBlock}>
          <Text style={local.stepText}>Paso 2 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={local.personalStepBar} />
          </View>
        </View>
        <View style={local.identityFooterActions}>
          <Pressable onPress={() => setExitIntent({ action: "back", target: "personalInformation" })} style={local.backButton}>
            <Ionicons name="play-back" size={14} color="#FFFFFF" />
            <Text style={local.nextButtonText}>Regresar</Text>
          </Pressable>
          <Pressable
            disabled={!canContinue}
            onPress={() => navigate("professionalInformation")}
            style={[local.identityNextButton, !canContinue && local.nextButtonDisabled]}
          >
            <Text style={[local.nextButtonText, !canContinue && local.nextButtonTextDisabled]}>Siguiente</Text>
            <Ionicons name="play-forward" size={14} color={canContinue ? "#FFFFFF" : "#6D7B88"} />
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={isDocumentMenuOpen} onRequestClose={() => setIsDocumentMenuOpen(false)}>
        <Pressable style={local.documentMenuOverlay} onPress={() => setIsDocumentMenuOpen(false)}>
          <View style={local.documentMenuCard}>
            <Text style={local.documentMenuTitle}>Tipo de documento</Text>
            {identityDocumentOptions.map((option) => (
              <Pressable key={option} onPress={() => handleDocumentTypeSelect(option)} style={local.documentMenuOption}>
                <Text style={local.documentMenuOptionText}>{option}</Text>
                {documentType === option ? <Ionicons name="checkmark" size={20} color="#1976D2" /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </ScreenFrame>
  );
}

export function ProfessionalInformationScreen({
  navigate,
  registerWorker,
  registrationDraft,
  resetRegistrationDraft,
  setRegistrationDraft
}: ScreenRenderProps) {
  const [isTradeMenuOpen, setIsTradeMenuOpen] = useState(false);
  const [certificateTouched, setCertificateTouched] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const trade = registrationDraft.professionalTrade;
  const certificateUri = registrationDraft.certificateUri;

  const handleTradeSelect = (selectedTrade: ProfessionalTrade) => {
    setRegistrationDraft((currentDraft) => ({ ...currentDraft, professionalTrade: selectedTrade }));
    setIsTradeMenuOpen(false);
  };

  const handlePickCertificate = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setCertificateTouched(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: "images",
      quality: 0.9
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setRegistrationDraft((currentDraft) => ({ ...currentDraft, certificateUri: result.assets[0].uri }));
      setCertificateTouched(true);
    }
  };

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { action, target } = exitIntent;
    setExitIntent(null);

    if (action === "cancel") {
      resetRegistrationDraft();
    }

    navigate(target);
  };

  return (
    <ScreenFrame noPadding scrollable={false}>
      <View style={local.personalTopBand} />
      <View style={local.professionalScreen}>
        <View style={local.personalHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>Informacion profesional</Text>
            <View style={local.personalTitleUnderline} />
          </View>
          <Pressable onPress={() => setExitIntent({ action: "cancel", target: "login" })} hitSlop={10}>
            <Ionicons name="close-circle" size={24} color="#111111" />
          </Pressable>
        </View>

        <Text style={local.professionalIntro}>
          Completa los detalles de tu especialidad para que los clientes puedan encontrarte facilmente.
        </Text>

        <View style={local.professionalCard}>
          <View style={local.personalFieldBlock}>
            <Text style={local.personalFieldLabel}>Oficio</Text>
            <Pressable onPress={() => setIsTradeMenuOpen(true)} style={local.identitySelectShell}>
              <Text style={[local.identitySelectText, !trade && local.identitySelectPlaceholder]}>
                {trade ?? "Seleccionar una ocupacion"}
              </Text>
              <Ionicons name="chevron-down" size={22} color="#B6BEC9" />
            </Pressable>
          </View>

          <View style={local.personalFieldBlock}>
            <Text style={local.personalFieldLabel}>Subir certificado (Opcional)</Text>
            <Pressable
              onPress={handlePickCertificate}
              style={({ pressed }) => [
                local.certificateUploadBox,
                certificateUri && local.certificateUploadBoxFilled,
                pressed && local.certificateUploadBoxPressed
              ]}
            >
              <Ionicons
                name={certificateUri ? "checkmark-circle-outline" : "cloud-upload-outline"}
                size={34}
                color="#1976D2"
              />
              <Text style={[local.certificateUploadText, certificateUri && local.certificateUploadTextFilled]}>
                {certificateUri
                  ? "Certificado agregado correctamente"
                  : "Toca aqui para subir tu certificado o dejalo en blanco si no tienes uno"}
              </Text>
            </Pressable>
          </View>

          <View style={local.professionalInfoRow}>
            <Ionicons name="information-circle-outline" size={16} color="#4F5965" />
            <Text style={local.professionalInfoText}>
              Los certificados aumentan tus probabilidades de ser contratado.
            </Text>
          </View>
          {certificateTouched && !certificateUri ? (
            <Text style={local.professionalOptionalText}>Puedes continuar sin certificado.</Text>
          ) : null}
        </View>
      </View>

      <View style={local.professionalFooter}>
        <Pressable
          disabled={!trade}
          onPress={() => {
            registerWorker();
            navigate("workerConfirmation");
          }}
          style={[local.finishRegistrationButton, !trade && local.finishRegistrationButtonDisabled]}
        >
          <Text style={[local.finishRegistrationText, !trade && local.nextButtonTextDisabled]}>
            Finalizar registro
          </Text>
        </Pressable>
        <View style={local.dualActionStepBlock}>
          <Text style={local.stepText}>Paso 3 de 3</Text>
          <View style={local.personalStepRow}>
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
            <View style={[local.personalStepBar, local.personalStepBarActive]} />
          </View>
        </View>
        <Pressable
          onPress={() => setExitIntent({ action: "back", target: "identity" })}
          style={[local.backButton, local.professionalBackButton]}
        >
          <Ionicons name="play-back" size={15} color="#FFFFFF" />
          <Text style={local.nextButtonText}>Regresar</Text>
        </Pressable>
      </View>

      <Modal animationType="fade" transparent visible={isTradeMenuOpen} onRequestClose={() => setIsTradeMenuOpen(false)}>
        <Pressable style={local.documentMenuOverlay} onPress={() => setIsTradeMenuOpen(false)}>
          <View style={local.documentMenuCard}>
            <Text style={local.documentMenuTitle}>Selecciona tu oficio</Text>
            {professionalTradeOptions.map((option) => (
              <Pressable key={option} onPress={() => handleTradeSelect(option)} style={local.documentMenuOption}>
                <Text style={local.documentMenuOptionText}>{option}</Text>
                {trade === option ? <Ionicons name="checkmark" size={20} color="#1976D2" /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </ScreenFrame>
  );
}

export function DocumentInstruction({
  navigate,
  setPendingDniPhotoUri,
  side
}: ScreenRenderProps & { side: "FRONTAL" | "TRASERA" }) {
  const isFront = side === "FRONTAL";
  const confirmationKey = isFront ? "frontDniConfirmation" : "backDniConfirmation";
  const cameraKey = isFront ? "frontDniCamera" : "backDniCamera";
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { target } = exitIntent;
    setExitIntent(null);
    navigate(target);
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 10],
      mediaTypes: "images",
      quality: 0.9
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPendingDniPhotoUri(result.assets[0].uri);
      navigate(confirmationKey);
    }
  };

  return (
    <ScreenFrame noPadding scrollable={false}>
      <View style={local.personalTopBand} />
      <View style={local.documentInstructionScreen}>
        <View style={local.personalHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>Cedula de identidad</Text>
            <View style={local.personalTitleUnderline} />
          </View>
          <Pressable
            onPress={() => setExitIntent({ action: "back", target: "identity" })}
            hitSlop={10}
            style={local.headerBackButton}
          >
            <Ionicons name="chevron-back" size={22} color="#09243A" />
          </Pressable>
        </View>

        <View style={local.documentInstructionBullets}>
          <InstructionBullet text={`Carga la parte ${side} del documento de identificacion`} />
          <InstructionBullet text="Asegurese de que la foto sea legible" />
        </View>

        <View style={local.referenceBlock}>
          <Text style={local.documentCaption}>Imagen referencial</Text>
          <DocumentMock side={isFront ? "front" : "back"} />
        </View>
      </View>

      <View style={local.documentInstructionFooter}>
        <Pressable onPress={() => navigate(cameraKey)} style={local.takeDocumentPhotoButton}>
          <Text style={local.takeDocumentPhotoText}>Tomar Foto</Text>
        </Pressable>
        <Pressable onPress={handlePickFromGallery} style={local.pickDocumentButton}>
          <Text style={local.pickDocumentButtonText}>Elegir de la galeria</Text>
        </Pressable>
      </View>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </ScreenFrame>
  );
}

export function DocumentCameraScreen({
  navigate,
  setPendingDniPhotoUri,
  side
}: ScreenRenderProps & { side: DniSide }) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState("");
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const confirmationKey = side === "ANVERSO" ? "frontDniConfirmation" : "backDniConfirmation";
  const instructionKey = side === "ANVERSO" ? "frontDniInstructions" : "backDniInstructions";

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { target } = exitIntent;
    setExitIntent(null);
    navigate(target);
  };

  const handleTakePhoto = async () => {
    setCameraError("");

    if (!permission?.granted) {
      const requestedPermission = await requestPermission();

      if (!requestedPermission.granted) {
        setCameraError("Necesitamos permiso de camara para tomar la foto del documento.");
        return;
      }
    }

    try {
      setIsTakingPhoto(true);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: false
      });

      if (photo?.uri) {
        setPendingDniPhotoUri(photo.uri);
        navigate(confirmationKey);
      }
    } catch {
      setCameraError("No se pudo tomar la foto. Intentalo nuevamente.");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  return (
    <View style={local.documentCameraScreen}>
      {!permission?.granted ? (
        <View style={local.cameraPermissionPanel}>
          <Ionicons name="camera-outline" size={44} color="#1976D2" />
          <Text style={local.cameraPermissionTitle}>Permiso de camara</Text>
          <Text style={local.cameraPermissionText}>
            Necesitamos activar la camara para tomar la foto de tu documento.
          </Text>
          <Pressable onPress={requestPermission} style={local.cameraPermissionButton}>
            <Text style={local.cameraPermissionButtonText}>Permitir camara</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={local.documentCameraOverlay}>
        <Pressable
          onPress={() => setExitIntent({ action: "back", target: instructionKey })}
          style={local.cameraCloseButton}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>

        <View style={local.cameraBrand}>
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
          <Text style={local.cameraBrandText}>Mi Chamba ID</Text>
        </View>

        <Text style={local.documentCameraTitle}>Ubica la parte {side} dentro del marco</Text>
        <Text style={local.documentCameraSubtitle}>Evita reflejos y asegurate de que los datos sean legibles</Text>

        <View style={local.documentCameraFrame}>
          {permission?.granted ? (
            <View style={local.documentCameraViewport}>
              <CameraView ref={cameraRef} active facing="back" style={local.documentCameraPreview} />
            </View>
          ) : null}
          <View style={local.documentCameraBorder} />
          <View style={[local.documentCorner, local.documentCornerTopLeft]} />
          <View style={[local.documentCorner, local.documentCornerTopRight]} />
          <View style={[local.documentCorner, local.documentCornerBottomLeft]} />
          <View style={[local.documentCorner, local.documentCornerBottomRight]} />
        </View>

        {cameraError ? <Text style={local.cameraLiveErrorText}>{cameraError}</Text> : null}

        <View style={local.cameraActionArea}>
          <Pressable
            disabled={isTakingPhoto}
            onPress={handleTakePhoto}
            style={[local.cameraCaptureButton, isTakingPhoto && local.cameraCaptureButtonDisabled]}
          >
            <View style={local.cameraCaptureInner} />
          </Pressable>
          <Text style={local.cameraCaptureLabel}>{isTakingPhoto ? "Tomando foto..." : "Tomar foto"}</Text>
        </View>
      </View>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

export function DocumentConfirmation({
  navigate,
  pendingDniPhotoUri,
  setBackDniPhotoUri,
  setFrontDniPhotoUri,
  setPendingDniPhotoUri,
  side
}: ScreenRenderProps & { side: DniSide }) {
  const isFront = side === "ANVERSO";
  const cameraKey = isFront ? "frontDniCamera" : "backDniCamera";
  const title = isFront ? "Verifica el frente de tu documento" : "Verifica el reverso de tu documento";
  const helperText = isFront
    ? "Asegurate de que el numero de DNI y tu nombre sean legibles"
    : "Asegurate de que el codigo y los datos posteriores sean legibles";

  const handleUsePhoto = () => {
    if (!pendingDniPhotoUri) {
      return;
    }

    if (isFront) {
      setFrontDniPhotoUri(pendingDniPhotoUri);
    } else {
      setBackDniPhotoUri(pendingDniPhotoUri);
    }

    setPendingDniPhotoUri(null);
    navigate("identity");
  };

  const handleRetakePhoto = () => {
    setPendingDniPhotoUri(null);
    navigate(cameraKey);
  };

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.documentConfirmScreen}>
        <View style={local.documentConfirmHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>{title}</Text>
            <View style={local.personalTitleUnderline} />
          </View>
        </View>

        <Text style={local.documentConfirmHint}>{helperText}</Text>

        <View style={local.documentPhotoPreviewWrap}>
          <View style={local.documentSidePill}>
            <Text style={local.documentSidePillText}>{side}</Text>
          </View>
          {pendingDniPhotoUri ? (
            <Image resizeMode="cover" source={{ uri: pendingDniPhotoUri }} style={local.documentCapturedImage} />
          ) : (
            <DocumentMock side={isFront ? "front" : "back"} />
          )}
        </View>

        <View style={local.documentValidRow}>
          <View style={local.photoValidIcon}>
            <Ionicons name="checkmark" size={15} color="#1976D2" />
          </View>
          <Text style={local.documentValidText}>Documento legible</Text>
        </View>
      </View>

      <View style={local.documentConfirmFooter}>
        <Pressable
          disabled={!pendingDniPhotoUri}
          onPress={handleUsePhoto}
          style={[local.usePhotoButton, !pendingDniPhotoUri && local.usePhotoButtonDisabled]}
        >
          <Text style={local.usePhotoButtonText}>Usar esta foto</Text>
        </Pressable>
        <Pressable onPress={handleRetakePhoto} style={local.retakePhotoButton}>
          <Text style={local.retakePhotoButtonText}>Tomar otra foto</Text>
        </Pressable>
      </View>
    </ScreenFrame>
  );
}

export function ProfilePhotoInstructionsScreen({ navigate }: ScreenRenderProps) {
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { target } = exitIntent;
    setExitIntent(null);
    navigate(target);
  };

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.photoInstructionScreen}>
        <View style={local.personalHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>Su foto de perfil</Text>
            <View style={local.personalTitleUnderline} />
          </View>
          <Pressable
            onPress={() => setExitIntent({ action: "back", target: "personalInformation" })}
            hitSlop={10}
            style={local.photoConfirmClose}
          >
            <Ionicons name="chevron-back" size={22} color="#09243A" />
          </Pressable>
        </View>

        <Text style={local.photoIntro}>
          Para validar tu identidad y generar confianza con tus futuros clientes.
        </Text>

        <View style={local.photoBulletBlock}>
          <PhotoBullet text="Tomar una buena selfie" />
          <PhotoBullet text="Asegurese de que tu rostro este completamente visible" />
          <PhotoBullet text="No use gorra, ni lentes de sol" />
        </View>

        <View style={local.faceGuide}>
          <View style={[local.scanCorner, local.scanCornerTopLeft]} />
          <View style={[local.scanCorner, local.scanCornerTopRight]} />
          <View style={[local.scanCorner, local.scanCornerBottomLeft]} />
          <View style={[local.scanCorner, local.scanCornerBottomRight]} />
          <View style={local.faceOval}>
            <View style={local.faceIconHead} />
            <View style={local.faceIconBody} />
          </View>
        </View>

        <View style={local.photoInfoPill}>
          <Ionicons name="information-circle-outline" size={19} color="#00A6FF" />
          <Text style={local.photoInfoText}>
            Su foto sera revisada manualmente por nuestro equipo de soporte para asegurar que cumpla con los
            estandares de seguridad de Mi Chamba.
          </Text>
        </View>

      </View>

      <View style={local.photoFooter}>
        <Pressable onPress={() => navigate("profilePhotoCamera")} style={local.takePhotoButton}>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={local.takePhotoText}>Tomar Foto</Text>
        </Pressable>
      </View>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </ScreenFrame>
  );
}

export function ProfilePhotoCameraScreen({ navigate, setPendingProfilePhotoUri }: ScreenRenderProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState("");
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { target } = exitIntent;
    setExitIntent(null);
    navigate(target);
  };

  const handleTakePhoto = async () => {
    setCameraError("");

    if (!permission?.granted) {
      const requestedPermission = await requestPermission();

      if (!requestedPermission.granted) {
        setCameraError("Necesitamos permiso de camara para validar tu identidad.");
        return;
      }
    }

    try {
      setIsTakingPhoto(true);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        skipProcessing: false
      });

      if (photo?.uri) {
        setPendingProfilePhotoUri(photo.uri);
        navigate("profilePhotoConfirmation");
      }
    } catch {
      setCameraError("No se pudo tomar la foto. Intentalo nuevamente.");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  return (
    <View style={local.cameraScreen}>
      {!permission?.granted ? (
        <View style={local.cameraPermissionPanel}>
          <Ionicons name="camera-outline" size={44} color="#1976D2" />
          <Text style={local.cameraPermissionTitle}>Permiso de camara</Text>
          <Text style={local.cameraPermissionText}>
            Necesitamos activar la camara para tomar tu foto y validar tu identidad.
          </Text>
          <Pressable onPress={requestPermission} style={local.cameraPermissionButton}>
            <Text style={local.cameraPermissionButtonText}>Permitir camara</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={local.cameraOverlay}>
        <Pressable
          onPress={() => setExitIntent({ action: "back", target: "profilePhotoInstructions" })}
          style={local.cameraCloseButton}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>

        <View style={local.cameraBrand}>
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
          <Text style={local.cameraBrandText}>Mi Chamba ID</Text>
        </View>

        <Text style={local.cameraTitle}>Ubica tu rostro en el marco,{"\n"}sin lentes, gorras o accesorios</Text>

        <View style={local.cameraFaceGuide}>
          {permission?.granted ? (
            <View style={local.cameraOvalViewport}>
              <CameraView ref={cameraRef} active facing="front" mirror style={local.cameraOvalPreview} />
            </View>
          ) : null}
          <View style={local.cameraFaceOval} />
          <View style={local.cameraFaceOvalGlow} />
        </View>

        {cameraError ? <Text style={local.cameraLiveErrorText}>{cameraError}</Text> : null}

        <View style={local.cameraActionArea}>
          <Pressable
            disabled={isTakingPhoto}
            onPress={handleTakePhoto}
            style={[local.cameraCaptureButton, isTakingPhoto && local.cameraCaptureButtonDisabled]}
          >
            <View style={local.cameraCaptureInner} />
          </Pressable>
          <Text style={local.cameraCaptureLabel}>{isTakingPhoto ? "Tomando foto..." : "Tomar foto"}</Text>
        </View>
      </View>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </View>
  );
}

export function ProfilePhotoConfirmationScreen({
  navigate,
  pendingProfilePhotoUri,
  setPendingProfilePhotoUri,
  setProfilePhotoUri
}: ScreenRenderProps) {
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const handleUsePhoto = () => {
    if (pendingProfilePhotoUri) {
      setProfilePhotoUri(pendingProfilePhotoUri);
      setPendingProfilePhotoUri(null);
      navigate("personalInformation");
    }
  };

  const handleRetakePhoto = () => {
    setPendingProfilePhotoUri(null);
    navigate("profilePhotoCamera");
  };

  const handleConfirmExit = () => {
    if (!exitIntent) {
      return;
    }

    const { target } = exitIntent;
    setExitIntent(null);
    navigate(target);
  };

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.photoConfirmScreen}>
        <View style={local.photoConfirmHeader}>
          <Text style={local.photoConfirmTitle}>Te gusta tu foto?</Text>
          <Pressable
            onPress={() => setExitIntent({ action: "back", target: "personalInformation" })}
            hitSlop={10}
            style={local.headerBackButton}
          >
            <Ionicons name="chevron-back" size={22} color="#09243A" />
          </Pressable>
        </View>

        <Text style={local.photoConfirmSubtitle}>Esta foto sera visible para tus clientes</Text>

        <View style={local.photoPreviewRing}>
          {pendingProfilePhotoUri ? (
            <Image resizeMode="cover" source={{ uri: pendingProfilePhotoUri }} style={local.photoPreviewImage} />
          ) : (
            <View style={local.photoPreviewFallback}>
              <Ionicons name="person-outline" size={92} color="#D6DEE8" />
            </View>
          )}
        </View>

        <View style={local.photoValidRow}>
          <View style={local.photoValidIcon}>
            <Ionicons name="checkmark" size={15} color="#1976D2" />
          </View>
          <Text style={local.photoValidText}>Foto valida</Text>
        </View>
      </View>

      <View style={local.photoConfirmFooter}>
        <Pressable
          disabled={!pendingProfilePhotoUri}
          onPress={handleUsePhoto}
          style={[local.usePhotoButton, !pendingProfilePhotoUri && local.usePhotoButtonDisabled]}
        >
          <Text style={local.usePhotoButtonText}>Usar esta foto</Text>
        </Pressable>
        <Pressable onPress={handleRetakePhoto} style={local.retakePhotoButton}>
          <Text style={local.retakePhotoButtonText}>Tomar otra foto</Text>
        </Pressable>
      </View>
      <RegistrationExitConfirmation
        intent={exitIntent}
        onCancel={() => setExitIntent(null)}
        onConfirm={handleConfirmExit}
      />
    </ScreenFrame>
  );
}

export function WorkerConfirmationScreen({ navigate, resetRegistrationDraft }: ScreenRenderProps) {
  const checkScale = useRef(new Animated.Value(0.82)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true
      })
    ]).start();

    const redirectTimer = setTimeout(() => {
      resetRegistrationDraft();
      navigate("login");
    }, 2200);

    return () => clearTimeout(redirectTimer);
  }, [checkScale, contentOpacity, navigate, resetRegistrationDraft]);

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <Animated.View style={[local.registrationSuccessScreen, { opacity: contentOpacity }]}>
        <Text style={local.successTitle}>Registro exitoso!</Text>
        <Animated.View style={[local.successIcon, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={92} color="#FFFFFF" />
        </Animated.View>
        <Text style={local.successSubtitle}>A chambear!</Text>
      </Animated.View>
    </ScreenFrame>
  );
}

function DocumentUpload({ label }: { label: string }) {
  return (
    <View style={local.documentUpload}>
      <Ionicons name="camera-outline" size={30} color="#1976D2" />
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.captionText}>Tomar foto</Text>
    </View>
  );
}

function IdentityPhotoUpload({ label, onPress, photoUri }: { label: string; onPress: () => void; photoUri: string | null }) {
  return (
    <View style={local.identityPhotoBlock}>
      <Pressable onPress={onPress} style={({ pressed }) => [local.identityPhotoBox, pressed && local.identityPhotoBoxPressed]}>
        {photoUri ? (
          <Image resizeMode="cover" source={{ uri: photoUri }} style={local.identityPhotoPreview} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={28} color="#1976D2" />
            <Text style={local.avatarText}>Tomar foto</Text>
          </>
        )}
      </Pressable>
      <Text style={local.identityPhotoLabel}>{label}</Text>
    </View>
  );
}

function DocumentMock({ side }: { side: "front" | "back" }) {
  if (side === "back") {
    return (
      <View style={local.dniMockCard}>
        <View style={local.dniMinimalGlow} />
        <View style={local.dniBackTopRow}>
          <View style={local.dniBackStamp}>
            <Text style={local.dniBackStampText}>Constancia{"\n"}de Sufragio</Text>
          </View>
          <View style={local.dniBackStamp}>
            <Text style={local.dniBackStampText}>Constancia{"\n"}de Sufragio</Text>
          </View>
          <View style={local.dniBackStamp}>
            <Text style={local.dniBackStampText}>Constancia{"\n"}de Sufragio</Text>
          </View>
          <View style={local.dniBackStamp}>
            <Text style={local.dniBackStampText}>Grupo de{"\n"}Votacion</Text>
          </View>
          <View style={local.dniBarcode}>
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineWide]} />
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineNarrow]} />
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineMedium]} />
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineNarrow]} />
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineWide]} />
            <View style={[local.dniBarcodeLine, local.dniBarcodeLineMedium]} />
          </View>
        </View>
        <View style={local.dniBackInfoRow}>
          <View style={local.dniChip} />
          <View style={local.dniBackCopy}>
            <View style={[local.dniDataLine, local.dniBackLineLong]} />
            <Text style={local.dniBackText}>AV. LOS ALAMOS 245 - LIMA</Text>
            <View style={[local.dniDataLine, local.dniBackLineMid]} />
            <Text style={local.dniBackText}>SOLTERO</Text>
          </View>
        </View>
        <View style={local.dniMrzBlock}>
          <Text style={local.dniMrzText}>I&lt;PER41326541&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</Text>
          <Text style={local.dniMrzText}>8709281F2701016PER&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</Text>
          <Text style={local.dniMrzText}>VARGAS&lt;&lt;GIOVANNA&lt;LORENA&lt;&lt;&lt;&lt;</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={local.dniMockCard}>
      <View style={local.dniMinimalGlow} />
      <View style={local.dniHeaderRow}>
        <View style={local.dniSeal}>
          <Text style={local.dniSealPlaceholderText}></Text>
        </View>
        <View>
          <Text style={local.dniCountry}>REPUBLICA DEL PERU</Text>
          <Text style={local.dniSubtitle}>DOCUMENTO NACIONAL DE</Text>
          <Text style={local.dniSubtitle}>IDENTIDAD DNI</Text>
        </View>
        <View style={local.dniCuiBlock}>
          <View style={local.dniHeaderLine} />
          <View style={[local.dniHeaderLine, local.dniHeaderLineShort]} />
        </View>
      </View>
      <View style={local.dniMinimalBody}>
        <View style={local.dniMinimalLeft}>
          <Text style={local.dniNumberText}>41326541</Text>
          <View style={local.dniChipLarge} />
        </View>
        <View style={local.dniMinimalCenter}>
          <View style={[local.dniDataLine, local.dniDataLineShort]} />
          <View style={local.dniDataLine} />
          <View style={[local.dniDataLine, local.dniDataLineMid]} />
          <View style={local.dniDataLine} />
          <View style={[local.dniDataLine, local.dniDataLineMid]} />
          <View style={[local.dniDataLine, local.dniDataLineTiny]} />
        </View>
        <View style={local.dniMinimalRight}>
          <View style={local.dniPortraitMinimal}>
            <Ionicons name="person" size={46} color="#73777C" />
          </View>
          <View style={local.dniSignatureMark}>
            <View style={local.dniSignatureStrokeTall} />
            <View style={local.dniSignatureStrokeCurve} />
            <View style={local.dniSignatureDot} />
          </View>
        </View>
      </View>
    </View>
  );
}

function InstructionBullet({ text }: { text: string }) {
  return (
    <View style={local.instructionBulletRow}>
      <Ionicons name="checkmark-circle" size={21} color="#1976D2" />
      <Text style={local.instructionBulletText}>{text}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={local.bulletRow}>
      <Ionicons name="checkmark-circle-outline" size={20} color="#1976D2" />
      <Text style={styles.bodyText}>{text}</Text>
    </View>
  );
}

function PhotoBullet({ text }: { text: string }) {
  return (
    <View style={local.photoBulletRow}>
      <Ionicons name="checkmark-circle-outline" size={21} color="#1976D2" />
      <Text style={local.photoBulletText}>{text}</Text>
    </View>
  );
}

const local = {
  personalTopBand: {
    height: 42,
    marginTop: -3,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  clientKeyboardArea: {
    flex: 1,
    backgroundColor: "#F4F7FB"
  },
  keyboardScroll: {
    flex: 1
  },
  clientBodyScroll: {
    flexGrow: 1
  },
  workerPersonalBodyScroll: {
    flexGrow: 1,
    paddingBottom: 16
  },
  clientPersonalScreen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    minHeight: 564
  },
  clientLocationScreen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    minHeight: 564
  },
  clientPropertyBodyScroll: {
    flexGrow: 1,
    paddingBottom: 18
  },
  clientPropertyScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    minHeight: 564
  },
  clientIntro: {
    color: "#596472",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600" as const,
    marginTop: 2,
    marginBottom: 50,
    maxWidth: 220
  },
  clientForm: {
    gap: 21
  },
  clientValidationText: {
    color: "#C92A2A",
    fontSize: 11,
    fontWeight: "700" as const,
    marginTop: -14
  },
  passwordHelpText: {
    color: "#6D7B88",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600" as const,
    marginTop: -17,
    paddingLeft: 10,
    maxWidth: 270
  },
  errorHelpText: {
    color: "#C92A2A"
  },
  locationIntro: {
    color: "#596472",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600" as const,
    marginTop: 18,
    marginBottom: 28,
    maxWidth: 290
  },
  clientPropertyIntro: {
    color: "#596472",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600" as const,
    marginTop: 2,
    marginBottom: 22,
    maxWidth: 300
  },
  clientPropertyPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D5DCE5",
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    shadowColor: "#09243A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  clientPropertyCard: {
    width: "48%" as const,
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D2D8E0",
    backgroundColor: "#FBFCFE",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 7,
    position: "relative" as const
  },
  clientPropertyCardSelected: {
    borderColor: "#1976D2",
    borderWidth: 2,
    backgroundColor: "#EAF4FF"
  },
  clientPropertyCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }]
  },
  clientPropertyIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#EEF2F6",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  clientPropertyIconSelected: {
    backgroundColor: "#1976D2"
  },
  clientPropertyLabel: {
    color: "#25364A",
    fontSize: 12,
    fontWeight: "800" as const,
    textAlign: "center" as const
  },
  clientPropertyLabelSelected: {
    color: "#0A5CAF"
  },
  clientPropertyCheck: {
    position: "absolute" as const,
    right: 8,
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1976D2",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  clientReferenceBlock: {
    marginTop: 20,
    gap: 6
  },
  clientReferenceShell: {
    minHeight: 78,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 10
  },
  clientReferenceInput: {
    minHeight: 54,
    color: "#09243A",
    fontSize: 14,
    lineHeight: 19,
    padding: 0
  },
  clientReferenceCount: {
    color: "#7B8794",
    fontSize: 10,
    fontWeight: "700" as const,
    textAlign: "right" as const
  },
  clientRegistrationError: {
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8
  },
  clientRegistrationErrorText: {
    flex: 1,
    color: "#A61E1E",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700" as const
  },
  clientFinishButton: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#00A6FF",
    backgroundColor: "#021B30",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  clientFinishButtonDisabled: {
    borderColor: "#CBD5E1",
    backgroundColor: "#D6DEE8"
  },
  clientFinishButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  clientFinishButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800" as const
  },
  locationForm: {
    gap: 22
  },
  locationStatusText: {
    color: "#596472",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700" as const,
    marginTop: 8,
    paddingHorizontal: 6
  },
  locationDividerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10
  },
  locationDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#C4C6CD"
  },
  locationDividerText: {
    color: "#25364A",
    fontSize: 13,
    fontWeight: "600" as const
  },
  mapPreview: {
    height: 156,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#BBD8FF",
    backgroundColor: "#EAF4FF",
    overflow: "hidden" as const,
    position: "relative" as const
  },
  mapRoad: {
    position: "absolute" as const,
    backgroundColor: "rgba(255, 255, 255, 0.86)"
  },
  mapRoadHorizontalTop: {
    left: -18,
    right: -18,
    top: 42,
    height: 16,
    transform: [{ rotate: "-9deg" }]
  },
  mapRoadHorizontalBottom: {
    left: -18,
    right: -18,
    bottom: 34,
    height: 18,
    transform: [{ rotate: "7deg" }]
  },
  mapRoadVerticalLeft: {
    top: -18,
    bottom: -18,
    left: 70,
    width: 16,
    transform: [{ rotate: "14deg" }]
  },
  mapRoadVerticalRight: {
    top: -18,
    bottom: -18,
    right: 78,
    width: 18,
    transform: [{ rotate: "-12deg" }]
  },
  mapBlockLarge: {
    position: "absolute" as const,
    left: 18,
    top: 72,
    width: 86,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(25, 118, 210, 0.11)"
  },
  mapBlockSmall: {
    position: "absolute" as const,
    right: 18,
    top: 22,
    width: 74,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(2, 27, 48, 0.08)"
  },
  mapPinPulse: {
    position: "absolute" as const,
    left: "50%" as const,
    top: 49,
    width: 64,
    height: 64,
    marginLeft: -32,
    borderRadius: 32,
    backgroundColor: "rgba(25, 118, 210, 0.16)",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  mapPin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1976D2",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 3,
    borderColor: "#FFFFFF"
  },
  mapLabel: {
    position: "absolute" as const,
    left: 14,
    right: 14,
    bottom: 12,
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  mapLabelTitle: {
    color: "#1976D2",
    fontSize: 11,
    fontWeight: "900" as const
  },
  mapLabelText: {
    color: "#25364A",
    fontSize: 11,
    fontWeight: "700" as const
  },
  currentLocationButton: {
    minHeight: 45,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1976D2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 9
  },
  currentLocationButtonPressed: {
    backgroundColor: "#EAF4FF",
    opacity: 0.9
  },
  currentLocationButtonDisabled: {
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F4F8"
  },
  currentLocationText: {
    color: "#1976D2",
    fontSize: 13,
    fontWeight: "900" as const
  },
  currentLocationTextDisabled: {
    color: "#6D7B88"
  },
  personalScreen: {
    paddingHorizontal: 28,
    paddingTop: 10,
    minHeight: 564
  },
  personalHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const,
    marginBottom: 22
  },
  personalTitleBlock: { gap: 5 },
  personalTitle: {
    color: "#09243A",
    fontSize: 20,
    fontWeight: "400" as const
  },
  personalTitleUnderline: {
    width: 42,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#09243A"
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#EAF4FF"
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: "#1976D2",
    backgroundColor: "#F7FAFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    alignSelf: "center" as const,
    gap: 4
  },
  avatarText: {
    color: "#1976D2",
    fontSize: 12,
    fontWeight: "500" as const
  },
  avatarPreview: {
    width: "100%" as const,
    height: "100%" as const,
    borderRadius: 13
  },
  avatarCaption: {
    color: "#09243A",
    fontSize: 15,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 8,
    marginBottom: 6
  },
  requiredHint: {
    color: "#6D7B88",
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: 18
  },
  successHint: {
    color: "#1976D2"
  },
  personalForm: { gap: 22 },
  personalFieldBlock: { gap: 4 },
  personalFieldLabel: {
    color: "#09243A",
    fontSize: 13,
    fontWeight: "800" as const
  },
  personalInputShell: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    flexDirection: "row" as const,
    alignItems: "center" as const
  },
  personalInputShellDisabled: {
    borderColor: "#C9D1DB",
    backgroundColor: "#F1F4F8"
  },
  personalInput: {
    flex: 1,
    color: "#09243A",
    fontSize: 15,
    paddingVertical: 0
  },
  personalInputDisabled: {
    color: "#7B8794"
  },
  validationText: {
    color: "#C92A2A",
    fontSize: 12,
    fontWeight: "700" as const,
    marginTop: -14
  },
  personalFooter: {
      minHeight: 124,
      borderTopWidth: 1,
      borderTopColor: "#CFD5DD",
      backgroundColor: "#FFFFFF",
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 20,
      position: "relative" as const
    },
  workerPersonalFooter: {
      minHeight: 0,
      height: 76,
      paddingTop: 0,
      paddingBottom: 0
    },
  workerPersonalStepBlock: {
      top: 10
    },
  singleActionStepBlock: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      top: 38,
      alignItems: "center" as const
    },
  dualActionStepBlock: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      top: 10,
      alignItems: "center" as const
    },
  stepText: {
    color: "#25364A",
    fontSize: 12,
    textAlign: "center" as const,
    marginBottom: 8
  },
  personalStepRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 4
  },
  personalStepBar: {
    width: 36,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#C4C6CD"
  },
  personalStepBarActive: { backgroundColor: "#1976D2" },
  nextButton: {
      position: "absolute" as const,
      right: 20,
      bottom: 58,
      minHeight: 34,
      minWidth: 94,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#00A6FF",
    backgroundColor: "#021B30",
    paddingHorizontal: 12,
    flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 4
    },
  workerPersonalNextButton: {
    minHeight: 34,
    bottom: 8
  },
  nextButtonDisabled: {
      borderColor: "#CBD5E1",
      backgroundColor: "#D6DEE8"
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const
  },
  nextButtonTextDisabled: { color: "#6D7B88" },
  identityScreen: {
    paddingHorizontal: 20,
    paddingTop: 14,
    minHeight: 564
  },
  identityKeyboardArea: {
    flex: 1
  },
  identityDocumentPhotoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginTop: 24,
    marginBottom: 32
  },
  identityPhotoBlock: {
    alignItems: "center" as const,
    gap: 26
  },
  identityPhotoBox: {
    width: 102,
    height: 102,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: "#1976D2",
    backgroundColor: "#F7FAFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4
  },
  identityPhotoBoxPressed: {
    backgroundColor: "#EAF4FF",
    borderColor: "#00A6FF",
    opacity: 0.82,
    transform: [{ scale: 0.96 }]
  },
  identityPhotoPreview: {
    width: "100%" as const,
    height: "100%" as const,
    borderRadius: 11
  },
  identityPhotoLabel: {
    color: "#09243A",
    fontSize: 15,
    fontWeight: "800" as const
  },
  identityForm: {
    gap: 20,
    marginBottom: 38
  },
  identitySelectShell: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const
  },
  identitySelectText: {
    color: "#09243A",
    fontSize: 15,
    fontWeight: "600" as const
  },
  identitySelectPlaceholder: {
    color: "#B6BEC9",
    fontWeight: "500" as const
  },
  identityInfoPill: {
    minHeight: 102,
    borderRadius: 26,
    backgroundColor: "#C5C8D0",
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10
  },
  identityInfoCopy: {
    flex: 1,
    gap: 10
  },
  identityInfoTitle: {
    color: "#5D6570",
    fontSize: 12,
    fontWeight: "700" as const
  },
  identityInfoText: {
    color: "#4F5965",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600" as const
  },
  identityFooter: {
      minHeight: 124,
      borderTopWidth: 1,
      borderTopColor: "#CFD5DD",
      backgroundColor: "#FFFFFF",
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 20,
      position: "relative" as const
    },
  workerIdentityFooter: {
      marginTop: 26
    },
  identityFooterActions: {
      position: "absolute" as const,
      left: 20,
      right: 20,
      bottom: 58,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const
    },
  clientWizardFooterActions: {
    bottom: 14
  },
    backButton: {
      minHeight: 34,
      minWidth: 92,
      borderRadius: 18,
      borderWidth: 1,
    borderColor: "#00A6FF",
    backgroundColor: "#021B30",
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4
  },
  identityNextButton: {
      minHeight: 34,
      minWidth: 94,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#00A6FF",
    backgroundColor: "#021B30",
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4
  },
  documentMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 27, 48, 0.45)",
    justifyContent: "center" as const,
    padding: 24
  },
  documentMenuCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 6
  },
  documentMenuTitle: {
    color: "#09243A",
    fontSize: 16,
    fontWeight: "900" as const,
    marginBottom: 4
  },
  documentMenuOption: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#F7FAFF"
  },
  documentMenuOptionText: {
    color: "#09243A",
    fontSize: 14,
    fontWeight: "800" as const
  },
  professionalScreen: {
    paddingHorizontal: 15,
    paddingTop: 14,
    minHeight: 564
  },
  professionalIntro: {
    color: "#303A45",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500" as const,
    marginTop: 18,
    marginBottom: 36
  },
  professionalCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 17
  },
  certificateUploadBox: {
    minHeight: 148,
    borderRadius: 29,
    borderWidth: 2,
    borderStyle: "dashed" as const,
    borderColor: "#1976D2",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 28,
    gap: 8
  },
  certificateUploadBoxPressed: {
    backgroundColor: "#EAF4FF",
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  },
  certificateUploadBoxFilled: {
    borderStyle: "solid" as const,
    backgroundColor: "#F5FBFF"
  },
  certificateUploadText: {
    color: "#B6BEC9",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800" as const,
    textAlign: "center" as const
  },
  certificateUploadTextFilled: {
    color: "#1976D2"
  },
  professionalInfoRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 7,
    marginTop: -8
  },
  professionalInfoText: {
    flex: 1,
    color: "#4F5965",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600" as const
  },
  professionalOptionalText: {
    color: "#6D7B88",
    fontSize: 11,
    fontWeight: "700" as const,
    marginTop: -10
  },
  professionalFooter: {
      marginTop: 24,
      minHeight: 140,
      borderTopWidth: 1,
      borderTopColor: "#CFD5DD",
      backgroundColor: "#FFFFFF",
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 20,
      position: "relative" as const
    },
  finishRegistrationButton: {
      position: "absolute" as const,
      right: 20,
      bottom: 58,
      minHeight: 34,
      minWidth: 96,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#00A6FF",
      backgroundColor: "#021B30",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: 12
    },
  finishRegistrationButtonDisabled: {
    backgroundColor: "#D6DEE8"
  },
  finishRegistrationText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700" as const
    },
    professionalBackButton: {
      position: "absolute" as const,
      left: 20,
      bottom: 58
    },
  documentInstructionScreen: {
    paddingHorizontal: 20,
    paddingTop: 14,
    minHeight: 590
  },
  documentInstructionBullets: {
    gap: 14,
    marginTop: 32
  },
  instructionBulletRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12
  },
  instructionBulletText: {
    flex: 1,
    color: "#09243A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800" as const
  },
  referenceBlock: {
    alignItems: "center" as const,
    marginTop: 86
  },
  documentInstructionFooter: {
    minHeight: 144,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    gap: 8
  },
  takeDocumentPhotoButton: {
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  takeDocumentPhotoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900" as const
  },
  pickDocumentButton: {
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  pickDocumentButtonText: {
    color: "#09243A",
    fontSize: 14,
    fontWeight: "800" as const
  },
  documentCameraScreen: {
    flex: 1,
    backgroundColor: "#2F343A"
  },
  documentCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 24, 28, 0.78)",
    alignItems: "center" as const,
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 30
  },
  documentCameraTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900" as const,
    textAlign: "center" as const,
    marginTop: 52
  },
  documentCameraSubtitle: {
    color: "#EAF2FA",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center" as const,
    marginTop: 8,
    maxWidth: 260
  },
  documentCameraFrame: {
    width: "100%" as const,
    maxWidth: 330,
    height: 238,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const,
    marginTop: 74
  },
  documentCameraViewport: {
    width: "92.7%" as const,
    maxWidth: 306,
    height: 194,
    borderRadius: 14,
    overflow: "hidden" as const,
    backgroundColor: "#20252B"
  },
  documentCameraPreview: {
    width: "100%" as const,
    height: "100%" as const
  },
  documentCameraBorder: {
    position: "absolute" as const,
    width: "92.7%" as const,
    maxWidth: 306,
    height: 194,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed" as const,
    borderColor: "#12D1C4"
  },
  documentCorner: {
    position: "absolute" as const,
    width: 38,
    height: 38,
    borderColor: "#00A6FF"
  },
  documentCornerTopLeft: {
    top: 10,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 16
  },
  documentCornerTopRight: {
    top: 10,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 16
  },
  documentCornerBottomLeft: {
    bottom: 10,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 16
  },
  documentCornerBottomRight: {
    bottom: 10,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 16
  },
  documentConfirmScreen: {
    paddingHorizontal: 20,
    paddingTop: 14,
    minHeight: 548
  },
  documentConfirmHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const
  },
  documentConfirmHint: {
    color: "#303A45",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600" as const,
    marginTop: 16
  },
  documentPhotoPreviewWrap: {
    marginTop: 86,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const
  },
  documentSidePill: {
    position: "absolute" as const,
    left: 24,
    top: -18,
    zIndex: 2,
    borderRadius: 11,
    backgroundColor: "#1976D2",
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  documentSidePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900" as const
  },
  documentCapturedImage: {
    width: 320,
    height: 202,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8D0D9",
    backgroundColor: "#F8FBFD"
  },
  documentValidRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 24
  },
  documentValidText: {
    color: "#00A6FF",
    fontSize: 15,
    fontWeight: "600" as const
  },
  documentConfirmFooter: {
    minHeight: 158,
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 14,
    backgroundColor: "#FFFFFF"
  },
  dniMockCard: {
    width: 320,
    minHeight: 198,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B7C2CE",
    backgroundColor: "#F8FCFE",
    overflow: "hidden" as const,
    padding: 7,
    position: "relative" as const
  },
  dniMinimalGlow: {
    position: "absolute" as const,
    left: 76,
    bottom: 20,
    width: 146,
    height: 110,
    borderRadius: 60,
    backgroundColor: "rgba(129, 224, 231, 0.24)"
  },
  dniHeaderLine: {
    width: 118,
    height: 5,
    borderRadius: 2,
    backgroundColor: "#A7B3BE"
  },
  dniHeaderLineShort: {
    width: 104,
    marginTop: 8
  },
  dniMinimalBody: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    position: "relative" as const,
    paddingTop: 14,
    gap: 14
  },
  dniMinimalLeft: {
    width: 78,
    alignItems: "center" as const,
    gap: 14
  },
  dniNumberText: {
    alignSelf: "flex-start" as const,
    color: "#111820",
    fontSize: 9,
    fontWeight: "900" as const
  },
  dniChipLarge: {
    width: 58,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#D9AA55",
    borderWidth: 1,
    borderColor: "#C99743"
  },
  dniMinimalCenter: {
    flex: 1,
    gap: 13,
    paddingTop: 12
  },
  dniDataLine: {
    height: 7,
    width: 88,
    borderRadius: 2,
    backgroundColor: "#AEB8C2"
  },
  dniDataLineShort: {
    width: 58
  },
  dniDataLineMid: {
    width: 76
  },
  dniDataLineTiny: {
    width: 38
  },
  dniMinimalRight: {
    width: 72,
    alignItems: "center" as const,
    gap: 18,
    paddingTop: 2
  },
  dniPortraitMinimal: {
    width: 70,
    height: 72,
    borderRadius: 2,
    backgroundColor: "#EEF0F2",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  dniSignatureMark: {
    width: 38,
    height: 30,
    position: "relative" as const
  },
  dniSignatureStrokeTall: {
    position: "absolute" as const,
    left: 13,
    top: 1,
    width: 3,
    height: 26,
    borderRadius: 2,
    backgroundColor: "#9AA2AA",
    transform: [{ rotate: "-12deg" }]
  },
  dniSignatureStrokeCurve: {
    position: "absolute" as const,
    left: 10,
    top: 12,
    width: 24,
    height: 15,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#9AA2AA",
    borderBottomLeftRadius: 14,
    transform: [{ rotate: "-24deg" }]
  },
  dniSignatureDot: {
    position: "absolute" as const,
    right: 3,
    top: 13,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9AA2AA"
  },
  dniWatermarkCircle: {
    position: "absolute" as const,
    right: 86,
    bottom: 18,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(199, 231, 244, 0.52)"
  },
  dniWatermarkBand: {
    position: "absolute" as const,
    left: 104,
    bottom: 0,
    width: 112,
    height: 128,
    backgroundColor: "rgba(188, 227, 240, 0.26)",
    transform: [{ rotate: "-18deg" }]
  },
  dniHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#C8D0D9",
    paddingBottom: 4
  },
  dniSeal: {
    width: 30,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: "#9AA6B2",
    backgroundColor: "#F1F4F8",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  dniSealPlaceholderText: {
    color: "#6D7B88",
    fontSize: 8,
    fontWeight: "900" as const
  },
  dniCountry: {
    color: "#111820",
    fontSize: 13,
    fontWeight: "900" as const
  },
  dniSubtitle: {
    color: "#4F5965",
    fontSize: 6,
    fontWeight: "800" as const
  },
  dniCuiBlock: {
    marginLeft: "auto" as const,
    alignItems: "flex-end" as const
  },
  dniMiniLabel: {
    color: "#66717E",
    fontSize: 6.5,
    fontWeight: "900" as const
  },
  dniCuiText: {
    color: "#29313A",
    fontSize: 14,
    fontWeight: "900" as const
  },
  dniBodyRow: {
    flexDirection: "row" as const,
    gap: 8,
    paddingTop: 10
  },
  dniLeftPanel: {
    alignItems: "center" as const,
    gap: 3
  },
  dniPortrait: {
    width: 78,
    height: 88,
    borderRadius: 4,
    backgroundColor: "#E8EDF2",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  dniSignatureLine: {
    width: 44,
    height: 1,
    backgroundColor: "#29313A",
    marginTop: 1
  },
  dniSignatureText: {
    color: "#29313A",
    fontSize: 6,
    fontWeight: "900" as const
  },
  dniData: {
    flex: 1,
    gap: 1,
    zIndex: 1
  },
  dniStrongText: {
    color: "#29313A",
    fontSize: 8.5,
    fontWeight: "900" as const
  },
  dniTinyText: {
    color: "#303A45",
    fontSize: 7.4,
    fontWeight: "800" as const
  },
  dniDataGrid: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 3,
    gap: 7
  },
  dniRightPanel: {
    width: 48,
    alignItems: "center" as const,
    gap: 9
  },
  dniSmallPortrait: {
    width: 44,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8EDF2",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  dniCameraMark: {
    width: 26,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#9B4E93",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  dniBackTopRow: {
    flexDirection: "row" as const,
    gap: 4,
    alignItems: "stretch" as const,
    position: "relative" as const,
    zIndex: 1
  },
  dniBackStamp: {
    flex: 1,
    minHeight: 36,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C7D0D9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255, 255, 255, 0.78)"
  },
  dniBackStampText: {
    color: "#4E5A65",
    fontSize: 5.5,
    lineHeight: 7.5,
    textAlign: "center" as const,
    fontWeight: "800" as const
  },
  dniBarcode: {
    width: 20,
    minHeight: 36,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "#C7D0D9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 2
  },
  dniBarcodeLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "#343A40"
  },
  dniBarcodeLineNarrow: {
    width: 2
  },
  dniBarcodeLineMedium: {
    width: 4
  },
  dniBarcodeLineWide: {
    width: 6
  },
  dniBackInfoRow: {
    flexDirection: "row" as const,
    gap: 13,
    marginTop: 16,
    alignItems: "center" as const,
    position: "relative" as const,
    zIndex: 1
  },
  dniChip: {
    width: 58,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#D9AA55",
    borderWidth: 1,
    borderColor: "#C99743"
  },
  dniBackCopy: {
    flex: 1,
    gap: 5
  },
  dniBackLineLong: {
    width: 142
  },
  dniBackLineMid: {
    width: 92
  },
  dniBackText: {
    color: "#26313B",
    fontSize: 8,
    fontWeight: "900" as const
  },
  dniMrzBlock: {
    marginTop: 18,
    gap: 3,
    position: "relative" as const,
    zIndex: 1
  },
  dniMrzText: {
    color: "#111820",
    fontSize: 10.8,
    letterSpacing: 0.7,
    fontWeight: "800" as const
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 27, 48, 0.55)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 18
  },
  calendarCard: {
    width: "100%" as const,
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 14
  },
  calendarHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const
  },
  calendarTitle: {
    color: "#09243A",
    fontSize: 18,
    fontWeight: "900" as const
  },
  calendarNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF6FF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  calendarNavButtonDisabled: { backgroundColor: "#F1F3F5" },
  calendarYearRow: {
    flexDirection: "row" as const,
    gap: 8
  },
  calendarYearButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#EEF6FF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  calendarYearButtonDisabled: { backgroundColor: "#F1F3F5" },
  calendarYearText: {
    color: "#1976D2",
    fontSize: 12,
    fontWeight: "800" as const
  },
  calendarYearTextDisabled: { color: "#9AA6B2" },
  weekdayRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const
  },
  weekdayText: {
    width: 40,
    color: "#6D7B88",
    fontSize: 12,
    fontWeight: "800" as const,
    textAlign: "center" as const
  },
  calendarGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    rowGap: 6
  },
  calendarDay: {
    width: "14.285%" as const,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 18
  },
  calendarDaySelected: { backgroundColor: "#021B30" },
  calendarDayDisabled: { opacity: 0.35 },
  calendarDayText: {
    color: "#09243A",
    fontSize: 14,
    fontWeight: "700" as const
  },
  calendarDayTextSelected: { color: "#FFFFFF" },
  calendarDayTextDisabled: { color: "#9AA6B2" },
  calendarHelpText: {
    color: "#506070",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center" as const
  },
  calendarCloseButton: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5484D",
    backgroundColor: "#FFF5F5",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  calendarCloseText: {
    color: "#C92A2A",
    fontSize: 13,
    fontWeight: "800" as const
  },
  photoInstructionScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4
  },
  photoIntro: {
    color: "#25364A",
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
    marginBottom: 14,
    fontWeight: "600" as const
  },
  photoBulletBlock: {
    gap: 14,
    marginBottom: 24
  },
  photoBulletRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12
  },
  photoBulletText: {
    flex: 1,
    color: "#09243A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800" as const
  },
  faceGuide: {
    width: 230,
    height: 230,
    alignSelf: "center" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const,
    marginTop: 2,
    marginBottom: 24
  },
  faceOval: {
    width: 172,
    height: 200,
    borderRadius: 86,
    borderWidth: 2,
    borderColor: "#B5D5FA",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  faceIconHead: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#1976D2",
    marginBottom: 18
  },
  faceIconBody: {
    width: 86,
    height: 48,
    borderTopLeftRadius: 43,
    borderTopRightRadius: 43,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: "#1976D2"
  },
  scanCorner: {
    position: "absolute" as const,
    width: 30,
    height: 30,
    borderColor: "#1976D2"
  },
  scanCornerTopLeft: {
    top: 6,
    left: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 26
  },
  scanCornerTopRight: {
    top: 6,
    right: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 26
  },
  scanCornerBottomLeft: {
    bottom: 6,
    left: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 26
  },
  scanCornerBottomRight: {
    bottom: 6,
    right: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 26
  },
  photoInfoPill: {
    minHeight: 72,
    borderRadius: 36,
    backgroundColor: "#C5C8D0",
    paddingHorizontal: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 9
  },
  photoInfoText: {
    flex: 1,
    color: "#5D6570",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600" as const
  },
  cameraErrorText: {
    color: "#C92A2A",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800" as const,
    textAlign: "center" as const,
    marginTop: 10
  },
  photoFooter: {
    height: 90,
    borderTopWidth: 1,
    borderTopColor: "#E0E5EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 8
  },
  takePhotoButton: {
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: "#021B30",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12
  },
  takePhotoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800" as const
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: "#3C4147"
  },
  cameraPermissionPanel: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 24,
    backgroundColor: "#F5F8FC",
    gap: 12
  },
  cameraPermissionTitle: {
    color: "#09243A",
    fontSize: 20,
    fontWeight: "900" as const
  },
  cameraPermissionText: {
    color: "#506070",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center" as const
  },
  cameraPermissionButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#021B30",
    paddingHorizontal: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 8
  },
  cameraPermissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800" as const
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 24, 28, 0.78)",
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 30
  },
  cameraCloseButton: {
    position: "absolute" as const,
    top: 30,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  cameraBrand: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 5,
    minHeight: 26
  },
  cameraBrandText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900" as const,
    opacity: 0.92
  },
  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 56,
    opacity: 0.9
  },
  cameraFaceGuide: {
    width: "100%" as const,
    maxWidth: 296,
    height: 382,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const,
    marginTop: 10
  },
  cameraOvalViewport: {
    width: 260,
    height: 340,
    borderRadius: 130,
    overflow: "hidden" as const,
    backgroundColor: "#20252B"
  },
  cameraOvalPreview: {
    width: "100%" as const,
    height: "100%" as const
  },
  cameraFaceOval: {
    position: "absolute" as const,
    width: 260,
    height: 340,
    borderRadius: 130,
    borderWidth: 4,
    borderStyle: "dashed" as const,
    borderColor: "#12D1C4",
    backgroundColor: "transparent"
  },
  cameraFaceOvalGlow: {
    position: "absolute" as const,
    width: 274,
    height: 354,
    borderRadius: 137,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)"
  },
  cameraLiveErrorText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800" as const,
    textAlign: "center" as const,
    backgroundColor: "rgba(201, 42, 42, 0.88)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden" as const
  },
  cameraActionArea: {
    marginTop: "auto" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12
  },
  cameraCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  cameraCaptureButtonDisabled: { opacity: 0.62 },
  cameraCaptureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF"
  },
  cameraCaptureLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900" as const
  },
  photoConfirmScreen: {
    paddingHorizontal: 20,
    paddingTop: 18,
    minHeight: 502,
    alignItems: "center" as const
  },
  photoConfirmHeader: {
    width: "100%" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const
  },
  photoConfirmClose: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#EAF4FF"
  },
  photoConfirmTitle: {
    color: "#09243A",
    fontSize: 18,
    fontWeight: "500" as const,
    textAlign: "center" as const
  },
  photoConfirmSubtitle: {
    color: "#6D7480",
    fontSize: 15,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 12,
    marginBottom: 26
  },
  photoPreviewRing: {
    width: 172,
    height: 222,
    borderRadius: 86,
    backgroundColor: "#FFFFFF",
    borderWidth: 7,
    borderColor: "#F3F5F8",
    overflow: "hidden" as const,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  photoPreviewImage: {
    width: 158,
    height: 208,
    borderRadius: 79
  },
  photoPreviewFallback: {
    width: 158,
    height: 208,
    borderRadius: 79,
    backgroundColor: "#F1F5F9",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  photoValidRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 9,
    marginTop: 18
  },
  photoValidIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DDEAFF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  photoValidText: {
    color: "#59A6FF",
    fontSize: 13,
    fontWeight: "900" as const
  },
  photoConfirmFooter: {
    minHeight: 190,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14
  },
  usePhotoButton: {
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  usePhotoButtonDisabled: { backgroundColor: "#D6DEE8" },
  usePhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900" as const
  },
  retakePhotoButton: {
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  retakePhotoButtonText: {
    color: "#09243A",
    fontSize: 14,
    fontWeight: "800" as const
  },
  documentRow: { flexDirection: "row" as const, gap: 12 },
  documentUpload: {
    flex: 1,
    minHeight: 118,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  infoText: { color: "#12324A", fontSize: 12, lineHeight: 18 },
  uploadBox: {
    minHeight: 142,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: "#1976D2",
    backgroundColor: "#F5FBFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 18,
    gap: 12
  },
  uploadText: { color: "#12324A", fontSize: 16, lineHeight: 22, textAlign: "center" as const },
  slideCard: {
    marginTop: 118,
    minHeight: 650,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 20,
    gap: 16,
    marginHorizontal: -20
  },
  documentMock: { borderRadius: 8, backgroundColor: "#EEF4FA", padding: 14, gap: 10, alignItems: "center" as const },
  documentCaption: { color: "#6D7B88", fontSize: 12 },
  documentLines: { width: "100%" as const, minHeight: 180, borderRadius: 8, backgroundColor: "#FFFFFF", padding: 18, gap: 14 },
  documentPhoto: { width: 86, height: 86, borderRadius: 8, backgroundColor: "#D7E2EB" },
  documentPreview: {
    minHeight: 260,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DEE8",
    padding: 18,
    gap: 18,
    justifyContent: "center" as const
  },
  documentPreviewLabel: { color: "#6D7B88", fontSize: 12, fontWeight: "900" as const },
  documentPhotoLarge: { width: 110, height: 86, borderRadius: 8, backgroundColor: "#D7E2EB" },
  fakeLineWide: { height: 12, width: "72%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  fakeLine: { height: 12, width: "56%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  fakeLineShort: { height: 12, width: "38%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  validPill: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: "#ECFDF3" },
  validText: { color: "#021B30", fontSize: 14, fontWeight: "800" as const },
  bulletBlock: { gap: 12, marginTop: 8 },
  bulletRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 10 },
  selfieGuide: { height: 260, borderRadius: 8, borderWidth: 2, borderColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "#F8FAFC" },
  selfieCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const },
  facePreview: { width: 220, height: 220, borderRadius: 110, backgroundColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const, alignSelf: "center" as const, marginTop: 44 },
  registrationSuccessScreen: {
    flex: 1,
    minHeight: 690,
    alignItems: "center" as const,
    paddingTop: 86
  },
  successIcon: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 76,
    marginBottom: 92
  },
  successTitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, textAlign: "center" as const },
  successSubtitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const }
};
