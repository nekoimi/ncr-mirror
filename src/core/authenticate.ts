import {searchAuthenticateItemValue} from "./utils";
import {Env} from "../index";

/**
 * 解析 www-authenticate
 * // Bearer realm="https://auth.docker.io/token",service="registry.docker.io"
 * // Bearer realm="https://quay.io/v2/auth",service="quay.io"
 * // Bearer realm="https://ghcr.io/token",service="ghcr.io",scope="repository:user/image:pull"
 * // Bearer realm="https://gcr.io/v2/token",service="gcr.io"
 * // Bearer realm="https://k8s.gcr.io/v2/token",service="k8s.gcr.io"
 * @param authenticateStr
 */
export function parseAuthenticateStr(authenticateStr: string): WWWAuthenticate {
	if (authenticateStr.startsWith("Bearer ")) {
		authenticateStr = authenticateStr.replace("Bearer ", "")
	}
	const items: string[] = authenticateStr.split(",", 3)
	return {
		realm: searchAuthenticateItemValue(items, "realm"),
		service: searchAuthenticateItemValue(items, "service"),
		scope: searchAuthenticateItemValue(items, "scope")
	}
}

/**
 * 构建token缓存key
 * @param authenticate
 */
async function buildTokenKey(authenticate: WWWAuthenticate): Promise<string> {
	const key = `${authenticate.realm}:${authenticate.service}:${authenticate.scope}`
	const keyStr = new TextEncoder().encode(key)
	const digestBuf = await crypto.subtle.digest({
		name: "SHA-256"
	}, keyStr)
	const digestUArr = new Uint8Array(digestBuf);
	let hexArr = []
	for (const num of digestUArr) {
		hexArr.push(num.toString(16))
	}
	const digestHex = hexArr.join('')
	return `token:${digestHex}`
}

/**
 * 刷新token
 * https://k8s.gcr.io/v2/token?scope=repository:google_containers/heapster-amd64:pull&service=k8s.gcr.io
 * @param env
 * @param authenticate
 */
async function refreshToken(env: Env, authenticate: WWWAuthenticate): Promise<Token> {
	const url = new URL(authenticate.realm)
	if (authenticate.service.length) {
		url.searchParams.set("service", authenticate.service)
	}
	if (authenticate.scope != null && authenticate.scope.length) {
		url.searchParams.set("scope", authenticate.scope)
	}
	// TODO: support basic auth
	const response = await fetch(url.toString(), {method: "GET", headers: {}})
	if (response.status !== 200) {
		throw new Error(`Unable to fetch token from ${url.toString()} status code ${response.status}`)
	}
	const body = await response.json()
	console.log("refreshToken", body)
	const token: Token = {
		token: body.token,
		expires_in: body.expires_in,
		issued_at: body?.issued_at
	}
	const tokenKey = await buildTokenKey(authenticate)
	await env.DCR_CACHE.put(tokenKey, JSON.stringify(token))
	return token
}

/**
 * 获取token
 * @param env
 * @param authenticate
 */
export async function getToken(env: Env, authenticate: WWWAuthenticate): Promise<Token> {
	const tokenKey = await buildTokenKey(authenticate)
	let tokenStr = await env.DCR_CACHE.get(tokenKey)
	console.log("tokenStr", tokenStr)
	if (!tokenStr) {
		return refreshToken(env, authenticate)
	}
	return JSON.parse(tokenStr)
}
