import {createServer} from 'node:http';
process.env.TAILORFIT_DIST_DIR='.next-faux-ui-integration';
process.env.NEXT_TELEMETRY_DISABLED='1';
const {default:next}=await import('next');
const app=next({dev:true,hostname:'127.0.0.1',port:4320});
await app.prepare();
const server=createServer(app.getRequestHandler());
server.listen(4320,'127.0.0.1',()=>console.log('Tailorfit main workspace: http://127.0.0.1:4320/app?tab=overview'));
