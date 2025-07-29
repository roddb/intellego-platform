#!/bin/bash

# Script de monitoreo en tiempo real de Sara
echo "🖥️  MONITOR DE SARA EN TIEMPO REAL"
echo "=================================="
echo "Este script mostrará los logs de debugging de Sara en tiempo real."
echo "Usa Ctrl+C para detener el monitoreo."
echo ""

# Función para colorear los logs
color_logs() {
  while IFS= read -r line; do
    if [[ $line =~ \[CONTEXTUAL-DEBUG\] ]]; then
      echo -e "\033[36m$line\033[0m"  # Cyan
    elif [[ $line =~ \[CALENDAR-DEBUG\] ]]; then
      echo -e "\033[33m$line\033[0m"  # Yellow
    elif [[ $line =~ \[ENHANCED-ENDPOINT\] ]]; then
      echo -e "\033[35m$line\033[0m"  # Magenta
    elif [[ $line =~ "POST /api/ai-chat/" ]]; then
      echo -e "\033[32m$line\033[0m"  # Green
    elif [[ $line =~ "401\|500\|error\|ERROR" ]]; then
      echo -e "\033[31m$line\033[0m"  # Red
    else
      echo "$line"
    fi
  done
}

# Mostrar logs relacionados con Sara
echo "📊 Monitoreando logs de Sara..."
tail -f server.log | grep -E "(CONTEXTUAL|CALENDAR|ENHANCED|ai-chat|Sara|contextual|calendar)" | color_logs