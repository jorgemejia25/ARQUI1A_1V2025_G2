"""
Gestor de display del Sistema SIEPA
Abstrae la lógica de display LCD real y simulado
Implementa el sistema de pantallas rotativas exactamente como allin_w_display.py
"""

import time
from typing import Dict, Any
from config import DISPLAY_CONFIG


class DisplayManager:
    """Gestor del display LCD con pantallas rotativas como allin_w_display.py"""
    
    def __init__(self, mode: str = 'testing'):
        self.mode = mode
        self.config = DISPLAY_CONFIG
        self.pantalla_actual = 0  # Variable para rotación de pantallas (0-5)
        
        if mode == 'real':
            self._init_real_display()
        else:
            self._init_simulated_display()
            
        # Mensaje inicial igual que allin_w_display.py
        self._show_welcome_message()
    
    def _init_real_display(self):
        """Inicializa LCD real"""
        try:
            from RPLCD.i2c import CharLCD
            self.lcd = CharLCD(
                'PCF8574', 
                self.config['LCD_I2C_ADDRESS'],
                cols=self.config['LCD_COLS'],
                rows=self.config['LCD_ROWS']
            )
        except ImportError:
            raise ImportError("Librería RPLCD no disponible. Use modo 'testing'")
    
    def _init_simulated_display(self):
        """Inicializa LCD simulado"""
        self.lcd = SimulatedLCD(
            cols=self.config['LCD_COLS'],
            rows=self.config['LCD_ROWS']
        )
    
    def _show_welcome_message(self):
        """Muestra mensaje de bienvenida como allin_w_display.py"""
        self.clear()
        self.write_string("Bienvenido a SIEPA")
        self.set_cursor(1, 0)
        self.write_string("Sistema iniciado...")
        time.sleep(3)
        self.clear()
    
    def clear(self):
        """Limpia el display"""
        self.lcd.clear()
    
    def set_cursor(self, row: int, col: int = 0):
        """Posiciona el cursor"""
        if self.mode == 'real':
            self.lcd.cursor_pos = (row, col)
        else:
            self.lcd.cursor_pos((row, col))
    
    def write_string(self, text: str):
        """Escribe texto en la posición actual"""
        if self.mode == 'real':
            self.lcd.write_string(text)
        else:
            self.lcd.write_string(text)
    
    def write_at(self, row: int, col: int, text: str):
        """Escribe texto en una posición específica"""
        self.set_cursor(row, col)
        self.write_string(text)

    def display_sensor_data(self, sensor_data: Dict[str, Any]):
        """Muestra datos de sensores exactamente igual que allin_w_display.py"""
        # Extraer datos del sensor_data
        temp = sensor_data.get('temperature')
        hum = sensor_data.get('humidity')
        distancia = sensor_data.get('distance')
        lux = sensor_data.get('light_lux')
        voltaje_ldr = sensor_data.get('light_voltage', 0)
        ppm = sensor_data.get('air_quality_ppm')
        voltaje_mq135 = sensor_data.get('air_quality_voltage', 0)
        presion = sensor_data.get('pressure')
        hay_luz = sensor_data.get('light', False)
        aire_malo = sensor_data.get('air_quality_bad', False)
        buzzer_state = sensor_data.get('buzzer_state', False)

        # Mostrar en consola EXACTAMENTE igual que allin_w_display.py
        print("----- Lectura actual -----")
        print(f"🌡️  Temperatura: {temp or '-'} °C")
        print(f"💧 Humedad: {hum or '-'} %")
        print(f"📏 Distancia: {distancia} cm")
        
        # Mostrar luz igual que allin_w_display.py
        if lux is not None and voltaje_ldr is not None:
            print(f"💡 Luz: {'SI' if hay_luz else 'NO'} ({lux} lux | {voltaje_ldr:.2f}V)")
        else:
            print(f"💡 Luz: ERROR (Sensor no detectado)")
        
        # Mostrar presión igual que allin_w_display.py
        if presion is not None:
            print(f"🌬️  Presión: {presion:.2f} hPa")
        else:
            print(f"🌬️  Presión: ERROR (Sensor no detectado)")
            
        print(f"🫁 Calidad del aire: {'MALA' if aire_malo else 'BUENA'} ({ppm} ppm)")
        print(f"🔔 Buzzer: {'ON' if buzzer_state else 'OFF'}")
        print("--------------------------\n")

        # Mostrar ALERTA si hay aire contaminado (igual que allin_w_display.py)
        if aire_malo:
            self.activar_alerta("Aire contaminado")
            self.clear()
            self.write_string("⚠️ Aire contaminado ⚠️")
            self.set_cursor(1, 0)
            self.write_string("Toma precauciones")
            time.sleep(0.5)
            self.pantalla_actual = (self.pantalla_actual + 1) % 6
            return

        # Mostrar datos rotativos EXACTAMENTE como allin_w_display.py
        self.clear()
        if self.pantalla_actual == 0:
            self.write_string("Temperatura:")
            self.set_cursor(1, 0)
            self.write_string(f"{temp or '-'} °C")
        elif self.pantalla_actual == 1:
            self.write_string("Humedad:")
            self.set_cursor(1, 0)
            self.write_string(f"{hum or '-'} %")
        elif self.pantalla_actual == 2:
            self.write_string("Iluminacion:")
            self.set_cursor(1, 0)
            if lux is not None:
                self.write_string(f"{lux} lux")
            else:
                self.write_string("ERROR - Sin sensor")
        elif self.pantalla_actual == 3:
            self.write_string("Presion:")
            self.set_cursor(1, 0)
            if presion is not None:
                self.write_string(f"{presion:.1f} hPa")
            else:
                self.write_string("ERROR - Sin sensor")
        elif self.pantalla_actual == 4:
            self.write_string("Presencia:")
            self.set_cursor(1, 0)
            self.write_string(f"{distancia} cm")
        elif self.pantalla_actual == 5:
            self.write_string("Calidad del aire:")
            self.set_cursor(1, 0)
            self.write_string(f"{ppm} ppm")

        # Avanzar a la siguiente pantalla (igual que allin_w_display.py)
        self.pantalla_actual = (self.pantalla_actual + 1) % 6

    def activar_alerta(self, mensaje):
        """Activa una alerta en el LCD"""
        self.clear()
        self.write_string(f"⚠️ {mensaje} ⚠️")
        time.sleep(0.5)

    def check_and_display_alerts(self, sensor_data: Dict[str, Any]):
        """Verifica y muestra alertas críticas como en allin_w_display.py"""
        temp = sensor_data.get('temperature')
        hum = sensor_data.get('humidity')
        lux = sensor_data.get('light_lux')
        presion = sensor_data.get('pressure')

        # Alertas críticas con mensajes EXACTOS de allin_w_display.py
        if temp is not None and temp > 30:
            self.activar_alerta("Temp. muy alta")

        if hum is not None and hum > 0.50:  # 50% como en el original
            self.activar_alerta("Humedad alta")

        if lux is not None and lux < 700:
            self.activar_alerta("No hay luz")

        if presion is not None and (presion < 980 or presion > 1030):
            self.activar_alerta("Presion anormal")

    def display_message(self, message: str):
        """Muestra un mensaje simple"""
        self.clear()
        self.write_at(0, 0, message)
    
    def display_shutdown(self):
        """Muestra mensaje de apagado"""
        self.clear()
        self.write_at(0, 0, "Sistema apagado")


class SimulatedLCD:
    """Simula el display LCD en consola"""
    
    def __init__(self, cols: int = 20, rows: int = 4):
        self.cols = cols
        self.rows = rows
        self.content = [""] * rows
        self.current_row = 0
        
    def clear(self):
        """Limpia el contenido"""
        self.content = [""] * self.rows
        self.current_row = 0
        
    def cursor_pos(self, pos):
        """Establece posición del cursor"""
        self.current_row = pos[0]
        
    def write_string(self, text: str):
        """Escribe texto y muestra el LCD"""
        if self.current_row < len(self.content):
            self.content[self.current_row] = text[:self.cols]  # Truncar si es muy largo
        self._display_lcd()
            
    def _display_lcd(self):
        """Muestra el LCD en consola"""
        print("\r" + "="*(self.cols + 4))
        print("📟 LCD DISPLAY")
        print("="*(self.cols + 4))
        for i, line in enumerate(self.content):
            padded_line = line.ljust(self.cols)
            print(f"│ {padded_line} │")
        print("="*(self.cols + 4))
        print()  # Línea extra para separar 