import {headers2map} from "./utils";

interface ProxyArgs {
	method: string,
	url: URL,
	headers: Headers
}

export async function proxy(args: ProxyArgs): Promise<Response> {
	const response = await fetch(args.url, {
		method: args.method,
		headers: args.headers,
		redirect: "follow"
	})
	if (response.status != 401) {
		return response
	}

	console.log("resp-headers: ", headers2map(response.headers))

	// 远程响应为 401
	const authenticateStr = response.headers.get("www-authenticate")
	console.log("authenticateStr: ", authenticateStr)
	// https://gcr.io/v2/token?scope=repository:google_containers/heapster-amd64:pull&service=gcr.io
	return response
}
