import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

// TODO: Add CORS for the CORS proxy

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
        },
    };
};
