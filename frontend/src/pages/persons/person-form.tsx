import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCreatePerson, useUpdatePerson } from "@/hooks/use-persons";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import type { Person } from "@/services/person.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CUIT_REGEX = /^\d{2}-\d{8}-\d$/;

const personSchema = z
  .object({
    personType: z.enum(["INDIVIDUAL", "LEGAL_ENTITY"]),
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    businessName: z.string().optional(),
    cuitCuil: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobilePhone: z.string().optional(),
    addressStreet: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZip: z.string().optional(),
    legalAddress: z.string().optional(),
    appointedAddress: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.personType !== "INDIVIDUAL" || d.firstName.trim().length > 0, {
    message: es.person.firstNameRequired, path: ["firstName"],
  })
  .refine((d) => d.personType !== "INDIVIDUAL" || d.lastName.trim().length > 0, {
    message: es.person.lastNameRequired, path: ["lastName"],
  })
  .refine((d) => d.personType !== "LEGAL_ENTITY" || (d.businessName && d.businessName.trim().length > 0), {
    message: es.person.businessNameRequired, path: ["businessName"],
  })
  .refine((d) => !d.cuitCuil || CUIT_REGEX.test(d.cuitCuil), {
    message: es.person.cuitFormat, path: ["cuitCuil"],
  })
  .refine((d) => !d.email || z.string().email().safeParse(d.email).success, {
    message: es.person.emailInvalid, path: ["email"],
  });

interface PersonFormProps {
  open: boolean;
  onClose: () => void;
  person: Person | null;
}

interface FormState {
  personType: "INDIVIDUAL" | "LEGAL_ENTITY";
  firstName: string; lastName: string; businessName: string;
  cuitCuil: string; email: string; phone: string; mobilePhone: string;
  addressStreet: string; addressCity: string; addressState: string; addressZip: string;
  legalAddress: string; appointedAddress: string; notes: string;
}

const emptyForm: FormState = {
  personType: "INDIVIDUAL",
  firstName: "", lastName: "", businessName: "",
  cuitCuil: "", email: "", phone: "", mobilePhone: "",
  addressStreet: "", addressCity: "", addressState: "", addressZip: "",
  legalAddress: "", appointedAddress: "", notes: "",
};

export function PersonForm({ open, onClose, person }: PersonFormProps) {
  const isEdit = !!person;
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (person) {
        setForm({
          personType: person.personType as "INDIVIDUAL" | "LEGAL_ENTITY",
          firstName: person.firstName, lastName: person.lastName,
          businessName: person.businessName ?? "",
          cuitCuil: person.cuitCuil ?? "", email: person.email ?? "",
          phone: person.phone ?? "", mobilePhone: person.mobilePhone ?? "",
          addressStreet: person.addressStreet ?? "", addressCity: person.addressCity ?? "",
          addressState: person.addressState ?? "", addressZip: person.addressZip ?? "",
          legalAddress: person.legalAddress ?? "", appointedAddress: person.appointedAddress ?? "",
          notes: person.notes ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, person]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = personSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // Clean empty strings to null for the API
    const payload: Record<string, unknown> = { ...result.data };
    for (const [k, v] of Object.entries(payload)) {
      if (v === "") payload[k] = null;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: person!.id, data: payload });
        toast.success(es.person.updated);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(es.person.created);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  const isIndividual = form.personType === "INDIVIDUAL";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? es.person.edit : es.person.new}</DialogTitle>
          <DialogDescription>
            {isEdit ? es.person.editDescription : es.person.newDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={es.person.type} required>
            <Select value={form.personType} onValueChange={(v) => set("personType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">{es.person.individual}</SelectItem>
                <SelectItem value="LEGAL_ENTITY">{es.person.legalEntity}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {isIndividual ? (
            <div className="grid grid-cols-2 gap-4">
              <FormField label={es.person.firstName} error={errors.firstName} required>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </FormField>
              <FormField label={es.person.lastName} error={errors.lastName} required>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </FormField>
            </div>
          ) : (
            <FormField label={es.person.businessName} error={errors.businessName} required>
              <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.person.cuit} error={errors.cuitCuil}>
              <Input value={form.cuitCuil} onChange={(e) => set("cuitCuil", e.target.value)} placeholder="XX-XXXXXXXX-X" />
            </FormField>
            <FormField label={es.person.email} error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </FormField>
            <FormField label={es.person.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </FormField>
            <FormField label={es.person.mobile}>
              <Input value={form.mobilePhone} onChange={(e) => set("mobilePhone", e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.person.addressStreet}>
              <Input value={form.addressStreet} onChange={(e) => set("addressStreet", e.target.value)} />
            </FormField>
            <FormField label={es.person.addressCity}>
              <Input value={form.addressCity} onChange={(e) => set("addressCity", e.target.value)} />
            </FormField>
            <FormField label={es.person.addressState}>
              <Input value={form.addressState} onChange={(e) => set("addressState", e.target.value)} />
            </FormField>
            <FormField label={es.person.addressZip}>
              <Input value={form.addressZip} onChange={(e) => set("addressZip", e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.person.legalAddress}>
              <Input value={form.legalAddress} onChange={(e) => set("legalAddress", e.target.value)} />
            </FormField>
            <FormField label={es.person.appointedAddress}>
              <Input value={form.appointedAddress} onChange={(e) => set("appointedAddress", e.target.value)} />
            </FormField>
          </div>

          <FormField label={es.person.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{es.common.cancel}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {es.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
