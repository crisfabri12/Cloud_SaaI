import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as helm from "@pulumi/kubernetes/helm/v3";

// Leer el kubeconfig generado por Kind
const kubeconfig = process.env.KUBECONFIG || "~/.kube/config";

// Configurar el proveedor de Kubernetes
const provider = new k8s.Provider("k8s-provider", {
    kubeconfig: kubeconfig,
});

// 1. Instalar Ingress-NGINX
const ingressNs = new k8s.core.v1.Namespace("ingress-nginx", { metadata: { name: "ingress-nginx" } }, { provider });
const ingressChart = new helm.Chart("ingress-nginx", {
    chart: "ingress-nginx",
    version: "4.12.2",
    fetchOpts: { repo: "https://kubernetes.github.io/ingress-nginx" },
    namespace: ingressNs.metadata.name,
    values: {
        controller: {
            service: { type: "NodePort", nodePorts: { http: 30080, https: 30443 } },
            ingressClassResource: { enabled: false },
            ingressClass: "nginx",
            admissionWebhooks: { enabled: false },
        },
    },
}, { provider });

// 2. IngressClass
new k8s.networking.v1.IngressClass("nginx", { metadata: { name: "nginx" }, spec: { controller: "k8s.io/ingress-nginx" } }, { provider, dependsOn: ingressChart });

// 3. Namespace de la aplicación
const appNs = new k8s.core.v1.Namespace("my-app", { metadata: { name: "my-app" } }, { provider });

// 4. Secret para Postgres
const dbSecret = new k8s.core.v1.Secret("db-secret", {
    metadata: { namespace: appNs.metadata.name },
    stringData: { POSTGRES_USER: "admin", POSTGRES_PASSWORD: "s3cr3t" },
}, { provider });

// 5. ConfigMap para backend
const backendConfig = new k8s.core.v1.ConfigMap("backend-config", {
    metadata: { namespace: appNs.metadata.name },
    data: {
        POSTGRES_HOST: pulumi.interpolate`postgres.${appNs.metadata.name}.svc.cluster.local`,
        POSTGRES_PORT: "5432",
        POSTGRES_DB:   "postgres",
    },
}, { provider });

// 6. PVC y StatefulSet para Postgres
const postgresPvc = new k8s.core.v1.PersistentVolumeClaim("postgres-pvc", {
    metadata: { namespace: appNs.metadata.name },
    spec: { accessModes: ["ReadWriteOnce"], resources: { requests: { storage: "1Gi" } } },
}, { provider });
const postgresSts = new k8s.apps.v1.StatefulSet("postgres-sts", {
    metadata: { namespace: appNs.metadata.name },
    spec: {
        serviceName: "postgres",
        replicas: 1,
        selector: { matchLabels: { app: "postgres" } },
        template: { metadata: { labels: { app: "postgres" } }, spec: { containers: [{ name: "postgres", image: "postgres:14-alpine", ports: [{ containerPort: 5432 }], envFrom: [{ secretRef: { name: dbSecret.metadata.name } }], volumeMounts: [{ name: "data", mountPath: "/var/lib/postgresql/data" }] }] } },
        volumeClaimTemplates: [{ metadata: { name: "data" }, spec: postgresPvc.spec! }],
    },
}, { provider });

// 7. Service headless y ClusterIP para Postgres
new k8s.core.v1.Service("postgres-headless", {
    metadata: { name: "postgres-headless", namespace: appNs.metadata.name },
    spec: { clusterIP: "None", selector: { app: "postgres" }, ports: [{ port: 5432, targetPort: 5432 }] },
}, { provider });
new k8s.core.v1.Service("postgres", {
    metadata: { name: "postgres", namespace: appNs.metadata.name },
    spec: { selector: { app: "postgres" }, ports: [{ port: 5432, targetPort: 5432 }] },
}, { provider });

// 8. Services internos de la app
new k8s.core.v1.Service("backend-svc", { metadata: { name: "backend-svc", namespace: appNs.metadata.name }, spec: { selector: { app: "backend" }, ports: [{ port: 3000, targetPort: 3000 }] } }, { provider });
new k8s.core.v1.Service("frontend-svc", { metadata: { name: "frontend-svc", namespace: appNs.metadata.name }, spec: { selector: { app: "frontend" }, ports: [{ port: 80, targetPort: 80 }] } }, { provider });

// 9. Deployments
new k8s.apps.v1.Deployment("backend-dep", {
    metadata: { namespace: appNs.metadata.name },
    spec: {
        replicas: 2,
        selector: { matchLabels: { app: "backend" } },
        template: { metadata: { labels: { app: "backend" } }, spec: { containers: [{ name: "backend", image: "crisfabri98/backend:latest", ports: [{ containerPort: 3000 }], envFrom: [{ secretRef: { name: dbSecret.metadata.name } }, { configMapRef: { name: backendConfig.metadata.name } }] }] } },
    },
}, { provider });
new k8s.apps.v1.Deployment("frontend-dep", {
    metadata: { namespace: appNs.metadata.name },
    spec: {
        replicas: 2,
        selector: { matchLabels: { app: "frontend" } },
        template: { metadata: { labels: { app: "frontend" } }, spec: { containers: [{ name: "frontend", image: "crisfabri98/frontend:latest", ports: [{ containerPort: 80 }] }] } },
    },
}, { provider });

// 10. Ingress
new k8s.networking.v1.Ingress("app-ingress", {
    metadata: { namespace: appNs.metadata.name },
    spec: {
        ingressClassName: "nginx",
        rules: [{ host: "app.local", http: { paths: [ { path: "/api", pathType: "Prefix", backend: { service: { name: "backend-svc", port: { number: 3000 } } } }, { path: "/", pathType: "Prefix", backend: { service: { name: "frontend-svc", port: { number: 80 } } } } ] } }],
    },
}, { provider });
