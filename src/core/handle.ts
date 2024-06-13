import {Env} from '../index';
import {proxy} from "./forward";

// 默认hub
const DOCKER_HUB_NAME = "docker"
// 代理容器hub名称Host映射
/**
 * CloudFlare Workers 配置下列自定义访问域名
 * https://docker.mirror.403forbidden.run
 * https://quay.mirror.403forbidden.run
 * https://ghcr.mirror.403forbidden.run
 * https://gcr.mirror.403forbidden.run
 * https://k8sgcr.mirror.403forbidden.run
 */
const HUB_HOST_MAP: { [key: string]: string } = {
	"docker": "https://registry-1.docker.io",
	"quay": "https://quay.io",
	"ghcr": "https://ghcr.io",
	"gcr": "https://gcr.io",
	"k8sgcr": "https://k8s.gcr.io"
}

interface Hub {
	name: string,
	host: string
}

/**
 * handle registry request
 * @param request
 * @param env
 * GET https://docker.mirror.403forbidden.run/v2/
 * HEAD https://docker.mirror.403forbidden.run/v2/library/nginx/manifests/latest
 * GET https://docker.mirror.403forbidden.run/v2/library/nginx/manifests/latest
 * ---
 * GET https://docker.mirror.403forbidden.run/v2/
 * HEAD https://docker.mirror.403forbidden.run/v2/nekoimi/webapp/manifests/latest
 * GET https://docker.mirror.403forbidden.run/v2/nekoimi/webapp/manifests/latest
 * ---
 * GET https://docker.mirror.403forbidden.run/v2/
 * HEAD https://docker.mirror.403forbidden.run/v2/library/redis/manifests/7.0.15-alpine3.20
 * GET https://docker.mirror.403forbidden.run/v2/library/redis/manifests/7.0.15-alpine3.20
 */
export async function handleRegistryRequest(request: Request, env: Env): Promise<Response> {
	const proxyUrl: URL = buildProxyUrl(request.url)
	console.log("requestUrl: ", request.url, "proxyUrl: ", proxyUrl)
	return proxy({
		method: request.method,
		url: proxyUrl,
		headers: request.headers
	})
}

/**
 * 构建代理URL
 * @param urlStr
 */
function buildProxyUrl(urlStr: string): URL {
	const url = new URL(urlStr)
	const hub = extractHubFormUrl(url)
	const pathname = replaceProxyPath(hub, url.pathname)
	return new URL(pathname, hub.host)
}

/**
 * 从请求URL中解析出Hub信息
 * @param url
 */
function extractHubFormUrl(url: URL): Hub {
	// // /v2/library/redis/manifests/7.0.15-alpine3.20
	// // /v2/nekoimi/webapp/manifests/latest
	// // ---
	// // /v2/quay/nekoimi/webapp/manifests/latest
	// // /v2/k8sgcr/nekoimi/webapp/manifests/latest
	// // ---
	// // /v2/quay/nekoimi/webapp/manifests/latest
	// // /v2/k8sgcr/nekoimi/webapp/manifests/latest
	// let path = url.pathname
	// if (path.startsWith('/')) {
	// 	path = path.substring(1)
	// }
	// const items: string[] = path.split("/", 2)
	// let hub = DOCKER_HUB_NAME
	// if (items.length == 2 && items[0] == "v2") {
	// 	hub = items[1]
	// }
	// hub = HUB_HOST_MAP[hub] ? hub : DOCKER_HUB_NAME
	const hub = DOCKER_HUB_NAME
	return {
		name: hub,
		host: HUB_HOST_MAP[hub]
	}
}

function replaceProxyPath(hub: Hub, pathname: string): string {
	if (hub.name == DOCKER_HUB_NAME) {
		return pathname
	}

	// 非DOCKER_HUB_NAME，需要出路请求路径
	// /v2/quay/nekoimi/webapp/manifests/latest
	// /v2/k8sgcr/nekoimi/webapp/manifests/latest
	// ---
	// [0]/[1]v2/[2]quay/nekoimi/webapp/manifests/latest
	// [0]/[1]v2/[2]k8sgcr/nekoimi/webapp/manifests/latest
	// 需要删除路径中的 HUB_HOST_MAP.keys() 成员: quay、k8sgcr、quay、gcr、ghcr
	const paths: string[] = pathname.split("/")
	const cls: string[] = paths.filter(function (val: string, idx: number) {
		return val != hub.name || idx != 2
	})
	return cls.join("/")
}
