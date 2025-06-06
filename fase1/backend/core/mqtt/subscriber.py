#!/usr/bin/env python3
"""
MQTT Subscriber - Monitor de Sensores IoT
Escucha y procesa datos de sensores a través de tópicos MQTT
"""

import paho.mqtt.client as mqtt
import json
import datetime
import sqlite3
import os

class SensorMQTTSubscriber:
    def __init__(self, broker_host="broker.hivemq.com", broker_port=1883, grupo="GRUPO1"):
        """
        Inicializa el subscriber MQTT
        
        Args:
            broker_host: Dirección del broker MQTT
            broker_port: Puerto del broker MQTT
            grupo: Identificador del grupo para suscribirse
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.grupo = grupo
        self.client = mqtt.Client()
        self.connected = False
        
        # Configurar callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        
        # Base de datos para almacenar lecturas
        self.init_database()
        
    def init_database(self):
        """Inicializa la base de datos SQLite para almacenar lecturas"""
        self.db_path = "mqtt/sensor_data.db"
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Crear tabla si no existe
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lecturas_sensores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                grupo TEXT NOT NULL,
                dispositivo TEXT NOT NULL,
                sensor TEXT NOT NULL,
                valor REAL NOT NULL,
                unidad TEXT,
                fecha_recepcion TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
        print(f"💾 Base de datos inicializada: {self.db_path}")
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback cuando se conecta al broker"""
        if rc == 0:
            self.connected = True
            print(f"✅ Conectado al broker MQTT: {self.broker_host}:{self.broker_port}")
            
            # Suscribirse a todos los tópicos del grupo
            topico_pattern = f"{self.grupo}/sensores/+/+"
            client.subscribe(topico_pattern, qos=1)
            print(f"🔔 Suscrito a: {topico_pattern}")
            
        else:
            print(f"❌ Error de conexión: {rc}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback cuando se desconecta del broker"""
        self.connected = False
        print("🔌 Desconectado del broker MQTT")
        
    def on_message(self, client, userdata, msg):
        """Callback cuando se recibe un mensaje"""
        try:
            # Decodificar el mensaje
            topico = msg.topic
            payload = json.loads(msg.payload.decode())
            
            # Extraer información del tópico
            partes_topico = topico.split('/')
            if len(partes_topico) >= 4:
                grupo = partes_topico[0]
                dispositivo = partes_topico[2]
                sensor = partes_topico[3]
                
                # Mostrar información recibida
                valor = payload.get('valor', 'N/A')
                unidad = payload.get('unidad', '')
                timestamp = payload.get('timestamp', 'N/A')
                
                print(f"📥 {topico}")
                print(f"   └── {valor} {unidad} [{timestamp}]")
                
                # Guardar en base de datos
                self.guardar_lectura(grupo, dispositivo, sensor, payload)
                
                # Procesar alertas si es necesario
                self.procesar_alertas(dispositivo, sensor, valor)
                
        except Exception as e:
            print(f"❌ Error procesando mensaje: {e}")
            print(f"   Tópico: {msg.topic}")
            print(f"   Payload: {msg.payload}")
            
    def guardar_lectura(self, grupo, dispositivo, sensor, payload):
        """Guarda una lectura en la base de datos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO lecturas_sensores 
                (timestamp, grupo, dispositivo, sensor, valor, unidad, fecha_recepcion)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                payload.get('timestamp', ''),
                grupo,
                dispositivo,
                sensor,
                payload.get('valor', 0),
                payload.get('unidad', ''),
                datetime.datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error guardando en BD: {e}")
            
    def procesar_alertas(self, dispositivo, sensor, valor):
        """Procesa alertas basadas en umbrales de sensores"""
        alertas = []
        
        try:
            # Definir umbrales de alerta
            if sensor == "temperatura":
                if valor > 30:
                    alertas.append(f"🔥 ALERTA: Temperatura alta en {dispositivo}: {valor}°C")
                elif valor < 10:
                    alertas.append(f"🧊 ALERTA: Temperatura baja en {dispositivo}: {valor}°C")
                    
            elif sensor == "humedad":
                if valor > 80:
                    alertas.append(f"💧 ALERTA: Humedad alta en {dispositivo}: {valor}%")
                elif valor < 20:
                    alertas.append(f"🏜️ ALERTA: Humedad baja en {dispositivo}: {valor}%")
                    
            elif sensor == "movimiento" and valor:
                alertas.append(f"🚶 DETECCIÓN: Movimiento en {dispositivo}")
                
            # Mostrar alertas
            for alerta in alertas:
                print(f"⚠️  {alerta}")
                
        except Exception as e:
            print(f"❌ Error procesando alertas: {e}")
            
    def connect(self):
        """Conecta al broker MQTT"""
        try:
            print(f"🔄 Conectando a {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            
            # Esperar a que se establezca la conexión
            import time
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.5)
                timeout -= 0.5
                
            if not self.connected:
                raise Exception("Timeout en la conexión")
                
        except Exception as e:
            print(f"❌ Error conectando: {e}")
            return False
        return True
        
    def disconnect(self):
        """Desconecta del broker MQTT"""
        self.client.loop_stop()
        self.client.disconnect()
        
    def mostrar_estadisticas(self):
        """Muestra estadísticas de la base de datos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Contar total de lecturas
            cursor.execute("SELECT COUNT(*) FROM lecturas_sensores")
            total = cursor.fetchone()[0]
            
            # Contar por dispositivo
            cursor.execute('''
                SELECT dispositivo, COUNT(*) 
                FROM lecturas_sensores 
                GROUP BY dispositivo
            ''')
            por_dispositivo = cursor.fetchall()
            
            # Últimas 5 lecturas
            cursor.execute('''
                SELECT dispositivo, sensor, valor, unidad, timestamp
                FROM lecturas_sensores 
                ORDER BY fecha_recepcion DESC 
                LIMIT 5
            ''')
            ultimas = cursor.fetchall()
            
            conn.close()
            
            print("\n📊 ESTADÍSTICAS")
            print("=" * 30)
            print(f"Total de lecturas: {total}")
            print("\nPor dispositivo:")
            for dispositivo, count in por_dispositivo:
                print(f"  {dispositivo}: {count} lecturas")
                
            print("\nÚltimas 5 lecturas:")
            for lectura in ultimas:
                dispositivo, sensor, valor, unidad, timestamp = lectura
                print(f"  {dispositivo}/{sensor}: {valor} {unidad}")
                
        except Exception as e:
            print(f"❌ Error mostrando estadísticas: {e}")
            
    def escuchar(self):
        """Escucha mensajes MQTT de forma continua"""
        print("👂 Escuchando mensajes MQTT...")
        print("Presiona Ctrl+C para detener...")
        
        try:
            while True:
                import time
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo subscriber...")
            self.mostrar_estadisticas()


def main():
    """Función principal"""
    print("📡 MQTT Subscriber - Monitor de Sensores IoT")
    print("=" * 50)
    
    # Crear subscriber
    subscriber = SensorMQTTSubscriber(
        broker_host="broker.hivemq.com",
        grupo="GRUPO2"  # Cambia esto por tu número de grupo
    )
    
    # Conectar al broker
    if subscriber.connect():
        # Escuchar mensajes
        subscriber.escuchar()
    
    # Limpiar al salir
    subscriber.disconnect()
    print("👋 Subscriber desconectado")


if __name__ == "__main__":
    main() 