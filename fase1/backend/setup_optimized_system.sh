#!/bin/bash

echo "🚀 CONFIGURANDO SISTEMA SIEPA OPTIMIZADO PARA RASPBERRY PI"
echo "========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logs
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en Raspberry Pi
check_raspberry_pi() {
    log_info "Verificando hardware..."
    
    if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        PI_MODEL=$(grep "Model" /proc/cpuinfo | cut -d: -f2 | xargs)
        log_success "Detectado: $PI_MODEL"
        return 0
    else
        log_warning "No se detectó Raspberry Pi - continuando en modo compatible"
        return 1
    fi
}

# Instalar dependencias del sistema
install_system_dependencies() {
    log_info "Instalando dependencias del sistema..."
    
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv git sqlite3
    
    # Dependencias específicas para sensores (si estamos en Pi)
    if command -v raspi-config >/dev/null 2>&1; then
        sudo apt install -y python3-dev python3-smbus i2c-tools
        log_success "Dependencias de Raspberry Pi instaladas"
    fi
}

# Crear entorno virtual
setup_virtual_environment() {
    log_info "Configurando entorno virtual Python..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        log_success "Entorno virtual creado"
    else
        log_info "Entorno virtual ya existe"
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    
    # Instalar dependencias optimizadas
    log_info "Instalando dependencias Python optimizadas..."
    pip install -r requirements.txt
    
    log_success "Dependencias Python instaladas"
}

# Configurar base de datos
setup_database() {
    log_info "Configurando base de datos SQLite..."
    
    mkdir -p data
    
    # Inicializar base de datos ejecutando el history manager
    python3 -c "
from core.history.history_manager import HistoryManager
hm = HistoryManager('data/sensor_history.db')
print('✅ Base de datos inicializada')
hm.close()
"
    
    log_success "Base de datos configurada en data/sensor_history.db"
}

# Crear scripts de servicio
create_service_scripts() {
    log_info "Creando scripts de servicio..."
    
    # Script de inicio
    cat > start_siepa.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Sistema SIEPA..."

# Activar entorno virtual
source venv/bin/activate

# Verificar conectividad
ping -c 1 broker.hivemq.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Conectividad MQTT verificada"
else
    echo "⚠️  Sin conectividad MQTT - funcionará en modo local"
fi

# Iniciar sistema
python3 main.py --mode=production --enable-mqtt

EOF

    # Script de test
    cat > test_siepa.sh << 'EOF'
#!/bin/bash
echo "🧪 Ejecutando tests del Sistema SIEPA..."

source venv/bin/activate

echo "📊 Test de componentes individuales..."
python3 test_history_integration.py

echo "📡 Test de comunicación MQTT..."
python3 debug_mqtt_communication.py

echo "✅ Tests completados"
EOF

    # Script de monitoreo
    cat > monitor_siepa.sh << 'EOF'
#!/bin/bash
echo "📊 Monitor del Sistema SIEPA"
echo "=========================="

# Verificar procesos
if pgrep -f "main.py" > /dev/null; then
    echo "✅ Proceso principal: EJECUTÁNDOSE"
else
    echo "❌ Proceso principal: DETENIDO"
fi

# Verificar base de datos
if [ -f "data/sensor_history.db" ]; then
    DB_SIZE=$(du -h data/sensor_history.db | cut -f1)
    RECORD_COUNT=$(sqlite3 data/sensor_history.db "SELECT COUNT(*) FROM sensor_data;" 2>/dev/null || echo "0")
    echo "📊 Base de datos: $DB_SIZE ($RECORD_COUNT registros)"
else
    echo "❌ Base de datos: NO ENCONTRADA"
fi

# Verificar logs
if [ -f "logs/system.log" ]; then
    LOG_SIZE=$(du -h logs/system.log | cut -f1)
    echo "📝 Logs: $LOG_SIZE"
else
    echo "📝 Logs: NO ENCONTRADOS"
fi

# Verificar conectividad
ping -c 1 broker.hivemq.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "📡 MQTT: CONECTADO"
else
    echo "📡 MQTT: DESCONECTADO"
fi

# Últimas entradas de log
echo ""
echo "📝 Últimas entradas de log:"
tail -n 5 logs/system.log 2>/dev/null || echo "No hay logs disponibles"
EOF

    chmod +x start_siepa.sh test_siepa.sh monitor_siepa.sh
    
    log_success "Scripts de servicio creados"
}

# Configurar servicio systemd (opcional)
setup_systemd_service() {
    read -p "¿Desea configurar SIEPA como servicio del sistema? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Configurando servicio systemd..."
        
        CURRENT_DIR=$(pwd)
        USER=$(whoami)
        
        sudo tee /etc/systemd/system/siepa.service > /dev/null << EOF
[Unit]
Description=Sistema SIEPA - Monitoreo Ambiental
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$CURRENT_DIR/start_siepa.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        sudo systemctl enable siepa.service
        
        log_success "Servicio systemd configurado"
        log_info "Comandos útiles:"
        echo "  sudo systemctl start siepa    # Iniciar servicio"
        echo "  sudo systemctl stop siepa     # Detener servicio"
        echo "  sudo systemctl status siepa   # Ver estado"
        echo "  sudo journalctl -u siepa -f   # Ver logs en tiempo real"
    fi
}

# Verificar instalación
verify_installation() {
    log_info "Verificando instalación..."
    
    # Test básico de importación
    source venv/bin/activate
    
    python3 -c "
try:
    from core.history.history_manager import HistoryManager
    from core.mqtt.mqtt_manager import MQTTManager
    from core.system import SIEPASystem
    print('✅ Todos los módulos importados correctamente')
except ImportError as e:
    print(f'❌ Error de importación: {e}')
    exit(1)
"
    
    if [ $? -eq 0 ]; then
        log_success "Verificación exitosa"
        return 0
    else
        log_error "Error en verificación"
        return 1
    fi
}

# Función principal
main() {
    echo
    log_info "Iniciando configuración del Sistema SIEPA..."
    echo
    
    # Verificar privilegios
    if ! command -v sudo >/dev/null 2>&1; then
        log_error "sudo no disponible. Algunos pasos requerirán privilegios de administrador."
    fi
    
    # Ejecutar pasos de configuración
    check_raspberry_pi
    
    install_system_dependencies
    if [ $? -ne 0 ]; then
        log_error "Error instalando dependencias del sistema"
        exit 1
    fi
    
    setup_virtual_environment
    if [ $? -ne 0 ]; then
        log_error "Error configurando entorno virtual"
        exit 1
    fi
    
    setup_database
    if [ $? -ne 0 ]; then
        log_error "Error configurando base de datos"
        exit 1
    fi
    
    create_service_scripts
    
    setup_systemd_service
    
    verify_installation
    if [ $? -ne 0 ]; then
        log_error "La verificación falló. Revisar la instalación."
        exit 1
    fi
    
    # Mensaje final
    echo
    echo "========================================================="
    log_success "¡SISTEMA SIEPA CONFIGURADO EXITOSAMENTE!"
    echo
    log_info "Próximos pasos:"
    echo "  1. Ejecutar: ./test_siepa.sh (para verificar funcionamiento)"
    echo "  2. Ejecutar: ./start_siepa.sh (para iniciar el sistema)"
    echo "  3. Monitorear: ./monitor_siepa.sh (para ver estado del sistema)"
    echo
    log_info "Para el frontend, ir a la carpeta frontend/ y ejecutar:"
    echo "  npm install && npm run dev"
    echo
    log_info "Debug disponible en: http://localhost:3000/debug"
    echo "========================================================="
}

# Ejecutar configuración
main "$@" 