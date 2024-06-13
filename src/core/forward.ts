import {headers2map} from "./utils";
import {getToken, parseAuthenticateStr} from "./authenticate";
import {Env} from "../index";

export async function proxy(env: Env, args: ProxyArgs): Promise<Response> {
	const response = await fetch(args.url, {
		method: args.method,
		headers: args.headers,
		redirect: "follow"
	})
	if (response.status != 401) {
		return response
	}

	// remote response status => 401
	console.log("resp-headers: ", headers2map(response.headers))
	const authenticateStr = response.headers.get("www-authenticate")
	if (authenticateStr == null) {
		return response
	}

	const wwwAuthenticate: WWWAuthenticate = parseAuthenticateStr(authenticateStr)
	console.log("wwwAuthenticate", wwwAuthenticate)
	const token: Token = await getToken(env, wwwAuthenticate)
	console.log("token", token)
	const authenticateHeaders = new Headers(args.headers)
	authenticateHeaders.append("Authorization", "Bearer " + token.token)
	return await fetch(args.url, {
		method: args.method,
		headers: authenticateHeaders,
		redirect: "follow"
	})
}
