Documento 1: Guía Completa - WebODM en Google Cloud VM
Introducción
Esta guía documenta el proceso completo para desplegar WebODM en una VM de Google Cloud, incluyendo todos los problemas encontrados y sus soluciones.
1. Creación de la VM
Especificaciones Recomendadas
bashNombre: webodm
Zona: us-west4-a
Tipo de máquina: e2-standard-2 o superior
Sistema Operativo: Ubuntu 24.04 LTS
Disco: 100GB+ SSD
Comando de creación
bashgcloud compute instances create webodm \
    --zone=us-west4-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2404-lts-amd64 \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=100GB \
    --tags=http-server,https-server
2. Configuración de Firewall
Problema: Reglas duplicadas causan conflictos
Síntoma: Connection refused en puerto 8000 desde fuera de la VM
Solución: Crear UNA regla limpia sin duplicados
bash# Eliminar reglas antiguas si existen
gcloud compute firewall-rules delete webodm-allow-8000 --quiet
gcloud compute firewall-rules delete webodm-global-8000 --quiet

# Crear regla limpia
gcloud compute firewall-rules create webodm-clean \
    --allow tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --description "Clean WebODM rule"
Verificar:
bashgcloud compute firewall-rules describe webodm-clean
3. Configuración SSH
Problema: SSH service disabled
Síntoma: Connection refused en puerto 22
Solución: Habilitar SSH en la VM
bash# Conectar vía consola web de Google Cloud, luego:
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh

# Verificar
sudo ss -tlnp | grep :22
Generar claves SSH para gcloud
bash# Si no existen claves, gcloud las genera automáticamente
gcloud compute ssh webodm --zone=us-west4-a
4. Instalación de WebODM
Pasos de instalación
bash# Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Docker Compose
sudo apt-get install docker-compose -y

# Instalar Python pip
sudo apt-get install python3-pip -y

# Clonar WebODM
git clone https://github.com/OpenDroneMap/WebODM.git --config core.autocrlf=input --depth 1

# Entrar al directorio
cd WebODM

# Iniciar WebODM
sudo ./webodm.sh start
5. Configuración de Nginx
Problema: Nginx usa configuración por defecto
Síntoma: WebODM inicia pero no responde en puerto 8000 externamente
Diagnóstico:
bash# Verificar qué configuración usa nginx
sudo docker exec webapp cat /etc/nginx/sites-enabled/default
Solución: Reemplazar con configuración de WebODM
bash# Copiar configuración correcta
sudo docker exec webapp cp /webodm/nginx/nginx.conf /etc/nginx/nginx.conf

# Reiniciar nginx
sudo docker exec webapp service nginx restart

# Verificar
curl -I http://localhost:8000
6. Configuración del archivo .env
Ubicación
bashcd ~/WebODM
nano .env
Contenido correcto
bashWO_HOST=0.0.0.0
WO_PORT=8000
WO_MEDIA_DIR=appmedia
WO_DB_DIR=dbdata
WO_SSL=NO
WO_SSL_KEY=
WO_SSL_CERT=
WO_SSL_INSECURE_PORT_REDIRECT=80
WO_DEBUG=NO
WO_DEV=NO
WO_BROKER=redis://broker
WO_DEFAULT_NODES=1
WO_SETTINGS=
Importante: WO_HOST=0.0.0.0 permite conexiones externas
7. Problemas de Conectividad Externa
Problema: ISP bloqueando puertos
Síntoma: Funciona con datos móviles pero no con WiFi doméstico
Diagnóstico:
bash# Desde tu Mac
nc -zv IP_EXTERNA 8000
# Si falla: Connection refused

# Desde la VM
curl -I http://localhost:8000
# Si funciona: HTTP 302 Found
Soluciones:

Configurar router doméstico para permitir puerto 8000
Usar VPN en tu Mac
Cambiar WebODM a puerto 80 (menos bloqueado)
Acceder vía consola web de Google Cloud

Cambiar a puerto 80
bashcd ~/WebODM
sudo ./webodm.sh down
sed -i 's/WO_PORT=8000/WO_PORT=80/' .env
sudo ./webodm.sh start
8. IP Estática (Recomendado)
Problema: IP cambia al reiniciar VM
bash# Crear IP estática
gcloud compute addresses create webodm-static-ip --region=us-west4

# Asignar a la VM
gcloud compute instances delete-access-config webodm \
    --access-config-name="External NAT" \
    --zone=us-west4-a

gcloud compute instances add-access-config webodm \
    --access-config-name="External NAT" \
    --address=$(gcloud compute addresses describe webodm-static-ip --region=us-west4 --format="get(address)") \
    --zone=us-west4-a
9. Comandos de Gestión
Iniciar/Detener WebODM
bashcd ~/WebODM
sudo ./webodm.sh start
sudo ./webodm.sh stop
sudo ./webodm.sh restart
sudo ./webodm.sh down  # Detiene y elimina contenedores
Ver logs
bashsudo docker logs webapp -f
sudo docker logs worker -f
sudo docker logs db -f
Verificar estado
bashsudo docker ps
sudo ss -tlnp | grep :8000
curl -I http://localhost:8000
Limpiar sistema
bashsudo ./webodm.sh down
sudo docker system prune -f
10. Optimización para Cesium
Parámetros recomendados
Al crear una tarea en WebODM para exportar a Cesium:
bashtexturing-single-material: true
auto-boundary: true
dsm: true
dtm: true
pc-quality: high
feature-quality: ultra
Reprocesar desde texturizado
Si necesitas cambiar parámetros de texturizado:

Ir a la tarea
Editar opciones
Activar texturing-single-material
Reiniciar desde "Desde Texturizando"

11. Troubleshooting
WebODM no responde externamente
bash# 1. Verificar que WebODM esté corriendo
sudo docker ps

# 2. Verificar puerto interno
curl -I http://localhost:8000

# 3. Verificar puerto externo abierto
sudo ss -tlnp | grep :8000

# 4. Verificar configuración nginx
sudo docker exec webapp cat /etc/nginx/nginx.conf | grep "listen 8000"

# 5. Verificar firewall
gcloud compute firewall-rules list --filter="name:webodm"
Error en procesamiento
bash# Ver logs detallados
sudo docker logs worker -f

# Liberar espacio en disco
df -h
sudo docker system prune -a
Contenedores no inician
bash# Reiniciar Docker
sudo systemctl restart docker

# Reiniciar WebODM completamente
cd ~/WebODM
sudo ./webodm.sh down
sudo docker system prune -f
sudo ./webodm.sh start
12. Backup y Restauración
Backup de datos
bash# Comprimir directorio de media
cd ~/WebODM
tar -czf webodm-backup-$(date +%Y%m%d).tar.gz appmedia/ dbdata/
Restauración
bash# Detener WebODM
sudo ./webodm.sh down

# Restaurar datos
tar -xzf webodm-backup-YYYYMMDD.tar.gz

# Iniciar WebODM
sudo ./webodm.sh start
13. Monitoreo
Uso de recursos
bash# CPU y Memoria
top
htop

# Espacio en disco
df -h
du -sh ~/WebODM/*

# Estado de Docker
sudo docker stats
Checklist de Verificación

 VM creada con especificaciones adecuadas
 Firewall configurado (puerto 8000)
 SSH habilitado y funcionando
 Docker y Docker Compose instalados
 WebODM clonado y configurado
 Archivo .env con WO_HOST=0.0.0.0
 Nginx usando configuración de WebODM
 Puerto 8000 accesible externamente
 IP estática asignada (opcional pero recomendado)