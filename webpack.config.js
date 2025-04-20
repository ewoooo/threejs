import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
    mode: "development",
    entry: "./src/scripts/main.js",
    output: {
        filename: "bundle.js",
        path: path.resolve("dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./views/index.html",
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "public", to: "." }, // ✅ public 전체를 dist로 복사
            ],
        }),
    ],
    devServer: {
        static: "./dist",
        open: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: [".js"],
    },
};
