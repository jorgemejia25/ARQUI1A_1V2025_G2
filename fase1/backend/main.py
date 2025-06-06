#!/usr/bin/env python3
"""
Sistema SIEPA - Punto de entrada principal
Monitoreo de sensores ambientales con display LCD y comunicación MQTT
"""

import argparse
import sys
import os

# Agregar el directorio actual al path para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.system import SIEPASystem

def main():
    parser = argparse.ArgumentParser(
        description='Sistema SIEPA - Monitoreo de Sensores Ambientales',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python main.py                    # Modo testing (por defecto)
  python main.py --mode real        # Modo real (sensores físicos)
  python main.py --mode testing --mqtt  # Testing con MQTT
  python main.py --mode real --mqtt     # Modo completo con MQTT
        """
    )
    
    parser.add_argument(
        '--mode', 
        choices=['real', 'testing'], 
        default='testing',
        help='Modo de ejecución: real (sensores físicos) o testing (datos simulados)'
    )
    
    parser.add_argument(
        '--mqtt',
        action='store_true',
        help='Habilitar comunicación MQTT con el frontend'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='Sistema SIEPA v1.0.0'
    )
    
    args = parser.parse_args()
    
    # Banner de inicio
    print("=" * 60)
    print("🌟 SISTEMA SIEPA - MONITOREO AMBIENTAL")
    print("=" * 60)
    print(f"📋 Modo: {args.mode.upper()}")
    print(f"📡 MQTT: {'HABILITADO' if args.mqtt else 'DESHABILITADO'}")
    print("=" * 60)
    
    try:
        # Crear e iniciar el sistema
        system = SIEPASystem(mode=args.mode, enable_mqtt=args.mqtt)
        system.start()
        
    except ImportError as e:
        print(f"❌ Error al importar módulos: {e}")
        print("💡 Verifique que todas las dependencias estén instaladas")
        if args.mode == 'real':
            print("💡 Para modo 'real' necesita las librerías de Raspberry Pi")
            print("💡 Use --mode testing para pruebas sin hardware")
        sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Programa interrumpido por el usuario")
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 