# backend.py
# Punto de entrada principal para ejecutar la aplicación Flask.

from routes import app  # Importamos la aplicación Flask desde el módulo routes

if __name__ == '__main__':
    # Ejecuta la aplicación en modo debug para facilitar el desarrollo
    app.run(debug=True)

