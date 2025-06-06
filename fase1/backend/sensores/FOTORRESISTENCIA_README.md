# Fotorresistencia MD-FR060 con Raspberry Pi

## ¿Qué es la MD-FR060?

La MD-FR060 es una fotorresistencia (LDR - Light Dependent Resistor) de sulfuro de cadmio (CdS) que cambia su resistencia según la intensidad de luz que recibe:

- **Con mucha luz**: Resistencia baja (pocos ohms)
- **Con poca luz**: Resistencia alta (varios megaohms)
- **Rango típico**: 5-10kΩ @ 10 lux, hasta varios MΩ en oscuridad
- **Voltaje máximo**: 150V DC
- **Potencia máxima**: 90-100mW
- **Pico espectral**: 540nm (luz verde-amarilla)

## Métodos de Conexión

### Método 1: Con MCP3008 ADC (Recomendado)

**Archivo**: `sensor_fotorresistencia_mcp3008.py`

**Ventajas**:
- Lectura analógica precisa
- Múltiples canales disponibles
- Valores calibrados en voltios

**Conexiones MCP3008**:
```
MCP3008 Pin  | Raspberry Pi Pin
-------------|------------------
VDD          | 3.3V (Pin 1)
VREF         | 3.3V (Pin 1)
AGND         | GND (Pin 6)
DGND         | GND (Pin 6)
CLK          | SCLK (Pin 23)
DOUT         | MISO (Pin 21)
DIN          | MOSI (Pin 19)
CS           | GPIO5 (Pin 29)
```

**Conexiones Fotorresistencia**:
```
3.3V ----[Fotorresistencia]---- CH0 (MCP3008) ----[10kΩ]---- GND
```

**Instalar librerías**:
```bash
pip install adafruit-circuitpython-mcp3xxx
```

### Método 2: RC Timing (Sin ADC externo)

**Archivo**: `sensor_fotorresistencia_rc.py`

**Ventajas**:
- No requiere componentes adicionales
- Solo necesita un condensador
- Método económico

**Conexiones**:
```
3.3V ----[Fotorresistencia]---- GPIO18 ----[Condensador 0.1µF]---- GND
```

**Componentes necesarios**:
- Fotorresistencia MD-FR060
- Condensador cerámico 0.1µF (100nF)
- Cables jumper

## Esquemas de Conexión

### Conexión MCP3008:
```
    Raspberry Pi                    MCP3008                    Fotorresistencia
    ┌─────────────┐                ┌──────────┐                ┌─────────────┐
    │             │                │          │                │             │
    │ 3.3V ───────┼────────────────┤VDD   CH0 ├────────────────┤             │
    │ GND ────────┼────────────────┤GND       │                │             │
    │ SCLK ───────┼────────────────┤CLK       │                │    MD-FR060 │
    │ MISO ───────┼────────────────┤DOUT      │                │             │
    │ MOSI ───────┼────────────────┤DIN       │                │             │
    │ GPIO5 ──────┼────────────────┤CS        │                │             │
    │             │                │          │                └─────────────┘
    └─────────────┘                └──────────┘                       │
                                         │                             │
                                    ┌────┴────┐                       │
                                    │  10kΩ   │                       │
                                    │ Resistor│                       │
                                    └────┬────┘                       │
                                         │                             │
                                        GND ─────────────────────── 3.3V
```

### Conexión RC:
```
    Raspberry Pi
    ┌─────────────┐
    │             │         Fotorresistencia
    │ 3.3V ───────┼──────────[MD-FR060]──────┐
    │             │                           │
    │ GPIO18 ─────┼───────────────────────────┤
    │             │                           │
    │ GND ────────┼──────[Condensador 0.1µF]──┘
    │             │
    └─────────────┘
```

## Uso de los Scripts

### Script MCP3008:
```bash
python sensor_fotorresistencia_mcp3008.py
```

**Salida esperada**:
```
Monitor de Fotorresistencia MD-FR060
Presiona Ctrl+C para salir
--------------------------------------------------
ADC: 12450 | Voltaje: 1.95V | Resistencia: 7179Ω | Nivel: Penumbra
ADC: 15230 | Voltaje: 2.38V | Resistencia: 4025Ω | Nivel: Luz moderada
```

### Script RC:
```bash
python sensor_fotorresistencia_rc.py
```

**Salida esperada**:
```
Monitor de Fotorresistencia MD-FR060 (Método RC)
Conexión: Fotorresistencia entre GPIO18 y 3.3V
          Condensador 0.1µF entre GPIO18 y GND
Presiona Ctrl+C para salir
------------------------------------------------------------
Tiempo carga: 0.234s | Luz:  75% | Estado: Luz brillante
Tiempo carga: 1.123s | Luz:  25% | Estado: Oscuro
```

## Calibración

### Para el método MCP3008:
Modifica los umbrales en la función `get_light_level()`:
```python
if voltage < 0.5:      # Ajustar según tu ambiente
    return "Muy oscuro"
elif voltage < 1.0:    # Calibrar con mediciones
    return "Oscuro"
# etc...
```

### Para el método RC:
Modifica los umbrales en `read_light_level()`:
```python
if charge_time > 2.0:     # Ajustar según tu condensador
    light_percentage = 0
elif charge_time > 1.0:   # Calibrar experimentalmente
    light_percentage = 25
# etc...
```

## Troubleshooting

### Problemas comunes:

1. **"No module named 'adafruit_mcp3xxx'"**
   ```bash
   pip install adafruit-circuitpython-mcp3xxx
   ```

2. **Lecturas erráticas en método RC**
   - Verificar que el condensador esté bien conectado
   - Probar con condensador de 0.01µF si 0.1µF es muy lento
   - Asegurar buenas conexiones

3. **MCP3008 no responde**
   - Verificar conexiones SPI
   - Comprobar alimentación 3.3V en VDD y VREF
   - Verificar que CS esté en GPIO5

4. **Valores siempre iguales**
   - Cubrir/descubrir la fotorresistencia
   - Verificar que no esté dañada
   - Comprobar conexiones

## Aplicaciones

- Control automático de iluminación
- Detector de presencia
- Medidor de luz ambiente
- Sistema de alarma por interrupción de luz
- Control de pantallas según luz ambiente 