# Control de LEDs y Buzzer - Frontend

## Descripción
El panel de control de LEDs y buzzer permite manejar tanto los indicadores visuales (LEDs) como el indicador auditivo (buzzer) del sistema SIEPA.

## Características

### Modos de Control
- **Automático**: Los LEDs se controlan por alertas del sistema
- **Manual**: Control directo de cada LED y el buzzer

### LEDs Disponibles
1. **LED de Temperatura** (Rojo)
   - GPIO: 5
   - Se activa cuando la temperatura > 30°C
   
2. **LED de Humedad** (Amarillo)
   - GPIO: 6
   - Se activa cuando la humedad > 60%
   
3. **LED de Luz** (Verde)
   - GPIO: 13
   - Se activa cuando no hay luz detectada
   
4. **LED de Calidad del Aire** (Azul)
   - GPIO: 19
   - Se activa cuando la calidad del aire es mala

### Buzzer
- **GPIO**: 22
- Se activa cuando la calidad del aire es mala (> 400 ppm)
- Control manual disponible

## Controles Disponibles

### Control Individual
- Botones para encender/apagar cada LED individualmente
- Botón dedicado para el buzzer
- Solo funciona en modo manual

### Acciones Rápidas
- **Todos ON**: Enciende todos los LEDs
- **Todos OFF**: Apaga todos los LEDs

### Patrones
- **Alternado**: LEDs se encienden de forma alternada
- **Secuencia**: LEDs se encienden en secuencia
- **Todos encendidos**: Patrón para encender todos
- **Todos apagados**: Patrón para apagar todos

## Tópicos MQTT

### Comandos
- `GRUPO2/commands/rasp01/leds/control` - Control general (manual/automático)
- `GRUPO2/commands/rasp01/leds/individual` - Control individual de LEDs
- `GRUPO2/commands/rasp01/leds/pattern` - Patrones de LEDs
- `GRUPO2/commands/rasp01/buzzer` - Control del buzzer

### Estado
- `GRUPO2/status/rasp01/leds` - Estado de los LEDs
- `GRUPO2/actuadores/rasp01/buzzer` - Estado del buzzer

## Uso

1. **Cambiar a modo manual**: Usa el switch "Modo de Control"
2. **Controlar LEDs individualmente**: Presiona los botones de cada LED
3. **Controlar buzzer**: Presiona el botón dedicado del buzzer
4. **Usar patrones**: Selecciona un patrón del dropdown
5. **Acciones rápidas**: Usa los botones "Todos ON/OFF"

## Indicadores de Estado
- Círculos pequeños muestran el estado actual de cada LED
- Indicador especial para el buzzer con icono
- Colores corresponden al tipo de LED
- Timestamp de última actualización

## Requisitos
- Conexión MQTT activa
- Backend corriendo con el sistema de LEDs implementado
- Modo manual activado para control directo 