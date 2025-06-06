#!/bin/bash

# Script de activación del entorno de sensores DHT11
echo "Activando entorno virtual de sensores..."
source sensor_env/bin/activate

echo "Entorno activado. Scripts disponibles:"
echo "  python sensor_dht11_modern.py      # Versión moderna (recomendada)"
echo "  python sensor_dht11_alternative.py # Versión alternativa"
echo "  python sensor_dht11.py             # Versión original"
echo ""
echo "Para desactivar el entorno, usa: deactivate" 