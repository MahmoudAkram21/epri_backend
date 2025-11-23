import https from 'https';
export declare function getHttpsOptions(): https.ServerOptions<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> | null;
export declare function isHttpsEnabled(): boolean;
export declare function createHttpsServer(app: any, port: number): https.Server | null;
//# sourceMappingURL=https-server.d.ts.map