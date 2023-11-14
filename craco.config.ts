// eslint-disable-next-line import/no-extraneous-dependencies
import webpack from "webpack";

export default {
    jest: {
        configure: {
            passWithNoTests: true,
        },
    },
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    zlib: false,
                    url: false,
                    https: false,
                    http: false,
                    stream: false,
                    crypto: false,
                    path: require.resolve("path-browserify"),
                },
            },
            ignoreWarnings: [
                function ignoreSourcemapsloaderWarnings(warning: {
                    module: { resource: string | string[] };
                    details: string | string[];
                }) {
                    return (
                        warning.module &&
                        warning.module.resource.includes("node_modules") &&
                        warning.details &&
                        warning.details.includes("source-map-loader")
                    );
                },
            ],
        },
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
                process: "process/browser.js",
            }),
        ],
    },
};
