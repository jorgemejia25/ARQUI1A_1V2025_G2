#!/usr/bin/env python3
"""
MQTT Publisher - Simulador de Sensores IoT
Publica datos de sensores a través de tópicos MQTT
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import datetime
from threading import Thread

class SensorMQTTPublisher:
    def __init__(self, broker_host="broker.hivemq.com", broker_port=1883, grupo="GRUPO1"):
        """
        Inicializa el publisher MQTT
        
        Args:
            broker_host: Dirección del broker MQTT
            broker_port: Puerto del broker MQTT  
            grupo: Identificador del grupo para el tópico
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.grupo = grupo
        self.client = mqtt.Client()
        self.connected = False
        
        # Configurar callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_publish = self.on_publish
        
        # Configurar sensores simulados
        self.sensores = {
            "rasp01": {"temperatura": 20.0, "humedad": 50.0},
            "rasp02": {"temperatura": 22.0, "humedad": 45.0},
            "arduino01": {"luz": 300, "movimiento": False}
        }
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback cuando se conecta al broker"""
        if rc == 0:
            self.connected = True
            print(f"✅ Conectado al broker MQTT: {self.broker_host}:{self.broker_port}")
        else:
            print(f"❌ Error de conexión: {rc}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback cuando se desconecta del broker"""
        self.connected = False
        print(f"🔌 Desconectado del broker MQTT")
        
    def on_publish(self, client, userdata, mid):
        """Callback cuando se publica un mensaje"""
        print(f"📤 Mensaje publicado (ID: {mid})")
        
    def connect(self):
        """Conecta al broker MQTT"""
        try:
            print(f"🔄 Conectando a {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            
            # Esperar a que se establezca la conexión
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
        
    def simular_temperatura(self, base_temp):
        """Simula lecturas de temperatura con variación realista"""
        variacion = random.uniform(-2, 2)
        return round(base_temp + variacion, 2)
        
    def simular_humedad(self, base_humedad):
        """Simula lecturas de humedad"""
        variacion = random.uniform(-5, 5)
        return round(max(0, min(100, base_humedad + variacion)), 2)
        
    def simular_luz(self, base_luz):
        """Simula lecturas de sensor de luz"""
        variacion = random.randint(-50, 50)
        return max(0, min(1023, base_luz + variacion))
        
    def simular_movimiento(self):
        """Simula detección de movimiento"""
        return random.choice([True, False]) if random.random() > 0.8 else False
        
    def publicar_sensor(self, dispositivo, sensor, valor):
        """
        Publica datos de un sensor específico
        
        Args:
            dispositivo: Nombre del dispositivo (ej: rasp01)
            sensor: Tipo de sensor (ej: temperatura)  
            valor: Valor a publicar
        """
        # Formato del tópico: GRUPO#/sensores/dispositivo/tipo_sensor
        topico = f"{self.grupo}/sensores/{dispositivo}/{sensor}"
        
        # Crear payload con metadatos
        payload = {
            "valor": valor,
            "timestamp": datetime.datetime.now().isoformat(),
            "dispositivo": dispositivo,
            "sensor": sensor,
            "unidad": self.obtener_unidad(sensor)
        }
        
        # Publicar como JSON
        mensaje = json.dumps(payload)
        
        try:
            result = self.client.publish(topico, mensaje, qos=1)
            print(f"📡 {topico}: {valor} {payload['unidad']}")
            return result.mid
        except Exception as e:
            print(f"❌ Error publicando: {e}")
            return None
            
    def obtener_unidad(self, sensor):
        """Retorna la unidad de medida según el tipo de sensor"""
        unidades = {
            "temperatura": "°C",
            "humedad": "%",
            "luz": "lux",
            "movimiento": "bool"
        }
        return unidades.get(sensor, "")
        
    def ciclo_publicacion(self, intervalo=5):
        """
        Ciclo principal de publicación de datos
        
        Args:
            intervalo: Segundos entre publicaciones
        """
        print(f"🚀 Iniciando ciclo de publicación cada {intervalo} segundos")
        print("Presiona Ctrl+C para detener...")
        
        try:
            while True:
                # Publicar datos de todos los sensores
                for dispositivo, sensores in self.sensores.items():
                    for tipo_sensor, valor_base in sensores.items():
                        
                        # Simular nuevo valor según el tipo de sensor
                        if tipo_sensor == "temperatura":
                            nuevo_valor = self.simular_temperatura(valor_base)
                        elif tipo_sensor == "humedad": 
                            nuevo_valor = self.simular_humedad(valor_base)
                        elif tipo_sensor == "luz":
                            nuevo_valor = self.simular_luz(valor_base)
                        elif tipo_sensor == "movimiento":
                            nuevo_valor = self.simular_movimiento()
                        else:
                            nuevo_valor = valor_base
                            
                        # Publicar el valor
                        self.publicar_sensor(dispositivo, tipo_sensor, nuevo_valor)
                        
                        # Actualizar valor base para próxima iteración
                        if tipo_sensor in ["temperatura", "humedad", "luz"]:
                            self.sensores[dispositivo][tipo_sensor] = nuevo_valor
                            
                        time.sleep(0.5)  # Pequeña pausa entre sensores
                        
                print(f"⏱️  Esperando {intervalo} segundos...\n")
                time.sleep(intervalo)
                
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo publicación...")
        except Exception as e:
            print(f"❌ Error en ciclo de publicación: {e}")


def main():
    """Función principal"""
    print("🌡️  MQTT Publisher - Simulador de Sensores IoT")
    print("=" * 50)
    
    # Crear publisher
    publisher = SensorMQTTPublisher(
        broker_host="broker.hivemq.com",  # Broker público gratuito
        grupo="GRUPO2"  # Cambia esto por tu número de grupo
    )
    
    # Conectar al broker
    if publisher.connect():
        # Iniciar publicación
        publisher.ciclo_publicacion(intervalo=3)
    
    # Limpiar al salir
    publisher.disconnect()
    print("👋 Publisher desconectado")


if __name__ == "__main__":
    main() 