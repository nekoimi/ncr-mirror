import {Env} from '../index';
import {proxy} from "./forward";

/**
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
 */
export async function handleRegistryRequest(request: Request, env: Env): Promise<Response> {
	const requestUrl = new URL(request.url)
	if (requestUrl.pathname == "/") {
		return new Response("Not supported", {
			status: 403
		})
	}

	const proxyUrl: URL = buildProxyUrl(requestUrl)
	console.log("requestUrl: ", request.url, "proxyUrl: ", proxyUrl)
	return proxy(env,{
		method: request.method,
		url: proxyUrl,
		headers: request.headers
	})
}

/**
 * 构建代理URL
 * @param url
 */
function buildProxyUrl(url: URL): URL {
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
