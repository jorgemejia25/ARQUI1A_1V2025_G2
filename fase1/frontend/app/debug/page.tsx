import MqttDebugger from "@/components/debug/MqttDebugger";

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🔧 Debug del Sistema SIEPA
          </h1>
          <p className="text-foreground-600">
            Herramientas de debugging para verificar la comunicación MQTT y el
            funcionamiento del sistema optimizado para Raspberry Pi
          </p>
        </div>

        <MqttDebugger />
      </div>
    </div>
  );
}
