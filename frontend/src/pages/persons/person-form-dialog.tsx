import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { useCreatePerson, useUpdatePerson } from "@/hooks/queries/persons";
import {
  personCreateSchema,
  personType as personTypeEnum,
  type Person,
  type PersonCreateInput,
} from "@shared";
import { toast } from "sonner";

type FormValues = {
  personType: "" | "INDIVIDUAL" | "LEGAL_ENTITY";
  firstName: string;
  lastName: string;
  businessName: string;
  cuitCuil: string;
  email: string;
  phone: string;
  mobilePhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  legalAddress: string;
  appointedAddress: string;
  notes: string;
};

const emptyValues: FormValues = {
  personType: "",
  firstName: "",
  lastName: "",
  businessName: "",
  cuitCuil: "",
  email: "",
  phone: "",
  mobilePhone: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
  legalAddress: "",
  appointedAddress: "",
  notes: "",
};

function personToValues(p: Person): FormValues {
  return {
    personType: p.personType as FormValues["personType"],
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    businessName: p.businessName ?? "",
    cuitCuil: p.cuitCuil ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    mobilePhone: p.mobilePhone ?? "",
    addressStreet: p.addressStreet ?? "",
    addressCity: p.addressCity ?? "",
    addressState: p.addressState ?? "",
    addressZip: p.addressZip ?? "",
    legalAddress: p.legalAddress ?? "",
    appointedAddress: p.appointedAddress ?? "",
    notes: p.notes ?? "",
  };
}

// El backend valida con `.email()` y rechazaría "". Convertimos strings vacíos
// a undefined para no enviar campos que el usuario dejó en blanco.
function toOptional(v: string): string | undefined {
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
}

function valuesToInput(values: FormValues): PersonCreateInput {
  return {
    personType: values.personType as PersonCreateInput["personType"],
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    businessName: toOptional(values.businessName),
    cuitCuil: toOptional(values.cuitCuil),
    email: toOptional(values.email),
    phone: toOptional(values.phone),
    mobilePhone: toOptional(values.mobilePhone),
    addressStreet: toOptional(values.addressStreet),
    addressCity: toOptional(values.addressCity),
    addressState: toOptional(values.addressState),
    addressZip: toOptional(values.addressZip),
    legalAddress: toOptional(values.legalAddress),
    appointedAddress: toOptional(values.appointedAddress),
    notes: toOptional(values.notes),
  };
}

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  // Callback opcional disparado tras una creación exitosa. Permite que un
  // selector inline (PersonSelect con allowCreate) reciba la persona recién
  // creada para auto-seleccionarla sin pasar por una búsqueda posterior.
  onCreated?: (person: Person) => void;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onCreated,
}: PersonFormDialogProps) {
  const mode = person ? "edit" : "create";
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    // personCreateSchema valida nombre+apellido (física) o razón social (jurídica)
    // tanto en alta como en edición: son las mismas reglas de integridad.
    resolver: zodResolver(personCreateSchema) as never,
    defaultValues: emptyValues,
    mode: "onSubmit",
  });

  const selectedType = form.watch("personType");
  const isPhysical = selectedType === personTypeEnum.INDIVIDUAL;
  const isLegal = selectedType === personTypeEnum.LEGAL_ENTITY;

  // Reset al abrir: cargar datos en edit, o limpiar en create.
  useEffect(() => {
    if (!open) return;
    form.reset(person ? personToValues(person) : emptyValues);
  }, [open, person, form]);

  async function onSubmit(values: FormValues) {
    if (!values.personType) {
      form.setError("personType", { message: es.persons.validation.typeRequired });
      return;
    }

    const input = valuesToInput(values);

    try {
      if (mode === "edit" && person) {
        await updateMutation.mutateAsync({ id: person.id, input });
        toast.success(es.persons.toast.updated);
      } else {
        const created = await createMutation.mutateAsync(input);
        toast.success(es.persons.toast.created);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.persons.toast.error;
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? es.persons.form.editTitle
              : es.persons.form.createTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de persona — primer campo, bloquea el resto del form */}
          <FormField
            label={es.persons.form.type}
            required
            error={form.formState.errors.personType?.message}
          >
            <Controller
              name="personType"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isPhysical ? "default" : "outline"}
                    onClick={() => field.onChange(personTypeEnum.INDIVIDUAL)}
                    className="flex-1"
                  >
                    {es.persons.form.typePhysical}
                  </Button>
                  <Button
                    type="button"
                    variant={isLegal ? "default" : "outline"}
                    onClick={() => field.onChange(personTypeEnum.LEGAL_ENTITY)}
                    className="flex-1"
                  >
                    {es.persons.form.typeLegal}
                  </Button>
                </div>
              )}
            />
          </FormField>

          {/* Campos de persona física */}
          {isPhysical && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={es.persons.form.lastName}
                required
                error={form.formState.errors.lastName?.message}
              >
                <Input {...form.register("lastName")} />
              </FormField>
              <FormField
                label={es.persons.form.firstName}
                required
                error={form.formState.errors.firstName?.message}
              >
                <Input {...form.register("firstName")} />
              </FormField>
            </div>
          )}

          {/* Campos de persona jurídica */}
          {isLegal && (
            <FormField
              label={es.persons.form.businessName}
              required
              error={form.formState.errors.businessName?.message}
            >
              <Input {...form.register("businessName")} />
            </FormField>
          )}

          {/* Campos comunes: cuit/cuil + contacto. Sólo visible si ya eligió tipo. */}
          {(isPhysical || isLegal) && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={es.persons.form.cuitCuil}
                  error={form.formState.errors.cuitCuil?.message}
                >
                  <Input {...form.register("cuitCuil")} />
                </FormField>
                <FormField
                  label={es.persons.form.email}
                  error={form.formState.errors.email?.message}
                >
                  <Input type="email" {...form.register("email")} />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={es.persons.form.phone}
                  error={form.formState.errors.phone?.message}
                >
                  <Input {...form.register("phone")} />
                </FormField>
                <FormField
                  label={es.persons.form.mobilePhone}
                  error={form.formState.errors.mobilePhone?.message}
                >
                  <Input {...form.register("mobilePhone")} />
                </FormField>
              </div>
            </>
          )}

          {/* Domicilios — distintos según tipo */}
          {isPhysical && (
            <>
              <FormField
                label={es.persons.form.addressStreet}
                error={form.formState.errors.addressStreet?.message}
              >
                <Input {...form.register("addressStreet")} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  label={es.persons.form.addressCity}
                  error={form.formState.errors.addressCity?.message}
                >
                  <Input {...form.register("addressCity")} />
                </FormField>
                <FormField
                  label={es.persons.form.addressState}
                  error={form.formState.errors.addressState?.message}
                >
                  <Input {...form.register("addressState")} />
                </FormField>
                <FormField
                  label={es.persons.form.addressZip}
                  error={form.formState.errors.addressZip?.message}
                >
                  <Input {...form.register("addressZip")} />
                </FormField>
              </div>
            </>
          )}

          {isLegal && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={es.persons.form.legalAddress}
                error={form.formState.errors.legalAddress?.message}
              >
                <Input {...form.register("legalAddress")} />
              </FormField>
              <FormField
                label={es.persons.form.appointedAddress}
                error={form.formState.errors.appointedAddress?.message}
              >
                <Input {...form.register("appointedAddress")} />
              </FormField>
            </div>
          )}

          {(isPhysical || isLegal) && (
            <FormField
              label={es.persons.form.notes}
              error={form.formState.errors.notes?.message}
            >
              <Input {...form.register("notes")} />
            </FormField>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {es.persons.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {es.persons.form.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
