import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import * as authService from "@/services/auth.service";
import { es } from "@/i18n/es";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const t = es.settings.profile;
const tp = es.settings.password;

export function ProfileTab() {
  const { user } = useAuth();

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  async function handleProfileSave() {
    setProfileSaving(true);
    try {
      await authService.updateProfile({ firstName, lastName });
      toast.success(t.saved);
    } catch {
      toast.error(es.common.error);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError(tp.minLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(tp.mismatch);
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success(tp.changed);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "WRONG_PASSWORD") {
        setPasswordError(tp.wrongCurrent);
      } else {
        toast.error(es.common.error);
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t.firstName} required>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </FormField>
            <FormField label={t.lastName} required>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label={t.email}>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">{t.emailReadonly}</p>
          </FormField>
        </CardContent>
        <CardFooter>
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {es.common.save}
          </Button>
        </CardFooter>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle>{tp.title}</CardTitle>
          <CardDescription>{tp.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label={tp.currentPassword} required>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={tp.newPassword} required error={passwordError || undefined}>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
              />
            </FormField>
            <FormField label={tp.confirmPassword} required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
              />
            </FormField>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handlePasswordChange}
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
          >
            {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {es.common.save}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
