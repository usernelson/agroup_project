#!/bin/bash

echo "=============================="
echo "     GESTIÓN DE VERSIONES     "
echo "=============================="

# Mostrar tags y ramas disponibles
echo "📌 Versiónes existentes (tags):"
git tag | sort || echo "❌ No hay tags aún."

echo ""
echo "🌿 Ramas remotas disponibles:"
git branch -r || echo "❌ No hay ramas remotas aún."

echo ""
echo "¿Qué deseas hacer?"
echo "1) Commit normal con fecha"
echo "2) Guardar versión como TAG"
echo "3) Crear rama estable"
echo "4) Revertir último commit"
echo "5) Salir"
echo "------------------------------"
read -p "Elige una opción [1-5]: " opcion

fecha=$(date '+%Y-%m-%d')

case $opcion in
  1)
    read -p "📝 Escribe una descripción del cambio: " descripcion
    git status
    git add .
    git commit -m "$fecha - $descripcion"
    git push origin main
    echo "✅ Cambios enviados a main."
    ;;
  2)
    read -p "🏷️ Nombre de la nueva versión (ej. v1.0.0): " version
    read -p "📝 Descripción de la versión: " mensaje
    git tag -a "$version" -m "$mensaje"
    git push origin "$version"
    echo "✅ Versión '$version' guardada y enviada al remoto."
    ;;
  3)
    read -p "🌿 Nombre de la nueva rama estable: " rama
    git checkout -b "$rama"
    git push origin "$rama"
    echo "✅ Rama '$rama' creada y enviada al remoto."
    ;;
  4)
    echo "⚠️ Esto deshará el último commit y sus cambios."
    read -p "¿Estás seguro? (s/N): " confirm
    if [[ "$confirm" == "s" || "$confirm" == "S" ]]; then
      git reset --hard HEAD~1
      echo "⏪ Último commit eliminado."
    else
      echo "❌ Acción cancelada."
    fi
    ;;
  5)
    echo "👋 Saliendo..."
    exit 0
    ;;
  *)
    echo "❌ Opción no válida."
    ;;
esac

