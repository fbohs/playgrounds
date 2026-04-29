import fastify from 'fastify';

const app = fastify({
    logger: true,
});

app.get('/', async (request, reply) => {
    return { "hello": "world" };
});

app.get('/query', async (request, reply) => {
    return { message: "hello world" };
});

app.post('/post', async (request, reply) => {
    return { message: "post api called" };
})

const start = async () => {
    try {
        await app.listen({ port: 3000 });
        app.log.info(`server listening on ${app.server.address().port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();