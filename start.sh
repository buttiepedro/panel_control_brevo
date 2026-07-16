#!/bin/bash

# Panel de Control Brevo - Startup Script
# Uso: ./start.sh [comando]

set -e

echo "🎛️ Panel de Control - Brevo"
echo "============================"
echo ""

case "${1:-up}" in
  up)
    echo "🐳 Levantando aplicación con Docker Compose..."
    [ ! -f .env ] && echo "📋 Creando .env..." && cp .env.example .env
    docker-compose up -d
    echo "✅ Aplicación levantada en http://localhost:3000"
    echo "Ver logs: ./start.sh logs"
    ;;
  
  down)
    echo "🛑 Deteniendo aplicación..."
    docker-compose down
    echo "✅ Aplicación detenida"
    ;;
  
  restart)
    echo "🔄 Reiniciando..."
    docker-compose restart
    echo "✅ Aplicación reiniciada"
    ;;
  
  logs)
    docker-compose logs -f
    ;;
  
  build)
    echo "🏗️ Reconstruyendo imagen..."
    docker-compose build --no-cache
    echo "✅ Imagen reconstruida"
    ;;
  
  clean)
    echo "⚠️ Eliminando datos..."
    docker-compose down -v
    echo "✅ Datos eliminados"
    ;;
  
  *)
    echo "Uso: ./start.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  up          Levantar (por defecto)"
    echo "  down        Detener"
    echo "  restart     Reiniciar"
    echo "  logs        Ver logs"
    echo "  build       Reconstruir imagen"
    echo "  clean       Eliminar todo (¡incluyendo BD!)"
    ;;
esac
