import {Env} from '../index';
import {proxy} from "./forward";

/**
 * CloudFlare Workers 配置下列自定义访问域名
 * https://docker.mirror.403forbidden.run
 * https://quay.mirror.403forbidden.run
 * https://ghcr.mirror.403forbidden.run
 * https://gcr.mirror.403forbidden.run
 * https://k8sgcr.mirror.403forbidden.run
 *
 * 代理容器hub名称Host映射
 */
const HUB_SET: Set<string> = new Set<string>([
	"docker", "quay", "ghcr", "gcr", "k8sgcr"
])
const HUB_HOST_MAP: { [key: string]: string } = {
	"docker": "https://registry-1.docker.io",
	"quay": "https://quay.io",
	"ghcr": "https://ghcr.io",
	"gcr": "https://gcr.io",
	"k8sgcr": "https://k8s.gcr.io"
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
	return proxy(env,{
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
	return new URL(url.pathname, hub.host)
}

/**
 * 从请求URL中解析出Hub信息
 * @param url
 */
function extractHubFormUrl(url: URL): Hub {
	const host = url.host
	const items: string[] = host.split(".", 1)
	const hub = items[0]
	if (!HUB_SET.has(hub)) {
		throw new Error("hub not supported: " + hub)
	}
	return {
		name: hub,
		host: HUB_HOST_MAP[hub]
	}
}
