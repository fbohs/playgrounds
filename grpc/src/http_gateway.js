import Fastify from 'fastify';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, 'helloworld.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

// Create gRPC client
const client = new hello_proto.Greeter('localhost:50051', grpc.credentials.createInsecure());

const fastify = Fastify({
    logger: true
});

// Declare a route
fastify.get('/hello', async function handler(request, reply) {
    const name = request.query.name || 'World';

    return new Promise((resolve, reject) => {
        client.sayHello({ name: name }, (error, response) => {
            if (error) {
                request.log.error(error);
                reply.code(500).send({ error: error.message });
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
});

// Run the server!
try {
    await fastify.listen({ port: 3000 });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
