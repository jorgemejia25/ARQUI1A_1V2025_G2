"""
Gestor de Historial Optimizado para Raspberry Pi
Almacenamiento eficiente en SQLite con comunicación MQTT mejorada
"""

import sqlite3
import json
import time
import threading
from typing import Dict, List, Any, Optional
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
import os
import logging

@dataclass
class HistoryPoint:
    sensor_type: str
    value: float
    timestamp: float
    metadata: Optional[Dict[str, Any]] = None

class HistoryManager:
    """Gestor de historial optimizado para Raspberry Pi"""
    
    def __init__(self, db_path: str = "data/sensor_history.db", max_days: int = 7):
        self.db_path = db_path
        self.max_days = max_days
        self.lock = threading.RLock()
        
        # Configurar logging
        self.logger = logging.getLogger(__name__)
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else '.', exist_ok=True)
        
        # Inicializar base de datos
        self._init_database()
        
        # Programar limpieza automática cada hora
        self._schedule_cleanup()
    
    def _init_database(self):
        """Inicializa la base de datos SQLite optimizada"""
        with self._get_connection() as conn:
            # Crear tabla principal con índices optimizados
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sensor_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    timestamp REAL NOT NULL,
                    metadata TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Índices para consultas rápidas
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sensor_timestamp 
                ON sensor_data(sensor_type, timestamp)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON sensor_data(timestamp)
            """)
            
            # Configuraciones para optimizar rendimiento en Raspberry Pi
            conn.execute("PRAGMA journal_mode = WAL")  # Write-Ahead Logging
            conn.execute("PRAGMA synchronous = NORMAL")  # Balance entre velocidad y seguridad
            conn.execute("PRAGMA cache_size = 10000")   # 10MB cache
            conn.execute("PRAGMA temp_store = MEMORY")   # Temporales en memoria
            
            conn.commit()
            print("✅ Base de datos inicializada con optimizaciones para Raspberry Pi")
    
    @contextmanager
    def _get_connection(self):
        """Context manager para conexiones a la base de datos"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=10.0)
            conn.row_factory = sqlite3.Row  # Acceso por nombre de columna
            yield conn
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            print(f"❌ Error de base de datos: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def add_sensor_data(self, sensor_type: str, value: float, metadata: Optional[Dict[str, Any]] = None):
        """Agrega un punto de datos de forma eficiente"""
        try:
            with self.lock:
                current_time = time.time()
                metadata_json = json.dumps(metadata) if metadata else None
                
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT INTO sensor_data (sensor_type, value, timestamp, metadata)
                        VALUES (?, ?, ?, ?)
                    """, (sensor_type, value, current_time, metadata_json))
                    conn.commit()
                
                # Log ocasionalmente para no saturar
                if int(current_time) % 100 == 0:
                    print(f"📊 Datos almacenados: {sensor_type}={value}")
                    
        except Exception as e:
            print(f"❌ Error almacenando datos: {e}")
    
    def add_batch_sensor_data(self, data_points: List[HistoryPoint]):
        """Agrega múltiples puntos de datos en una transacción (más eficiente)"""
        if not data_points:
            return
        
        try:
            with self.lock:
                with self._get_connection() as conn:
                    # Preparar datos para inserción en lote
                    batch_data = [
                        (
                            point.sensor_type,
                            point.value,
                            point.timestamp,
                            json.dumps(point.metadata) if point.metadata else None
                        )
                        for point in data_points
                    ]
                    
                    conn.executemany("""
                        INSERT INTO sensor_data (sensor_type, value, timestamp, metadata)
                        VALUES (?, ?, ?, ?)
                    """, batch_data)
                    conn.commit()
                    
                print(f"📊 Lote de {len(data_points)} puntos almacenado exitosamente")
                
        except Exception as e:
            print(f"❌ Error almacenando lote de datos: {e}")
    
    def get_recent_data(self, 
                       sensor_type: Optional[str] = None, 
                       max_points: int = 100,
                       hours_back: int = 24) -> List[Dict[str, Any]]:
        """Obtiene datos recientes de forma optimizada"""
        try:
            with self.lock:
                cutoff_time = time.time() - (hours_back * 3600)
                
                if sensor_type and sensor_type != 'all':
                    query = """
                        SELECT sensor_type, value, timestamp, metadata
                        FROM sensor_data
                        WHERE sensor_type = ? AND timestamp >= ?
                        ORDER BY timestamp DESC
                        LIMIT ?
                    """
                    params = (sensor_type, cutoff_time, max_points)
                else:
                    query = """
                        SELECT sensor_type, value, timestamp, metadata
                        FROM sensor_data
                        WHERE timestamp >= ?
                        ORDER BY timestamp DESC
                        LIMIT ?
                    """
                    params = (cutoff_time, max_points)
                
                with self._get_connection() as conn:
                    cursor = conn.execute(query, params)
                    results = []
                    
                    for row in cursor:
                        metadata = json.loads(row['metadata']) if row['metadata'] else {}
                        results.append({
                            'sensor_type': row['sensor_type'],
                            'value': row['value'],
                            'timestamp': row['timestamp'],
                            'formatted_time': datetime.fromtimestamp(row['timestamp']).strftime('%H:%M:%S'),
                            **metadata
                        })
                
                print(f"🔍 Recuperados {len(results)} puntos para {sensor_type or 'todos los sensores'}")
                return results
                
        except Exception as e:
            print(f"❌ Error recuperando datos: {e}")
            return []
    
    def get_sensor_stats(self, hours_back: int = 24) -> Dict[str, Dict[str, Any]]:
        """Obtiene estadísticas resumidas por sensor"""
        try:
            with self.lock:
                cutoff_time = time.time() - (hours_back * 3600)
                
                query = """
                    SELECT 
                        sensor_type,
                        COUNT(*) as count,
                        AVG(value) as avg_value,
                        MIN(value) as min_value,
                        MAX(value) as max_value,
                        MAX(timestamp) as last_reading
                    FROM sensor_data
                    WHERE timestamp >= ?
                    GROUP BY sensor_type
                """
                
                with self._get_connection() as conn:
                    cursor = conn.execute(query, (cutoff_time,))
                    stats = {}
                    
                    for row in cursor:
                        stats[row['sensor_type']] = {
                            'count': row['count'],
                            'avg_value': round(row['avg_value'], 2) if row['avg_value'] else 0,
                            'min_value': row['min_value'],
                            'max_value': row['max_value'],
                            'last_reading': row['last_reading'],
                            'last_reading_formatted': datetime.fromtimestamp(row['last_reading']).strftime('%H:%M:%S')
                        }
                
                return stats
                
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return {}
    
    def cleanup_old_data(self):
        """Limpia datos antiguos para mantener el rendimiento"""
        try:
            with self.lock:
                cutoff_time = time.time() - (self.max_days * 24 * 3600)
                
                with self._get_connection() as conn:
                    cursor = conn.execute(
                        "SELECT COUNT(*) FROM sensor_data WHERE timestamp < ?",
                        (cutoff_time,)
                    )
                    old_count = cursor.fetchone()[0]
                    
                    if old_count > 0:
                        conn.execute(
                            "DELETE FROM sensor_data WHERE timestamp < ?",
                            (cutoff_time,)
                        )
                        
                        # Optimizar base de datos después de eliminar
                        conn.execute("VACUUM")
                        conn.commit()
                        
                        print(f"🧹 Limpieza completada: {old_count} registros antiguos eliminados")
                    
        except Exception as e:
            print(f"❌ Error en limpieza: {e}")
    
    def _schedule_cleanup(self):
        """Programa limpieza automática"""
        def cleanup_thread():
            while True:
                time.sleep(3600)  # Cada hora
                self.cleanup_old_data()
        
        cleanup_t = threading.Thread(target=cleanup_thread, daemon=True)
        cleanup_t.start()
        print("🔄 Limpieza automática programada cada hora")
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas de la base de datos"""
        try:
            with self._get_connection() as conn:
                # Tamaño del archivo
                db_size = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0
                
                # Conteo total de registros
                cursor = conn.execute("SELECT COUNT(*) FROM sensor_data")
                total_records = cursor.fetchone()[0]
                
                # Registros por sensor
                cursor = conn.execute("""
                    SELECT sensor_type, COUNT(*) as count
                    FROM sensor_data
                    GROUP BY sensor_type
                """)
                records_by_sensor = dict(cursor.fetchall())
                
                # Rango de fechas
                cursor = conn.execute("""
                    SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest
                    FROM sensor_data
                """)
                time_range = cursor.fetchone()
                
                return {
                    'database_size_mb': round(db_size / 1024 / 1024, 2),
                    'total_records': total_records,
                    'records_by_sensor': records_by_sensor,
                    'oldest_record': datetime.fromtimestamp(time_range['oldest']).isoformat() if time_range['oldest'] else None,
                    'newest_record': datetime.fromtimestamp(time_range['newest']).isoformat() if time_range['newest'] else None,
                    'retention_days': self.max_days
                }
                
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas de BD: {e}")
            return {}
    
    def close(self):
        """Cierra el gestor de historial"""
        print("🔒 Cerrando gestor de historial") 