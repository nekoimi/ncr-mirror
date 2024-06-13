# ncr-mirror

适用于CloudFlare的Worker容器镜像代理

### Workers 配置下列自定义访问域名

```html
docker.mirror.403forbidden.run   代理docker.io
quay.mirror.403forbidden.run   代理quay.io
ghcr.mirror.403forbidden.run   代理ghcr.io
gcr.mirror.403forbidden.run   代理gcr.io
k8sgcr.mirror.403forbidden.run  代理k8s.gcr.io
```

### 使用

- dockerhub

```shell
docker pull docker.io/library/nginx:latest
```

mirror

```shell
docker pull docker.mirror.403forbidden.run/library/nginx:latest
```

or

vim /etc/docker/daemon.json

```json
{
  "registry-mirrors": [
	"https://docker.mirror.403forbidden.run"
  ]
}
```

- k8s.gcr.io

```shell
docker pull k8s.gcr.io/kube-apiserver:v1.19.3
```

mirror

```shell
docker pull k8sgcr.mirror.403forbidden.run/kube-apiserver:v1.19.3
```
