"""
Gestor de display del Sistema SIEPA
Abstrae la lógica de display LCD real y simulado
"""

from typing import Dict, Any
from config import DISPLAY_CONFIG

class DisplayManager:
    """Gestor del display LCD"""
    
    def __init__(self, mode: str = 'testing'):
        self.mode = mode
        self.config = DISPLAY_CONFIG
        
        if mode == 'real':
            self._init_real_display()
        else:
            self._init_simulated_display()
    
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
    
    def clear(self):
        """Limpia el display"""
        self.lcd.clear()
    
    def set_cursor(self, row: int, col: int = 0):
        """Posiciona el cursor"""
        if self.mode == 'real':
            self.lcd.cursor_pos = (row, col)
        else:
            self.lcd.cursor_pos((row, col))
    
    def write(self, text: str):
        """Escribe texto en la posición actual"""
        if self.mode == 'real':
            self.lcd.write_string(text)
        else:
            self.lcd.write_string(text)
    
    def write_at(self, row: int, col: int, text: str):
        """Escribe texto en una posición específica"""
        self.set_cursor(row, col)
        self.write(text)
    
    def display_sensor_data(self, sensor_data: Dict[str, Any]):
        """Muestra datos de sensores en formato igual que allin.py"""
        # Mostrar en consola igual que allin.py
        temp = sensor_data.get('temperature')
        hum = sensor_data.get('humidity')
        distance = sensor_data.get('distance')
        voltaje_ldr = sensor_data.get('light_voltage', 0)
        voltaje_mq135 = sensor_data.get('air_quality_voltage', 0)
        hay_luz = sensor_data.get('light', False)
        aire_malo = sensor_data.get('air_quality_bad', False)
        buzzer_state = sensor_data.get('buzzer_state', False)

        print("----- Lectura actual -----")
        print(f"🌡️  Temperatura: {temp or '-'} °C")
        print(f"💧 Humedad: {hum or '-'} %")
        print(f"📏 Distancia: {distance} cm")
        print(f"💡 Luz: {'SI' if hay_luz else 'NO'} ({voltaje_ldr:.2f} V)")
        print(f"🫁 Calidad del aire: {'MALA' if aire_malo else 'BUENA'} ({voltaje_mq135:.2f} V)")
        print(f"🔔 Buzzer: {'ON' if buzzer_state else 'OFF'}")
        print("--------------------------\n")
        
        # También mostrar en LCD si está disponible
        if hasattr(self, 'lcd'):
            self.clear()
            
            # Línea 1: Temperatura y Humedad
            self.write_at(0, 0, f"T:{temp or '-'}C H:{hum or '-'}%")
            
            # Línea 2: Distancia
            self.write_at(1, 0, f"Dist: {distance} cm")
            
            # Línea 3: Luz con voltaje
            self.write_at(2, 0, f"Luz:{'SI' if hay_luz else 'NO'} {voltaje_ldr:.1f}V")
            
            # Línea 4: Calidad del aire con voltaje
            self.write_at(3, 0, f"Aire:{'MALO' if aire_malo else 'OK'} {voltaje_mq135:.1f}V")
    
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
        
    def cursor_pos(self, pos):
        """Establece posición del cursor"""
        self.current_row = pos[0]
        
    def write_string(self, text: str):
        """Escribe texto y muestra el LCD"""
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