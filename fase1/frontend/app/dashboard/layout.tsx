import DashboardLayout from "@/components/templates/DashboardLayout";
import { MqttProvider } from "@/lib/providers/MqttProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MqttProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </MqttProvider>
  );
}
