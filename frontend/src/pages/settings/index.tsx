import { useSearchParams } from "react-router-dom";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "./profile-tab";
import { FirmTab } from "./firm-tab";
import { PortalsTab } from "./portals-tab";

const t = es.settings;

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "profile";

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="profile">{t.tabs.profile}</TabsTrigger>
          <TabsTrigger value="firm">{t.tabs.firm}</TabsTrigger>
          <TabsTrigger value="portals">{t.tabs.portals}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="firm">
          <FirmTab />
        </TabsContent>

        <TabsContent value="portals">
          <PortalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
