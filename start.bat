@echo off
REM Panel de Control Brevo - Startup Script (Windows)

setlocal enabledelayedexpansion

echo 🎛️ Panel de Control - Brevo
echo ============================
echo.

if "%1%"=="" (
  set CMD=up
) else (
  set CMD=%1%
)

if "%CMD%"=="up" (
  echo 🐳 Levantando aplicación con Docker Compose...
  if not exist ".env" (
    echo 📋 Creando .env...
    copy .env.example .env
  )
  docker-compose up -d
  echo ✅ Aplicación levantada en http://localhost:3000
  echo Ver logs: start.bat logs
  
) else if "%CMD%"=="down" (
  echo 🛑 Deteniendo aplicación...
  docker-compose down
  echo ✅ Aplicación detenida
  
) else if "%CMD%"=="restart" (
  echo 🔄 Reiniciando...
  docker-compose restart
  echo ✅ Aplicación reiniciada
  
) else if "%CMD%"=="logs" (
  docker-compose logs -f
  
) else if "%CMD%"=="build" (
  echo 🏗️ Reconstruyendo imagen...
  docker-compose build --no-cache
  echo ✅ Imagen reconstruida
  
) else if "%CMD%"=="clean" (
  echo ⚠️ Eliminando datos...
  docker-compose down -v
  echo ✅ Datos eliminados
  
) else (
  echo Uso: start.bat [comando]
  echo.
  echo Comandos:
  echo   up          Levantar (por defecto)
  echo   down        Detener
  echo   restart     Reiniciar
  echo   logs        Ver logs
  echo   build       Reconstruir imagen
  echo   clean       Eliminar todo (¡incluyendo BD!)
)

endlocal
pause
