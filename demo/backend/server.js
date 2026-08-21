const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const users = [
    {
        id: 1,
        name: "Kiran"
    },
    {
        id: 2,
        name: "Vishnu"
    }
];

const server = http.createServer((req, res) => {

    if (req.url === "/api/users" && req.method === "GET") {

        console.log("GET /api/users");

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(users));

        return;
    }

    if (req.url === "/" && req.method === "GET") {

        const filePath = path.join(
            __dirname,
            "../frontend/index.html"
        );

        fs.readFile(filePath, (error, data) => {

            if (error) {
                res.writeHead(500);
                res.end("Failed to load frontend");
                return;
            }

            res.writeHead(200, {
                "Content-Type": "text/html"
            });

            res.end(data);
        });

        return;
    }

    if (req.url === "/style.css" && req.method === "GET") {

        const filePath = path.join(
            __dirname,
            "../frontend/style.css"
        );

        fs.readFile(filePath, (error, data) => {

            if (error) {
                res.writeHead(404);
                res.end();
                return;
            }

            res.writeHead(200, {
                "Content-Type": "text/css"
            });

            res.end(data);
        });

        return;
    }

    if (req.url === "/app.js" && req.method === "GET") {

        const filePath = path.join(
            __dirname,
            "../frontend/app.js"
        );

        fs.readFile(filePath, (error, data) => {

            if (error) {
                res.writeHead(404);
                res.end();
                return;
            }

            res.writeHead(200, {
                "Content-Type": "application/javascript"
            });

            res.end(data);
        });

        return;
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`TraceDev demo running at http://localhost:${PORT}`);
});