import time
import board
import busio
import digitalio
import adafruit_mcp3xxx.mcp3008 as MCP
from adafruit_mcp3xxx.analog_in import AnalogIn

# Configuración del SPI para el MCP3008
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
cs = digitalio.DigitalInOut(board.D5)
mcp = MCP.MCP3008(spi, cs)

# Configurar la fotorresistencia en el canal 0 del MCP3008
photoresistor = AnalogIn(mcp, MCP.P0)

def get_light_level(voltage):
    """
    Convierte el voltaje a un nivel de luz aproximado en lux
    Esta función debe calibrarse según tu setup específico
    """
    # Valores aproximados - calibrar según tu configuración
    if voltage < 0.5:
        return "Muy oscuro"
    elif voltage < 1.0:
        return "Oscuro"
    elif voltage < 2.0:
        return "Penumbra"
    elif voltage < 2.5:
        return "Luz moderada"
    elif voltage < 3.0:
        return "Luz brillante"
    else:
        return "Muy brillante"

def get_resistance_estimate(voltage, vcc=3.3, fixed_resistor=10000):
    """
    Estima la resistencia de la fotorresistencia usando divisor de voltaje
    R_ldr = R_fixed * (Vcc - V_out) / V_out
    """
    if voltage > 0:
        resistance = fixed_resistor * (vcc - voltage) / voltage
        return resistance
    return float('inf')

print("Monitor de Fotorresistencia MD-FR060 (con MCP3008)")
print("Conexión: 3.3V -> Fotorresistencia -> CH0 -> Resistor 10kΩ -> GND")
print("Presiona Ctrl+C para salir")
print("-" * 60)

try:
    while True:
        # Leer valores del ADC
        raw_value = photoresistor.value
        voltage = photoresistor.voltage
        
        # Calcular resistencia estimada
        resistance = get_resistance_estimate(voltage)
        
        # Determinar nivel de luz
        light_level = get_light_level(voltage)
        
        # Mostrar valores
        print(f"ADC: {raw_value:5d} | Voltaje: {voltage:.2f}V | "
              f"Resistencia: {resistance:.0f}Ω | Nivel: {light_level}")
        
        time.sleep(1.0)

except KeyboardInterrupt:
    print("\nPrograma terminado")

except Exception as e:
    print(f"Error: {e}") 