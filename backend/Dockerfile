# Etapa 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias necesarias para compilar Prisma en Alpine
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies para compilar TypeScript)
RUN npm ci

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# Copiar archivos de dependencias para producción
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el cliente de Prisma generado y la compilación
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# El script de inicio aplicará las migraciones y luego iniciará el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
