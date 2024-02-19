export function encode(data: { [key: string]: string | number | boolean }): string {
    return Object.keys(data)
        .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key].toString()))
        .join("&");
}
