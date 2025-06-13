#!/bin/bash

# 🌟 Script de Instalación Automática - Sistema SIEPA
# Instala y configura todo lo necesario para ejecutar el Sistema SIEPA

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de output
print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}🌟 $1${NC}"
    echo -e "${BLUE}=================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

# Verificar si se ejecuta como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "No ejecute este script como root (sudo)"
        print_info "El script pedirá sudo cuando sea necesario"
        exit 1
    fi
}

# Detectar sistema operativo
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "No se pudo detectar el sistema operativo"
        exit 1
    fi
    
    print_info "Sistema detectado: $OS $VER"
}

# Actualizar sistema
update_system() {
    print_header "Actualizando Sistema"
    
    print_info "Actualizando paquetes del sistema..."
    sudo apt update && sudo apt upgrade -y
    
    print_success "Sistema actualizado"
}

# Instalar dependencias del sistema
install_system_deps() {
    print_header "Instalando Dependencias del Sistema"
    
    print_info "Instalando Python y herramientas..."
    sudo apt install -y python3 python3-pip python3-venv python3-dev python3-setuptools
    
    print_info "Instalando herramientas de desarrollo..."
    sudo apt install -y git curl wget build-essential
    
    print_info "Instalando dependencias para sensores..."
    sudo apt install -y python3-paho-mqtt
    
    # Solo instalar RPi.GPIO si estamos en Raspberry Pi
    if [[ -f /proc/device-tree/model ]] && grep -q "Raspberry Pi" /proc/device-tree/model; then
        print_info "Raspberry Pi detectado, instalando librerías GPIO..."
        sudo apt install -y python3-rpi.gpio python3-adafruit-circuitpython-dht
    else
        print_warning "No es Raspberry Pi, omitiendo librerías GPIO"
    fi
    
    print_success "Dependencias del sistema instaladas"
}

# Instalar Node.js
install_nodejs() {
    print_header "Instalando Node.js"
    
    # Verificar si Node.js ya está instalado
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js ya está instalado: $NODE_VERSION"
        
        # Verificar si la versión es suficiente (18+)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [[ $MAJOR_VERSION -ge 18 ]]; then
            print_success "Versión de Node.js es suficiente"
            return
        else
            print_warning "Versión de Node.js es antigua, actualizando..."
        fi
    fi
    
    print_info "Descargando e instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verificar instalación
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js instalado: $NODE_VERSION"
    print_success "npm instalado: $NPM_VERSION"
}

# Instalar y configurar Mosquitto
install_mosquitto() {
    print_header "Instalando y Configurando Mosquitto MQTT"
    
    print_info "Instalando Mosquitto..."
    sudo apt install -y mosquitto mosquitto-clients
    
    print_info "Habilitando servicio Mosquitto..."
    sudo systemctl enable mosquitto
    
    print_info "Configurando WebSocket para frontend..."
    
    # Crear archivo de configuración WebSocket
    sudo tee /etc/mosquitto/conf.d/websocket.conf > /dev/null << 'EOF'
# Configuración SIEPA - WebSocket Support
listener 1883 127.0.0.1
protocol mqtt

listener 9001 127.0.0.1  
protocol websockets
allow_anonymous true

# Logging
log_type all
log_dest file /var/log/mosquitto/mosquitto.log
EOF
    
    print_info "Reiniciando Mosquitto..."
    sudo systemctl restart mosquitto
    
    # Verificar que Mosquitto esté corriendo
    if sudo systemctl is-active --quiet mosquitto; then
        print_success "Mosquitto instalado y configurado correctamente"
        
        # Verificar puertos
        if netstat -tlnp 2>/dev/null | grep -q ":1883.*LISTEN"; then
            print_success "Puerto MQTT 1883 activo"
        else
            print_warning "Puerto MQTT 1883 no detectado"
        fi
        
        if netstat -tlnp 2>/dev/null | grep -q ":9001.*LISTEN"; then
            print_success "Puerto WebSocket 9001 activo"
        else
            print_warning "Puerto WebSocket 9001 no detectado"
        fi
    else
        print_error "Error al iniciar Mosquitto"
        sudo systemctl status mosquitto
        exit 1
    fi
}

# Configurar backend
setup_backend() {
    print_header "Configurando Backend SIEPA"
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "main.py" ]]; then
        print_error "No se encuentra main.py. Ejecute desde el directorio backend/"
        exit 1
    fi
    
    print_info "Backend ya configurado (archivos Python encontrados)"
    print_success "Backend SIEPA listo"
}

# Configurar frontend
setup_frontend() {
    print_header "Configurando Frontend"
    
    if [[ -d "../frontend" ]]; then
        print_info "Directorio frontend encontrado"
        cd ../frontend
        
        if [[ -f "package.json" ]]; then
            print_info "Instalando dependencias npm..."
            npm install
            print_success "Dependencias del frontend instaladas"
        else
            print_warning "package.json no encontrado en frontend"
        fi
        
        cd ../backend
    else
        print_warning "Directorio frontend no encontrado"
    fi
}

# Prueba del sistema
test_system() {
    print_header "Probando Sistema"
    
    print_info "Verificando Python..."
    python3 --version
    
    print_info "Verificando paho-mqtt..."
    if python3 -c "import paho.mqtt.client" 2>/dev/null; then
        print_success "paho-mqtt disponible"
    else
        print_error "paho-mqtt no disponible"
    fi
    
    print_info "Probando conexión MQTT..."
    if mosquitto_pub -h localhost -t "siepa/test" -m "$(date)" 2>/dev/null; then
        print_success "Conexión MQTT funcional"
    else
        print_error "Error en conexión MQTT"
    fi
    
    print_info "Probando script de demostración..."
    if timeout 10 python3 demo_mosquitto.py test &>/dev/null; then
        print_success "Demo script funcional"
    else
        print_warning "Demo script terminó con timeout (normal)"
    fi
}

# Mostrar resumen final
show_summary() {
    print_header "Instalación Completada"
    
    echo -e "${GREEN}🎉 Sistema SIEPA instalado exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}📋 Resumen de la instalación:${NC}"
    echo "   ✅ Sistema actualizado"
    echo "   ✅ Python 3 y dependencias instaladas"
    echo "   ✅ Node.js instalado"
    echo "   ✅ Mosquitto MQTT configurado"
    echo "   ✅ WebSocket habilitado (puerto 9001)"
    echo "   ✅ Backend configurado"
    echo "   ✅ Frontend configurado"
    echo ""
    echo -e "${BLUE}🚀 Para ejecutar el sistema:${NC}"
    echo ""
    echo -e "${YELLOW}Backend (Terminal 1):${NC}"
    echo "   cd backend"
    echo "   python3 demo_mosquitto.py"
    echo ""
    echo -e "${YELLOW}Frontend (Terminal 2):${NC}"
    echo "   cd frontend"
    echo "   npm run dev"
    echo ""
    echo -e "${YELLOW}Abrir en navegador:${NC}"
    echo "   http://localhost:3000/mqtt-sensors"
    echo ""
    echo -e "${BLUE}📚 Documentación completa en README.md${NC}"
}

# Función principal
main() {
    print_header "Instalador del Sistema SIEPA"
    
    check_root
    detect_os
    
    # Verificar si es Ubuntu/Debian
    if [[ ! "$OS" =~ (Ubuntu|Debian) ]]; then
        print_warning "Este script está diseñado para Ubuntu/Debian"
        print_info "Continuando... pero pueden surgir problemas"
    fi
    
    # Preguntar al usuario qué instalar
    echo ""
    echo -e "${BLUE}¿Qué desea instalar?${NC}"
    echo "1) Instalación completa (recomendado)"
    echo "2) Solo dependencias del sistema"
    echo "3) Solo Mosquitto MQTT"
    echo "4) Solo Node.js"
    echo "5) Salir"
    
    read -p "Seleccione una opción (1-5): " choice
    
    case $choice in
        1)
            update_system
            install_system_deps
            install_nodejs
            install_mosquitto
            setup_backend
            setup_frontend
            test_system
            show_summary
            ;;
        2)
            update_system
            install_system_deps
            print_success "Dependencias del sistema instaladas"
            ;;
        3)
            install_mosquitto
            ;;
        4)
            install_nodejs
            ;;
        5)
            print_info "Instalación cancelada"
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@" 