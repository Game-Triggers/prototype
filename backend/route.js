"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
exports.PATCH = PATCH;
exports.OPTIONS = OPTIONS;
const server_1 = require("next/server");
async function GET(request) {
    const nestUrl = process.env.NEST_URL || 'http://localhost:3001';
    const url = new URL(request.url);
    try {
        const nestResponse = await fetch(`${nestUrl}${url.pathname}${url.search}`);
        const data = await nestResponse.text();
        const contentType = nestResponse.headers.get('content-type') || 'application/json';
        return new server_1.NextResponse(data, {
            status: nestResponse.status,
            headers: {
                'Content-Type': contentType,
            },
        });
    }
    catch (error) {
        console.error('Error proxying to NestJS:', error);
        return server_1.NextResponse.json({ error: 'Failed to connect to API server' }, { status: 500 });
    }
}
async function POST(request) {
    return handleRequest(request);
}
async function PUT(request) {
    return handleRequest(request);
}
async function DELETE(request) {
    return handleRequest(request);
}
async function PATCH(request) {
    return handleRequest(request);
}
async function OPTIONS(request) {
    return handleRequest(request);
}
async function handleRequest(request) {
    const nestUrl = process.env.NEST_URL || 'http://localhost:3001';
    const url = new URL(request.url);
    try {
        let body = null;
        const contentType = request.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            body = JSON.stringify(await request.json());
        }
        else if (request.body) {
            body = await request.text();
        }
        const fetchOptions = {
            method: request.method,
            headers: {
                'Content-Type': contentType || 'application/json',
            },
        };
        if (body) {
            fetchOptions.body = body;
        }
        const nestResponse = await fetch(`${nestUrl}${url.pathname}${url.search}`, fetchOptions);
        const data = await nestResponse.text();
        const responseContentType = nestResponse.headers.get('content-type') || 'application/json';
        return new server_1.NextResponse(data, {
            status: nestResponse.status,
            headers: {
                'Content-Type': responseContentType,
            },
        });
    }
    catch (error) {
        console.error('Error proxying to NestJS:', error);
        return server_1.NextResponse.json({ error: 'Failed to connect to API server' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map