// Script de Prueba Rápida - Frontend SIEPA Optimizado
// Simula datos históricos para verificar el funcionamiento

console.log("🧪 INICIANDO PRUEBA DE INTEGRACIÓN FRONTEND");

// Simular datos históricos que vendrían del backend
const mockHistoricalData = {
  type: "historical_data",
  data: [
    {
      sensor_type: "temperature",
      value: 23.5,
      timestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutos atrás
      formatted_time: "10:00:00",
      unit: "°C",
    },
    {
      sensor_type: "humidity",
      value: 65.2,
      timestamp: Math.floor(Date.now() / 1000) - 240, // 4 minutos atrás
      formatted_time: "10:01:00",
      unit: "%",
    },
    {
      sensor_type: "temperature",
      value: 24.1,
      timestamp: Math.floor(Date.now() / 1000) - 180, // 3 minutos atrás
      formatted_time: "10:02:00",
      unit: "°C",
    },
    {
      sensor_type: "light",
      value: 450,
      timestamp: Math.floor(Date.now() / 1000) - 120, // 2 minutos atrás
      formatted_time: "10:03:00",
      unit: "lux",
    },
    {
      sensor_type: "air_quality",
      value: 420,
      timestamp: Math.floor(Date.now() / 1000) - 60, // 1 minuto atrás
      formatted_time: "10:04:00",
      unit: "ppm",
    },
    {
      sensor_type: "_stats",
      value: 0,
      timestamp: Math.floor(Date.now() / 1000),
      stats: {
        temperature: {
          count: 2,
          avg_value: 23.8,
          min_value: 23.5,
          max_value: 24.1,
          last_reading: Math.floor(Date.now() / 1000) - 180,
        },
        humidity: {
          count: 1,
          avg_value: 65.2,
          min_value: 65.2,
          max_value: 65.2,
          last_reading: Math.floor(Date.now() / 1000) - 240,
        },
      },
    },
  ],
  timestamp: Date.now() / 1000,
  total_points: 5,
};

// Función para enviar datos simulados por MQTT (si está disponible)
function sendMockData() {
  if (typeof window !== "undefined" && window.mqtt) {
    console.log("📤 Enviando datos simulados por MQTT...");

    const message = {
      topic: "siepa/history",
      timestamp: new Date(),
      value: mockHistoricalData,
      complete_data: mockHistoricalData,
    };

    // Simular recepción de mensaje MQTT
    if (window.addMockSensorData) {
      window.addMockSensorData(message);
      console.log("✅ Datos simulados enviados al store");
    } else {
      console.log("⚠️ Función addMockSensorData no disponible");
    }
  } else {
    console.log("⚠️ MQTT no disponible en el contexto actual");
  }
}

// Función para verificar el formato de datos
function verifyDataFormat(data) {
  console.log("🔍 Verificando formato de datos...");

  const requiredFields = ["sensor_type", "value", "timestamp"];
  const issues = [];

  data.forEach((point, index) => {
    if (point.sensor_type && !point.sensor_type.startsWith("_")) {
      // Verificar campos requeridos
      requiredFields.forEach((field) => {
        if (point[field] === undefined || point[field] === null) {
          issues.push(`Punto ${index}: Campo '${field}' faltante`);
        }
      });

      // Verificar tipos de datos
      if (
        typeof point.value !== "number" &&
        isNaN(parseFloat(String(point.value)))
      ) {
        issues.push(`Punto ${index}: Valor '${point.value}' no es numérico`);
      }

      if (typeof point.timestamp !== "number") {
        issues.push(
          `Punto ${index}: Timestamp '${point.timestamp}' no es numérico`
        );
      }
    }
  });

  if (issues.length === 0) {
    console.log("✅ Formato de datos válido");
    return true;
  } else {
    console.log("❌ Problemas encontrados en el formato:");
    issues.forEach((issue) => console.log(`  • ${issue}`));
    return false;
  }
}

// Función para simular solicitud de historial
function testHistoryRequest() {
  console.log("📡 Simulando solicitud de historial...");

  const historyCommand = {
    sensor_type: "all",
    max_points: 30,
    hours_back: 2,
    timestamp: Date.now(),
    source: "frontend_test",
    include_stats: true,
  };

  console.log("📤 Comando enviado:", historyCommand);

  // Simular respuesta después de un delay
  setTimeout(() => {
    console.log("📥 Simulando respuesta del backend...");

    if (verifyDataFormat(mockHistoricalData.data)) {
      sendMockData();
    }
  }, 1000);
}

// Ejecutar pruebas
function runTests() {
  console.log("🚀 Ejecutando pruebas de integración...");
  console.log("=" * 50);

  // Test 1: Verificar formato de datos
  console.log("\n🧪 Test 1: Verificación de formato de datos");
  verifyDataFormat(mockHistoricalData.data);

  // Test 2: Simular solicitud de historial
  console.log("\n🧪 Test 2: Solicitud de historial");
  testHistoryRequest();

  // Test 3: Verificar datos en el frontend (si está disponible)
  setTimeout(() => {
    console.log("\n🧪 Test 3: Verificación en frontend");

    if (
      typeof window !== "undefined" &&
      window.location.pathname.includes("/debug")
    ) {
      console.log("✅ Página de debug detectada");
      console.log("💡 Abrir las herramientas de desarrollo para ver los logs");
    } else {
      console.log("💡 Para ver el debug completo, navegar a /debug");
    }

    console.log("\n✅ Pruebas completadas");
    console.log("📊 Datos de prueba generados exitosamente");
  }, 2000);
}

// Exportar funciones para uso en el navegador
if (typeof window !== "undefined") {
  window.siepaTesting = {
    runTests,
    sendMockData,
    verifyDataFormat,
    testHistoryRequest,
    mockData: mockHistoricalData,
  };

  console.log("🔧 Funciones de prueba disponibles en window.siepaTesting");
  console.log("📋 Comandos disponibles:");
  console.log(
    "  • window.siepaTesting.runTests() - Ejecutar todas las pruebas"
  );
  console.log(
    "  • window.siepaTesting.sendMockData() - Enviar datos simulados"
  );
  console.log(
    "  • window.siepaTesting.testHistoryRequest() - Simular solicitud"
  );
}

// Auto-ejecutar si no estamos en el navegador
if (typeof window === "undefined") {
  runTests();
}

export default {
  runTests,
  sendMockData,
  verifyDataFormat,
  testHistoryRequest,
  mockData: mockHistoricalData,
};
