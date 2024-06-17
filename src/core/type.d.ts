// hub信息
interface Hub {
	name: string,
	host: string
}

// 代理转发参数
interface ProxyArgs {
	method: string,
	url: URL,
	headers: Headers
}

// www-authenticate 响应头
interface WWWAuthenticate {
	realm: string
	service: string
	scope?: string
}

// token
interface Token {
	token: string
	expires_in?: number
	issued_at?: string
}
