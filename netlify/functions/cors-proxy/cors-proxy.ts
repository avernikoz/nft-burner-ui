import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

// TODO: Add CORS for the CORS proxy
// TODO: Add custom URL for proxy

export const handler: Handler = async (event, context) => {
    const rawUrl = event.rawUrl;
    const url = rawUrl.split("/.netlify/functions/cors-proxy/")[1];

    if (!url) {
        return {
            statusCode: 400,
            body: "Missing URL",
        };
    }

    const response = await fetch(new URL(url));
    const buffer = await response.buffer();
    const bufferBase64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type");
    // Add cache headers based on your requirements
    // Set Cache-Control to 24 hours (24 * 60 * 60 seconds)
    const cacheControl = "public, max-age=86400"; // Adjust max-age based on your caching needs
    const etag = response.headers.get("etag");

    if (!contentType) {
        return {
            statusCode: 500,
            body: "Missing Content-Type in response headers",
        };
    }

    return {
        statusCode: 200,
        isBase64Encoded: true,
        body: bufferBase64,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": contentType,
            "Cache-Control": cacheControl,
            ETag: etag || "", // Include ETag if available
        },
    };
};
