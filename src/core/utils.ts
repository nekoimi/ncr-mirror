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
