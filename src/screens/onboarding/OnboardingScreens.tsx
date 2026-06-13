import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Field,
  InfoCard,
  Ionicons,
  PrimaryButton,
  RegistrationFrame,
  ScreenFrame,
  SecondaryButton,
  SectionTitle,
  styles
} from "../../components/ui";
import type { ScreenRenderProps } from "../../types/domain";

const sanitizeLetters = (value: string) => value.replace(/[^A-Za-z\u00C0-\u017F\s]/g, "");

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

export function PersonalInformationScreen({ navigate, profilePhotoUri }: ScreenRenderProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateTouched, setBirthDateTouched] = useState(false);
  const today = getToday();
  const maxAdultBirthDate = getMaxAdultBirthDate(today);
  const selectedBirthDate = parseBirthDate(birthDate);
  const [calendarMonth, setCalendarMonth] = useState(selectedBirthDate ?? maxAdultBirthDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const birthDateError = birthDateTouched ? validateBirthDate(birthDate, today) : "";
  const isBirthDateValid = !validateBirthDate(birthDate, today);
  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0 && isBirthDateValid;

  const openCalendar = () => {
    setCalendarMonth(selectedBirthDate ?? maxAdultBirthDate);
    setIsCalendarOpen(true);
  };

  const handleBirthDateChange = (value: string) => {
    setBirthDateTouched(true);
    setBirthDate(formatBirthDate(value));
  };

  const handleCalendarSelect = (date: Date) => {
    setBirthDateTouched(true);
    setBirthDate(formatDateForInput(date));
    setIsCalendarOpen(false);
  };

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.personalScreen}>
        <View style={local.personalHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>Informacion personal</Text>
            <View style={local.personalTitleUnderline} />
          </View>
          <Pressable onPress={() => navigate("profileSelection")} hitSlop={10}>
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

        <View style={local.personalForm}>
          <PersonalField
            label="Nombre"
            onChangeText={(value) => setFirstName(sanitizeLetters(value))}
            placeholder="Juan Manuel"
            value={firstName}
          />
          <PersonalField
            label="Apellido"
            onChangeText={(value) => setLastName(sanitizeLetters(value))}
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
        </View>
      </View>

      <View style={local.personalFooter}>
        <Text style={local.stepText}>Paso 1 de 3</Text>
        <View style={local.personalStepRow}>
          <View style={[local.personalStepBar, local.personalStepBarActive]} />
          <View style={local.personalStepBar} />
          <View style={local.personalStepBar} />
        </View>
        <Pressable
          disabled={!canContinue}
          onPress={() => navigate("identity")}
          style={[local.nextButton, !canContinue && local.nextButtonDisabled]}
        >
          <Text style={[local.nextButtonText, !canContinue && local.nextButtonTextDisabled]}>Siguiente</Text>
          <Ionicons name="play-forward" size={14} color="#FFFFFF" />
        </Pressable>
      </View>
      <BirthDateCalendar
        maxDate={maxAdultBirthDate}
        month={calendarMonth}
        onChangeMonth={setCalendarMonth}
        onClose={() => setIsCalendarOpen(false)}
        onSelect={handleCalendarSelect}
        selectedDate={selectedBirthDate}
        visible={isCalendarOpen}
      />
    </ScreenFrame>
  );
}

function PersonalField({
  icon,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  onIconPress,
  placeholder,
  value
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "number-pad";
  label: string;
  maxLength?: number;
  onChangeText: (value: string) => void;
  onIconPress?: () => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={local.personalFieldBlock}>
      <Text style={local.personalFieldLabel}>{label}</Text>
      <View style={local.personalInputShell}>
        <TextInput
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B6BEC9"
          style={local.personalInput}
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

export function IdentityScreen() {
  return (
    <RegistrationFrame title="Cedula de identidad" step={2}>
      <View style={local.documentRow}>
        <DocumentUpload label="Anverso" />
        <DocumentUpload label="Reverso" />
      </View>
      <Field label="Tipo de documento" placeholder="DNI" />
      <Field label="Numero de documento" placeholder="Ej: 12345678" />
      <InfoCard>
        <Text style={local.infoText}>
          Asegurate de que la foto sea clara y que todos los datos sean legibles para evitar
          retrasos en tu verificacion.
        </Text>
      </InfoCard>
    </RegistrationFrame>
  );
}

export function ProfessionalInformationScreen() {
  return (
    <RegistrationFrame title="Informacion profesional" step={3} finalLabel="Finalizar registro">
      <Text style={styles.bodyText}>
        Completa los detalles de tu especialidad para que los clientes puedan encontrarte
        facilmente.
      </Text>
      <Field label="Oficio" placeholder="Seleccionar una ocupacion" icon="chevron-down" />
      <Text style={styles.fieldLabel}>Subir certificado (Opcional)</Text>
      <View style={local.uploadBox}>
        <Ionicons name="cloud-upload-outline" size={34} color="#1976D2" />
        <Text style={local.uploadText}>Toca aqui para subir tu certificado o dejalo en blanco</Text>
      </View>
      <Text style={styles.captionText}>Los certificados aumentan tus probabilidades de ser contratado.</Text>
    </RegistrationFrame>
  );
}

export function DocumentInstruction({ side }: { side: "FRONTAL" | "TRASERA" }) {
  return (
    <ScreenFrame darkTop>
      <View style={local.slideCard}>
        <SectionTitle title="Cedula de identidad" />
        <Text style={styles.bodyText}>Carga la parte {side} del documento de identificacion</Text>
        <Text style={styles.bodyText}>Asegurese de que la foto sea legible</Text>
        <DocumentMock caption="Imagen referencial" />
        <PrimaryButton label="Tomar Foto" />
        <SecondaryButton label="Elegir de la galeria" />
      </View>
    </ScreenFrame>
  );
}

export function DocumentConfirmation({ side }: { side: "ANVERSO" | "REVERSO" }) {
  return (
    <ScreenFrame>
      <SectionTitle title="Verifica el frente de tu documento" />
      <Text style={styles.captionText}>Asegurate de que el numero de DNI y tu nombre sean legibles</Text>
      <View style={local.documentPreview}>
        <Text style={local.documentPreviewLabel}>{side}</Text>
        <View style={local.documentPhotoLarge} />
        <View style={local.fakeLineWide} />
        <View style={local.fakeLine} />
      </View>
      <View style={local.validPill}>
        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
        <Text style={local.validText}>Documento legible</Text>
      </View>
      <PrimaryButton label="Usar esta foto" />
      <SecondaryButton label="Tomar otra foto" />
    </ScreenFrame>
  );
}

export function ProfilePhotoInstructionsScreen({ navigate }: ScreenRenderProps) {
  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.photoInstructionScreen}>
        <View style={local.personalHeader}>
          <View style={local.personalTitleBlock}>
            <Text style={local.personalTitle}>Su foto de perfil</Text>
            <View style={local.personalTitleUnderline} />
          </View>
          <Pressable onPress={() => navigate("personalInformation")} hitSlop={10} style={local.photoConfirmClose}>
            <Ionicons name="close-circle" size={24} color="#111111" />
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
    </ScreenFrame>
  );
}

export function ProfilePhotoCameraScreen({ navigate, setPendingProfilePhotoUri }: ScreenRenderProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState("");
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

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
        <Pressable onPress={() => navigate("profilePhotoInstructions")} style={local.cameraCloseButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
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
    </View>
  );
}

export function ProfilePhotoConfirmationScreen({
  navigate,
  pendingProfilePhotoUri,
  setPendingProfilePhotoUri,
  setProfilePhotoUri
}: ScreenRenderProps) {
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

  return (
    <ScreenFrame noPadding>
      <View style={local.personalTopBand} />
      <View style={local.photoConfirmScreen}>
        <View style={local.photoConfirmHeader}>
          <Text style={local.photoConfirmTitle}>Te gusta tu foto?</Text>
          <Pressable onPress={() => navigate("personalInformation")} hitSlop={10}>
            <Ionicons name="close-circle" size={24} color="#111111" />
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
    </ScreenFrame>
  );
}

export function WorkerConfirmationScreen() {
  return (
    <ScreenFrame centered>
      <View style={local.successIcon}>
        <Ionicons name="checkmark" size={72} color="#FFFFFF" />
      </View>
      <Text style={local.successTitle}>Registro exitoso!</Text>
      <Text style={local.successSubtitle}>A chambear!</Text>
      <PrimaryButton label="Ir a solicitudes" />
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

function DocumentMock({ caption }: { caption: string }) {
  return (
    <View style={local.documentMock}>
      <Text style={local.documentCaption}>{caption}</Text>
      <View style={local.documentLines}>
        <View style={local.documentPhoto} />
        <View style={local.fakeLineWide} />
        <View style={local.fakeLine} />
        <View style={local.fakeLineShort} />
      </View>
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
    height: 56,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  personalScreen: {
    paddingHorizontal: 28,
    paddingTop: 10,
    minHeight: 534
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
    marginBottom: 24
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
  personalInput: {
    flex: 1,
    color: "#09243A",
    fontSize: 15,
    paddingVertical: 0
  },
  validationText: {
    color: "#C92A2A",
    fontSize: 12,
    fontWeight: "700" as const,
    marginTop: -14
  },
  personalFooter: {
    minHeight: 98,
    borderTopWidth: 1,
    borderTopColor: "#CFD5DD",
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingHorizontal: 28,
    position: "relative" as const
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
    bottom: 20,
    minHeight: 30,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#00A6FF",
    backgroundColor: "#021B30",
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4
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
    paddingHorizontal: 20,
    paddingTop: 10,
    minHeight: 592
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
    minHeight: 86,
    borderTopWidth: 1,
    borderTopColor: "#E0E5EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 14
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
    minHeight: 744,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: 296,
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
    top: 0
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
  successIcon: { width: 132, height: 132, borderRadius: 66, backgroundColor: "#22C55E", alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 22 },
  successTitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, textAlign: "center" as const },
  successSubtitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, marginBottom: 28 }
};
