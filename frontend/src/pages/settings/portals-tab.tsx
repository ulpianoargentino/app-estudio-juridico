import { useState } from "react";
import { toast } from "sonner";
import { es } from "@/i18n/es";
import {
  usePortalCredentials,
  useCreateCredential,
  useUpdateCredential,
  useDeleteCredential,
  useSyncAll,
  useSyncOne,
} from "@/hooks/use-portals";
import type { PortalCredential, PortalSyncResult } from "@/services/portal.service";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Loader2,
  Globe,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const t = es.settings.portals;

interface PortalConfig {
  key: string;
  name: string;
  description: string;
  userFieldLabel: string;
}

const PORTALS: PortalConfig[] = [
  {
    key: "MEV_BUENOS_AIRES",
    name: t.mev.name,
    description: t.mev.description,
    userFieldLabel: t.username,
  },
  {
    key: "SAE_TUCUMAN",
    name: t.sae.name,
    description: t.sae.description,
    userFieldLabel: t.cuit,
  },
];

export function PortalsTab() {
  const { data: credentials, isLoading } = usePortalCredentials();
  const syncAll = useSyncAll();
  const [syncResults, setSyncResults] = useState<PortalSyncResult[] | null>(null);

  function handleSyncAll() {
    setSyncResults(null);
    syncAll.mutate(undefined, {
      onSuccess: (results) => {
        setSyncResults(results);
        const totalNew = results.reduce((sum, r) => sum + r.newMovementsFound, 0);
        if (totalNew > 0) {
          toast.success(`${t.syncSuccess}: ${totalNew} ${t.newMovements}`);
        } else {
          toast.success(`${t.syncSuccess}: ${t.noNews}`);
        }
      },
      onError: () => toast.error(t.syncError),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function getCredentialForPortal(portalKey: string) {
    return credentials?.find((c) => c.portal === portalKey) ?? null;
  }

  return (
    <div className="space-y-6">
      {/* Sync all button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSyncAll}
          disabled={syncAll.isPending || !credentials?.some((c) => c.isActive)}
        >
          {syncAll.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {syncAll.isPending ? t.syncing : t.syncAll}
        </Button>
      </div>

      {/* Sync results summary */}
      {syncResults && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="space-y-2">
            {syncResults.map((r) => (
              <div key={r.credentialId} className="flex items-center gap-2 text-sm">
                {r.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">{r.portal}</span>
                <span className="text-muted-foreground">
                  {r.success
                    ? r.newMovementsFound > 0
                      ? `${r.newMovementsFound} ${t.newMovements}`
                      : t.noNews
                    : r.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portal cards */}
      {PORTALS.map((portal) => (
        <PortalCard
          key={portal.key}
          portal={portal}
          credential={getCredentialForPortal(portal.key)}
        />
      ))}
    </div>
  );
}

interface PortalCardProps {
  portal: PortalConfig;
  credential: PortalCredential | null;
}

function PortalCard({ portal, credential }: PortalCardProps) {
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const deleteCredential = useDeleteCredential();
  const syncOne = useSyncOne();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<PortalSyncResult | null>(null);

  const isConfigured = credential !== null;
  const showForm = !isConfigured || editing;

  function handleSave() {
    if (isConfigured) {
      updateCredential.mutate(
        { id: credential!.id, data: { username, password } },
        {
          onSuccess: () => {
            toast.success(t.credentialUpdated);
            setEditing(false);
            setPassword("");
          },
          onError: () => toast.error(es.common.error),
        }
      );
    } else {
      createCredential.mutate(
        { portal: portal.key, username, password },
        {
          onSuccess: () => {
            toast.success(t.credentialSaved);
            setUsername("");
            setPassword("");
          },
          onError: () => toast.error(es.common.error),
        }
      );
    }
  }

  function handleDelete() {
    deleteCredential.mutate(credential!.id, {
      onSuccess: () => {
        toast.success(t.credentialDeleted);
        setDeleteOpen(false);
      },
      onError: () => toast.error(es.common.error),
    });
  }

  function handleSync() {
    setSyncResult(null);
    syncOne.mutate(credential!.id, {
      onSuccess: (result) => {
        setSyncResult(result);
        if (result.newMovementsFound > 0) {
          toast.success(`${result.newMovementsFound} ${t.newMovements}`);
        } else {
          toast.success(t.noNews);
        }
      },
      onError: () => toast.error(t.syncError),
    });
  }

  const saving = createCredential.isPending || updateCredential.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{portal.name}</CardTitle>
                <CardDescription>{portal.description}</CardDescription>
              </div>
            </div>
            {isConfigured ? (
              <StatusBadge status="CONFIGURED" variant="success" label={t.configured} />
            ) : (
              <StatusBadge status="NOT_CONFIGURED" variant="neutral" label={t.notConfigured} />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Configured state info */}
          {isConfigured && !editing && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{portal.userFieldLabel}:</span>
                <span className="font-medium">{credential.username}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{t.lastSync}:</span>
                <span>
                  {credential.lastSyncAt
                    ? new Date(credential.lastSyncAt).toLocaleString("es-AR")
                    : t.never}
                </span>
              </div>

              {/* Sync result */}
              {syncResult && (
                <div className="flex items-center gap-2 text-sm">
                  {syncResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>
                    {syncResult.success
                      ? syncResult.newMovementsFound > 0
                        ? `${syncResult.newMovementsFound} ${t.newMovements}`
                        : t.noNews
                      : syncResult.error}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Credential form */}
          {showForm && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={portal.userFieldLabel} required>
                <Input
                  value={username || (editing ? credential?.username ?? "" : "")}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={portal.userFieldLabel}
                />
              </FormField>
              <FormField label={t.password} required>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormField>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          {showForm ? (
            <>
              <Button
                onClick={handleSave}
                disabled={saving || !username || !password}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isConfigured ? t.updateCredentials : t.saveCredentials}
              </Button>
              {editing && (
                <Button variant="ghost" onClick={() => { setEditing(false); setUsername(""); setPassword(""); }}>
                  {es.common.cancel}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncOne.isPending}
              >
                {syncOne.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {syncOne.isPending ? t.syncing : t.syncNow}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(true); setUsername(credential?.username ?? ""); }}>
                {t.updateCredentials}
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.deleteCredentials}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        title={t.deleteConfirmTitle}
        description={t.deleteConfirmDescription}
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
