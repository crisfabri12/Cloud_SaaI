# Aplicación SaaI distribuida en Kubernetes con Pulumi y Kind

Este proyecto representa una aplicación web SaaI (Software as an Island) distribuida y desplegada localmente en un clúster de Kubernetes usando [Kind](https://kind.sigs.k8s.io/) y gestionada con [Pulumi](https://www.pulumi.com/).

---

## 🧠 ¿Qué es SaaI y qué rol cumple Pulumi?

**SaaI (Software as an Island)** es un enfoque arquitectónico donde cada componente del sistema funciona como una "isla": independiente, autónoma y capaz de escalar o fallar sin afectar al resto del sistema. Esto ofrece:

* **Desacoplamiento fuerte**: cada servicio puede evolucionar y escalar por separado.
* **Resiliencia**: una isla puede fallar sin comprometer las otras.
* **Escalabilidad inteligente**: se asignan recursos solo donde hay demanda.

En este proyecto, SaaI se representa mediante:

* Despliegues independientes para frontend, backend y base de datos.
* Recursos separados y aislados por tipo de componente.
* Autoscalado en el backend según la carga.
* Distribución de pods en múltiples nodos para redundancia.

### 🧰 ¿Y qué es Pulumi?

**Pulumi** es una herramienta de infraestructura como código (IaC) que permite definir y desplegar recursos de infraestructura utilizando lenguajes de programación modernos. En este caso, usamos **TypeScript** para definir el clúster, los servicios, las imágenes, los deployments y demás recursos de Kubernetes.

Esto nos permite:

* Automatizar completamente la creación del clúster con Kind.
* Declarar todos los recursos de Kubernetes como código versionable.
* Reutilizar estructuras y aplicar lógica en la configuración.
* Mantener un entorno reproducible y portable.

Pulumi actúa como el "capitán del archipiélago": asegura que cada isla (servicio) esté en su sitio, configurada y conectada como debe ser.

---

## 🚀 Tecnologías principales

* **Kubernetes**: Orquestación de contenedores.
* **Kind**: Clúster Kubernetes local con nodos distribuidos.
* **Pulumi**: Infraestructura como código con TypeScript.
* **Docker**: Contenerización de la aplicación.
* **Horizontal Pod Autoscaler (HPA)**: Autoescalado de pods basado en uso de CPU.
* **PostgreSQL**: Base de datos persistente desplegada con StatefulSet.
* **Nginx Ingress Controller**: Exposición HTTP de los servicios.

---

## 🌐 Arquitectura distribuida

El clúster contiene 1 nodo de control y 2 nodos trabajadores:

* **Control Plane**: `pulumi-cluster-control-plane`
* **Worker Nodes**: `pulumi-cluster-worker`, `pulumi-cluster-worker2`

La distribución de pods se puede observar en los logs:

```bash
backend-dep-6b6bf84599-gknnt     -> pulumi-cluster-worker
backend-dep-6b6bf84599-zlvrl     -> pulumi-cluster-worker2
frontend-dep-dac293ed-7f6f8474-8hkgz -> pulumi-cluster-worker
frontend-dep-dac293ed-7f6f8474-ggsd7 -> pulumi-cluster-worker2
postgres-sts-1071c13e-0              -> pulumi-cluster-worker
```

Esto demuestra una distribución efectiva de carga entre los nodos, respaldando el enfoque SaaI, donde cada "isla" de funcionalidad (frontend, backend, base de datos) puede escalar y aislarse de forma independiente.

---

## 🚄 Componentes desplegados

### 📊 Backend

* Imagen: `crisfabri98/backend:latest`
* Deployment: `backend-dep`
* HPA: `backend-hpa` (CPU target 30%, min 1 pod, max 5 pods)
* Service: `backend-svc`

### 💻 Frontend

* Imagen: `crisfabri98/frontend:latest`
* Deployment: `frontend-dep-<hash>`
* Service: `frontend-svc`

### 🏛 Base de datos

* Imagen: `postgres`
* StatefulSet: `postgres-sts-<hash>`
* Servicios: `postgres` y `postgres-headless`

### 🏢 Ingress

* Controlador: `ingress-nginx-controller`
* Permite acceso HTTP a `frontend` y `backend` desde el exterior.

---

## 🚗 Autoscaling

El autoscaler horizontal está habilitado para el backend:

```bash
NAME          REFERENCE                TARGETS       MINPODS   MAXPODS   REPLICAS
backend-hpa   Deployment/backend-dep   cpu: 1%/30%   1         5         2
```

Esto permite escalar automáticamente los pods del backend al aumentar la carga. Actualmente está funcionando con 2 réplicas.

---

## ⚙️ Comandos útiles

```bash
# Ver despliegues por namespace
kubectl get deployments -A

# Ver recursos en el namespace principal
kubectl get all -n my-app

# Ver distribución de pods en nodos
kubectl get pods -A -o wide

# Ver el estado del autoscaler
kubectl get hpa -n my-app
```

---

## 🔍 Observaciones clave

* La distribución de pods es balanceada entre nodos workers.
* El HPA ya está activamente manteniendo 2 réplicas.
* No se está usando Prometheus ni Grafana en esta configuración.
* La base de datos está corriendo como StatefulSet para mantener persistencia.

---

### 🧭 ¿Por qué elegir este enfoque?

* Ideal para entornos de desarrollo, pruebas y enseñanza de Kubernetes.
* Permite experimentar con prácticas reales de DevOps y arquitecturas distribuidas sin necesidad de un proveedor cloud.
* Facilita el diseño de sistemas escalables, mantenibles y resilientes.
* Reduce fricción entre desarrollo y operaciones.

Este proyecto demuestra que un enfoque SaaI no es exclusivo del mundo cloud: puede implementarse localmente de forma profesional, usando herramientas modernas y abiertas.

> ¿Por qué levantar monolitos cuando puedes crear islas autónomas y hermosas?

---

## 💡 Futuras mejoras sugeridas

* Integrar **Prometheus y Grafana** para monitoreo y visualización.
* Habilitar volúmenes persistentes reales (actualmente usando Local Path Provisioner).
* Implementar una estrategia de logging centralizado (por ejemplo, Loki).
* Automatizar pruebas de carga para validar el escalado.

---
