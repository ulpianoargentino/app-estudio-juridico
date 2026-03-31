import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useFirm, useUpdateFirm } from "@/hooks/use-firm";
import { es } from "@/i18n/es";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

const t = es.settings.firm;

export function FirmTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: firm, isLoading } = useFirm();
  const updateFirm = useUpdateFirm();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#3b82f6");

  useEffect(() => {
    if (firm) {
      setName(firm.name);
      setLogoUrl(firm.logoUrl ?? "");
      setAccentColor(firm.accentColor ?? "#3b82f6");
    }
  }, [firm]);

  async function handleSave() {
    updateFirm.mutate(
      {
        name: name || undefined,
        logoUrl: logoUrl || null,
        accentColor: accentColor || null,
      },
      {
        onSuccess: () => toast.success(t.saved),
        onError: () => toast.error(es.common.error),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t.adminOnly}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label={t.name} required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label={t.logoUrl}>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder={t.logoUrlPlaceholder}
          />
        </FormField>
        <FormField label={t.accentColor}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-1"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="max-w-32"
              placeholder="#3b82f6"
            />
          </div>
        </FormField>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={updateFirm.isPending}>
          {updateFirm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {es.common.save}
        </Button>
      </CardFooter>
    </Card>
  );
}
