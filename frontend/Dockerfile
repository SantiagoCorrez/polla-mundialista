# Etapa 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx si existe
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados. Angular 17 genera la salida en 'dist/<project>/browser'
# Si tu versión genera directamente en 'dist/frontend', ajusta la ruta a COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
