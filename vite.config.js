import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Custom plugin to properly handle LDraw file requests
// The LDrawLoader constructs paths that may not match our file structure,
// so we intelligently search multiple folders to find the correct file
// Also strips BOM from LDraw files to prevent parsing errors
function ldrawPlugin() {
    return {
        name: "ldraw-plugin",
        configureServer(server) {
            // Add middleware BEFORE Vite's static file serving
            server.middlewares.use((req, res, next) => {
                const url = req.url || "";

                // Check for LDraw file extensions (.ldr, .dat, .mpd)
                if (url.match(/\.(dat|ldr|mpd)$/i)) {
                    const publicDir = join(process.cwd(), "public");

                    // Extract the filename from the path
                    const fileName = url.split("/").pop() || "";

                    // Define search paths in order of likelihood
                    // LDrawLoader with setPartsLibraryPath("/") requests paths like /parts/xxx.dat
                    // We need to resolve these to /ldraw/parts/xxx.dat
                    const searchPaths = [
                        url, // Try original path first
                        // Handle /parts/xxx.dat -> /ldraw/parts/xxx.dat
                        url.startsWith("/parts/")
                            ? `/ldraw${url}`
                            : `/ldraw/parts/${fileName}`,
                        // Handle /p/xxx.dat -> /ldraw/p/xxx.dat
                        url.startsWith("/p/")
                            ? `/ldraw${url}`
                            : `/ldraw/p/${fileName}`,
                        // Handle /models/xxx.dat -> /ldraw/models/xxx.dat
                        url.startsWith("/models/")
                            ? `/ldraw${url}`
                            : `/ldraw/models/${fileName}`,
                        `/ldraw/${fileName}`,
                        `/ldraw/parts/s/${fileName}`,
                        `/ldraw/p/48/${fileName}`,
                        `/ldraw/p/8/${fileName}`,
                    ];

                    // Try each search path
                    for (const searchPath of searchPaths) {
                        const fullPath = join(publicDir, searchPath);
                        if (existsSync(fullPath)) {
                            try {
                                // Read file and strip BOM if present
                                let content = readFileSync(fullPath, "utf8");

                                // Strip UTF-8 BOM (U+FEFF) if present
                                if (content.charCodeAt(0) === 0xfeff) {
                                    content = content.slice(1);
                                }

                                res.setHeader(
                                    "Content-Type",
                                    "text/plain; charset=utf-8",
                                );
                                res.setHeader(
                                    "Cache-Control",
                                    "public, max-age=31536000",
                                );
                                res.end(content);
                                return;
                            } catch (err) {
                                console.error(
                                    `[LDraw] Error reading ${fullPath}:`,
                                    err,
                                );
                            }
                        }
                    }

                    // If still not found, try to find a fallback for patterned parts
                    // Patterned parts have names like 3068bpb0064.dat or 3069bp01.dat
                    // The base part is 3068b.dat or 3069b.dat
                    const patternMatch = fileName.match(
                        /^(\d+[a-z]*)p[bp]?\d+\.dat$/i,
                    );
                    if (patternMatch) {
                        const basePart = `${patternMatch[1]}.dat`;
                        const fallbackPath = join(
                            publicDir,
                            "ldraw",
                            "parts",
                            basePart,
                        );
                        if (existsSync(fallbackPath)) {
                            try {
                                console.warn(
                                    `[LDraw] Pattern not found: ${fileName}, using base part: ${basePart}`,
                                );
                                let content = readFileSync(
                                    fallbackPath,
                                    "utf8",
                                );

                                // Strip UTF-8 BOM if present
                                if (content.charCodeAt(0) === 0xfeff) {
                                    content = content.slice(1);
                                }

                                res.setHeader(
                                    "Content-Type",
                                    "text/plain; charset=utf-8",
                                );
                                res.setHeader(
                                    "Cache-Control",
                                    "public, max-age=31536000",
                                );
                                res.end(content);
                                return;
                            } catch (err) {
                                console.error(
                                    `[LDraw] Error reading fallback ${fallbackPath}:`,
                                    err,
                                );
                            }
                        }
                    }

                    // If still not found after fallback attempt, log and return 404
                    console.warn(
                        `[LDraw] Missing file: ${url} (searched as ${fileName})`,
                    );
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "text/plain");
                    res.end(`LDraw file not found: ${url}`);
                    return;
                }
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.tsx"],
            refresh: true,
        }),
        tailwindcss(),
        react(),
        ldrawPlugin(),
    ],
    server: {
        watch: {
            ignored: ["**/storage/framework/views/**"],
        },
    },
    // Ensure .dat files are served as text
    assetsInclude: ["**/*.dat", "**/*.ldr", "**/*.mpd"],
});
