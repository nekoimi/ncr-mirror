/**
 * 将Headers转换成map
 * @param headers
 */
export function headers2map(headers: Headers): { [k: string]: string } {
	let map = {}
	for (let key of headers.keys()) {
		map[key] = headers.get(key)
	}
	return map
}

/**
 * [
 *    "realm=\"https://auth.docker.io/token\"",
 *    "service=\"registry.docker.io\""
 * ]
 * ---
 * [
 *    "realm=\"https://auth.docker.io/token\"",
 *    "service=\"registry.docker.io\"",
 *    "scope=\"repository:google_containers/heapster-amd64:pull\""
 * ]
 * @param items
 * @param key
 */
export function searchAuthenticateItemValue(items: string[], key: string): string {
	for (let item of items) {
		let ias = item.split("=", 2)
		if (ias.length != 2 || ias[0] != key) {
			continue
		}
		// eg: \"https://auth.docker.io/token\"
		let valStr = ias[1]
		return valStr.replace(/['"]+/g, "")
	}
}
