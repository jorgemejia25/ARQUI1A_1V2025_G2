#!/bin/bash
"""
Script de Instalación Optimizado para Raspberry Pi
Sistema SIEPA - Versión optimizada para hardware limitado
"""

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Información del sistema
echo -e "${BLUE}🚀 INSTALACIÓN OPTIMIZADA PARA RASPBERRY PI${NC}"
echo -e "${BLUE}=================================================${NC}"
echo "Sistema SIEPA - Versión optimizada para hardware limitado"
echo "Fecha: $(date)"
echo "Usuario: $(whoami)"
echo "Directorio: $(pwd)"
echo ""

# Verificar que estamos en Raspberry Pi
check_raspberry_pi() {
    echo -e "${YELLOW}🔍 Verificando hardware...${NC}"
    
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Advertencia: No se detectó Raspberry Pi${NC}"
        echo "Este script está optimizado para Raspberry Pi"
        read -p "¿Continuar de todos modos? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Raspberry Pi detectado${NC}"
        
        # Mostrar información del hardware
        RPI_MODEL=$(grep "Model" /proc/cpuinfo | cut -d':' -f2 | xargs)
        RPI_MEMORY=$(grep "MemTotal" /proc/meminfo | cut -d':' -f2 | xargs)
        echo "   Modelo: $RPI_MODEL"
        echo "   Memoria: $RPI_MEMORY"
    fi
    echo ""
}

# Optimizar configuración del sistema para Raspberry Pi
optimize_system() {
    echo -e "${YELLOW}⚡ Optimizando configuración del sistema...${NC}"
    
    # Crear archivo de configuración de swap optimizado
    if [ ! -f /etc/dphys-swapfile.bak ]; then
        sudo cp /etc/dphys-swapfile /etc/dphys-swapfile.bak 2>/dev/null || true
    fi
    
    # Configurar swap para mejor rendimiento con SQLite
    sudo tee /tmp/swapfile_config > /dev/null << EOF
# Configuración optimizada para SIEPA
CONF_SWAPSIZE=512
CONF_SWAPFACTOR=1
CONF_MAXSWAP=512
EOF
    
    if sudo cp /tmp/swapfile_config /etc/dphys-swapfile 2>/dev/null; then
        echo -e "${GREEN}   ✅ Configuración de swap optimizada${NC}"
        sudo systemctl restart dphys-swapfile || true
    else
        echo -e "${YELLOW}   ⚠️  No se pudo optimizar swap (continúa sin problemas)${NC}"
    fi
    
    # Configurar límites de memoria para procesos Python
    if [ ! -f /etc/security/limits.conf.bak ]; then
        sudo cp /etc/security/limits.conf /etc/security/limits.conf.bak 2>/dev/null || true
    fi
    
    # Agregar límites si no existen
    if ! grep -q "# SIEPA optimizations" /etc/security/limits.conf 2>/dev/null; then
        sudo tee -a /etc/security/limits.conf > /dev/null << EOF

# SIEPA optimizations for Raspberry Pi
* soft memlock 64
* hard memlock 64
* soft nproc 1024
* hard nproc 2048
EOF
        echo -e "${GREEN}   ✅ Límites de sistema configurados${NC}"
    fi
    
    echo ""
}

# Instalar dependencias optimizadas
install_dependencies() {
    echo -e "${YELLOW}📦 Instalando dependencias optimizadas...${NC}"
    
    # Actualizar repositorios
    echo "   Actualizando repositorios..."
    sudo apt-get update -qq
    
    # Instalar dependencias del sistema optimizadas para Raspberry Pi
    echo "   Instalando dependencias del sistema..."
    sudo apt-get install -y \
        python3-dev \
        python3-pip \
        python3-venv \
        build-essential \
        libsqlite3-dev \
        sqlite3 \
        i2c-tools \
        python3-smbus \
        libgpiod-dev \
        git \
        htop \
        iotop \
        --no-install-recommends
    
    echo -e "${GREEN}   ✅ Dependencias del sistema instaladas${NC}"
    echo ""
}

# Crear entorno virtual optimizado
setup_virtual_environment() {
    echo -e "${YELLOW}🐍 Configurando entorno virtual Python optimizado...${NC}"
    
    # Crear entorno virtual si no existe
    if [ ! -d "venv" ]; then
        echo "   Creando entorno virtual..."
        python3 -m venv venv --system-site-packages
        echo -e "${GREEN}   ✅ Entorno virtual creado${NC}"
    else
        echo -e "${GREEN}   ✅ Entorno virtual ya existe${NC}"
    fi
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Actualizar pip a versión optimizada
    echo "   Actualizando pip..."
    pip install --upgrade pip setuptools wheel --quiet
    
    # Instalar dependencias específicas para Raspberry Pi
    echo "   Instalando dependencias Python optimizadas..."
    
    # Crear requirements optimizado para Raspberry Pi
    cat > requirements_rpi.txt << EOF
# Dependencias core optimizadas para Raspberry Pi
paho-mqtt>=1.6.0,<2.0.0

# Base de datos SQLite (incluida en Python)
# sqlite3 - incluido por defecto

# Dependencias para Raspberry Pi con versiones específicas
RPi.GPIO>=0.7.0,<0.8.0
adafruit-circuitpython-dht>=3.7.0,<4.0.0
adafruit-circuitpython-mcp3xxx>=1.4.0,<2.0.0
adafruit-circuitpython-bmp280>=3.2.0,<4.0.0
RPLCD>=1.3.0,<2.0.0
adafruit-blinka>=8.0.0,<9.0.0

# Logging y configuración
python-dotenv>=0.19.0,<1.0.0

# Desarrollo y testing (opcional)
pytest>=7.0.0,<8.0.0
EOF
    
    # Instalar con timeouts optimizados para Raspberry Pi
    pip install -r requirements_rpi.txt \
        --timeout 300 \
        --retries 3 \
        --quiet \
        --no-cache-dir
    
    echo -e "${GREEN}   ✅ Dependencias Python instaladas${NC}"
    echo ""
}

# Crear estructura de directorios optimizada
create_directory_structure() {
    echo -e "${YELLOW}📁 Creando estructura de directorios optimizada...${NC}"
    
    # Crear directorios necesarios
    mkdir -p data
    mkdir -p logs
    mkdir -p config/production
    mkdir -p scripts
    mkdir -p backups
    
    # Configurar permisos optimizados
    chmod 755 data logs config scripts backups
    chmod 644 config/* 2>/dev/null || true
    
    echo -e "${GREEN}   ✅ Estructura de directorios creada${NC}"
    echo ""
}

# Configurar base de datos optimizada
setup_database() {
    echo -e "${YELLOW}💾 Configurando base de datos optimizada para Raspberry Pi...${NC}"
    
    # Crear base de datos de prueba con configuraciones optimizadas
    sqlite3 data/sensor_history.db << EOF
-- Configurar SQLite para Raspberry Pi
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 67108864; -- 64MB
PRAGMA page_size = 4096;

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp REAL NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(sensor_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data(timestamp);

-- Insertar datos de prueba
INSERT INTO sensor_data (sensor_type, value, timestamp, metadata) VALUES
('temperature', 23.5, strftime('%s','now'), '{"unit":"°C"}'),
('humidity', 65.2, strftime('%s','now'), '{"unit":"%"}'),
('pressure', 1013.25, strftime('%s','now'), '{"unit":"hPa"}');

-- Verificar configuración
SELECT 'Base de datos configurada correctamente' as status;
EOF
    
    echo -e "${GREEN}   ✅ Base de datos configurada y optimizada${NC}"
    echo ""
}

# Crear scripts de servicio
create_service_scripts() {
    echo -e "${YELLOW}🔧 Creando scripts de servicio optimizados...${NC}"
    
    # Script de inicio optimizado
    cat > scripts/start_siepa.sh << 'EOF'
#!/bin/bash
# Script de inicio optimizado para Raspberry Pi

cd "$(dirname "$0")/.."
source venv/bin/activate

# Configurar variables de entorno para Raspberry Pi
export PYTHONPATH="$(pwd):$PYTHONPATH"
export SIEPA_MODE="${SIEPA_MODE:-real}"
export SIEPA_MQTT="${SIEPA_MQTT:-true}"
export SIEPA_LOG_LEVEL="${SIEPA_LOG_LEVEL:-INFO}"

# Configurar límites de recursos
ulimit -v 524288  # Límite de memoria virtual: 512MB
ulimit -n 1024    # Límite de descriptores de archivo

echo "🚀 Iniciando Sistema SIEPA optimizado para Raspberry Pi..."
echo "   Modo: $SIEPA_MODE"
echo "   MQTT: $SIEPA_MQTT"
echo "   Log Level: $SIEPA_LOG_LEVEL"

# Iniciar con handling de errores
if python3 main.py --mode "$SIEPA_MODE" ${SIEPA_MQTT:+--mqtt}; then
    echo "✅ Sistema SIEPA finalizado correctamente"
else
    echo "❌ Error en Sistema SIEPA - Código de salida: $?"
    exit 1
fi
EOF
    
    # Script de monitoreo
    cat > scripts/monitor_siepa.sh << 'EOF'
#!/bin/bash
# Script de monitoreo del sistema para Raspberry Pi

echo "📊 MONITOREO DEL SISTEMA SIEPA"
echo "==============================="
echo "Fecha: $(date)"
echo ""

# Información del sistema
echo "💻 SISTEMA:"
echo "   Uptime: $(uptime -p)"
echo "   Load: $(uptime | cut -d',' -f3- | cut -d':' -f2)"
echo "   Memoria: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "   Disco: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " usado)"}')"
echo ""

# Información de la base de datos
if [ -f "data/sensor_history.db" ]; then
    echo "💾 BASE DE DATOS:"
    echo "   Tamaño: $(du -h data/sensor_history.db | cut -f1)"
    echo "   Registros: $(sqlite3 data/sensor_history.db 'SELECT COUNT(*) FROM sensor_data;')"
    echo "   Último registro: $(sqlite3 data/sensor_history.db 'SELECT datetime(MAX(timestamp), "unixepoch", "localtime") FROM sensor_data;')"
    echo ""
fi

# Procesos Python
echo "🐍 PROCESOS PYTHON:"
ps aux | grep python | grep -v grep | head -5
echo ""

# Logs recientes
if [ -f "siepa_system.log" ]; then
    echo "📝 LOGS RECIENTES (últimas 5 líneas):"
    tail -5 siepa_system.log
fi
EOF
    
    # Script de limpieza
    cat > scripts/cleanup_siepa.sh << 'EOF'
#!/bin/bash
# Script de limpieza optimizado para Raspberry Pi

echo "🧹 Limpieza del Sistema SIEPA"
echo "============================="

# Limpiar logs antiguos (más de 7 días)
find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
echo "✅ Logs antiguos limpiados"

# Limpiar datos de la base de datos (más de 7 días)
if [ -f "data/sensor_history.db" ]; then
    CUTOFF_TIME=$(date -d '7 days ago' +%s)
    sqlite3 data/sensor_history.db "DELETE FROM sensor_data WHERE timestamp < $CUTOFF_TIME;"
    sqlite3 data/sensor_history.db "VACUUM;"
    echo "✅ Base de datos optimizada"
fi

# Limpiar caché de Python
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
echo "✅ Caché de Python limpiado"

# Mostrar estadísticas finales
echo ""
echo "📊 Estadísticas post-limpieza:"
echo "   Espacio libre: $(df -h / | tail -1 | awk '{print $4}')"
if [ -f "data/sensor_history.db" ]; then
    echo "   Registros en BD: $(sqlite3 data/sensor_history.db 'SELECT COUNT(*) FROM sensor_data;')"
fi
EOF
    
    # Hacer scripts ejecutables
    chmod +x scripts/*.sh
    
    echo -e "${GREEN}   ✅ Scripts de servicio creados${NC}"
    echo ""
}

# Crear configuración de producción
create_production_config() {
    echo -e "${YELLOW}⚙️  Creando configuración de producción...${NC}"
    
    # Archivo de configuración para producción
    cat > config/production/settings.py << 'EOF'
"""
Configuración de producción optimizada para Raspberry Pi
"""

import os

# Configuración optimizada para Raspberry Pi
RASPBERRY_PI_OPTIMIZATIONS = {
    'ENABLE_GPIO_CLEANUP': True,
    'MEMORY_LIMIT_MB': 256,
    'MAX_BUFFER_SIZE': 50,
    'DB_CACHE_SIZE_KB': 10240,  # 10MB
    'SENSOR_READ_INTERVAL': 2.0,  # 2 segundos
    'HISTORY_RETENTION_DAYS': 7,
    'ENABLE_AUTO_CLEANUP': True,
    'LOG_ROTATION_SIZE_MB': 10,
}

# Configuración de la base de datos optimizada
DATABASE_CONFIG = {
    'PATH': 'data/sensor_history.db',
    'WAL_MODE': True,
    'CACHE_SIZE': 10000,
    'SYNCHRONOUS': 'NORMAL',
    'TEMP_STORE': 'MEMORY',
    'MMAP_SIZE': 67108864,  # 64MB
    'PAGE_SIZE': 4096,
}

# Configuración MQTT optimizada
MQTT_CONFIG_PRODUCTION = {
    'BROKER_HOST': os.getenv('MQTT_BROKER', 'broker.hivemq.com'),
    'BROKER_PORT': int(os.getenv('MQTT_PORT', '1883')),
    'KEEPALIVE': 30,
    'QOS': 0,  # QoS 0 para mejor rendimiento
    'RETAIN': False,
    'CLEAN_SESSION': True,
    'RECONNECT_DELAY': 5,
    'MAX_RECONNECT_ATTEMPTS': 10,
}

# Configuración de logging optimizada
LOGGING_CONFIG = {
    'LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
    'FILE_PATH': 'logs/siepa_production.log',
    'MAX_SIZE_MB': 10,
    'BACKUP_COUNT': 3,
    'FORMAT': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
}
EOF
    
    # Variables de entorno para producción
    cat > config/production/.env << 'EOF'
# Configuración de producción para Raspberry Pi
SIEPA_MODE=real
SIEPA_MQTT=true
SIEPA_LOG_LEVEL=INFO
SIEPA_ENVIRONMENT=production

# Configuración MQTT
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883

# Configuración de base de datos
DB_PATH=data/sensor_history.db
DB_RETENTION_DAYS=7

# Configuración de rendimiento
PYTHON_MEMORY_LIMIT=256
SENSOR_BUFFER_SIZE=50
AUTO_CLEANUP_ENABLED=true
EOF
    
    echo -e "${GREEN}   ✅ Configuración de producción creada${NC}"
    echo ""
}

# Configurar systemd service (opcional)
setup_systemd_service() {
    echo -e "${YELLOW}🔧 ¿Desea configurar SIEPA como servicio del sistema? (recomendado)${NC}"
    read -p "Esto permitirá que SIEPA se inicie automáticamente (s/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        SCRIPT_DIR=$(pwd)
        
        # Crear archivo de servicio
        sudo tee /etc/systemd/system/siepa.service > /dev/null << EOF
[Unit]
Description=Sistema SIEPA - Monitoreo Ambiental
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$SCRIPT_DIR
Environment=PATH=$SCRIPT_DIR/venv/bin
ExecStart=$SCRIPT_DIR/scripts/start_siepa.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Límites de recursos para Raspberry Pi
MemoryLimit=512M
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOF
        
        # Habilitar y configurar servicio
        sudo systemctl daemon-reload
        sudo systemctl enable siepa.service
        
        echo -e "${GREEN}   ✅ Servicio systemd configurado${NC}"
        echo "   Para controlar el servicio use:"
        echo "   • sudo systemctl start siepa    # Iniciar"
        echo "   • sudo systemctl stop siepa     # Detener"
        echo "   • sudo systemctl status siepa   # Estado"
        echo "   • journalctl -u siepa -f        # Ver logs"
    else
        echo -e "${YELLOW}   ⚠️  Servicio systemd no configurado${NC}"
    fi
    echo ""
}

# Ejecutar pruebas del sistema
run_system_tests() {
    echo -e "${YELLOW}🧪 Ejecutando pruebas del sistema optimizado...${NC}"
    
    source venv/bin/activate
    
    # Prueba 1: Importación de módulos
    echo "   Probando importación de módulos..."
    python3 -c "
import sys
sys.path.insert(0, '.')
try:
    from core.history.history_manager import HistoryManager
    from core.system import SIEPASystem
    print('✅ Módulos importados correctamente')
except ImportError as e:
    print(f'❌ Error importando módulos: {e}')
    sys.exit(1)
"
    
    # Prueba 2: Base de datos
    echo "   Probando base de datos..."
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('data/sensor_history.db')
    cursor = conn.execute('SELECT COUNT(*) FROM sensor_data')
    count = cursor.fetchone()[0]
    conn.close()
    print(f'✅ Base de datos funcional ({count} registros)')
except Exception as e:
    print(f'❌ Error en base de datos: {e}')
    exit(1)
"
    
    # Prueba 3: Sistema de archivos
    echo "   Probando permisos de archivos..."
    if [ -w "data/" ] && [ -w "logs/" ]; then
        echo "✅ Permisos de archivos correctos"
    else
        echo "❌ Problemas con permisos de archivos"
        exit 1
    fi
    
    echo -e "${GREEN}   ✅ Todas las pruebas pasaron${NC}"
    echo ""
}

# Mostrar resumen final
show_final_summary() {
    echo -e "${GREEN}🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE${NC}"
    echo -e "${GREEN}=======================================${NC}"
    echo ""
    echo "📋 Resumen de la instalación:"
    echo "   • Sistema optimizado para Raspberry Pi"
    echo "   • Base de datos SQLite configurada"
    echo "   • Scripts de servicio creados"
    echo "   • Configuración de producción lista"
    echo ""
    echo "🚀 Para iniciar el sistema:"
    echo "   cd $(pwd)"
    echo "   ./scripts/start_siepa.sh"
    echo ""
    echo "📊 Para monitorear el sistema:"
    echo "   ./scripts/monitor_siepa.sh"
    echo ""
    echo "🧹 Para limpiar datos antiguos:"
    echo "   ./scripts/cleanup_siepa.sh"
    echo ""
    echo "📁 Archivos importantes:"
    echo "   • Base de datos: data/sensor_history.db"
    echo "   • Logs: logs/"
    echo "   • Configuración: config/production/"
    echo ""
    echo -e "${YELLOW}💡 Consejos para Raspberry Pi:${NC}"
    echo "   • Ejecute cleanup regularmente para liberar espacio"
    echo "   • Monitoree el uso de memoria con htop"
    echo "   • Configure un cron job para limpieza automática"
    echo ""
    echo -e "${BLUE}✨ ¡Sistema SIEPA listo para funcionar!${NC}"
}

# Función principal
main() {
    echo "Iniciando instalación optimizada para Raspberry Pi..."
    echo ""
    
    check_raspberry_pi
    optimize_system
    install_dependencies
    setup_virtual_environment
    create_directory_structure
    setup_database
    create_service_scripts
    create_production_config
    setup_systemd_service
    run_system_tests
    show_final_summary
    
    echo ""
    echo -e "${GREEN}✅ Instalación completada en $(date)${NC}"
}

# Ejecutar función principal
main "$@" 