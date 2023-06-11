const { handler } = require('./handler')

describe('Lambda function', () => {
    // it('should return with programming cliché', async () => {
    //     const result = await handler()
    //     expect(result).toBe('Hello world')
    // })

    it('should return Not Found for non-existent routes', async () => {
        const event = {
            path: '/does/not/exist',
            httpMethod: 'GET',
        }

        const result = await handler(event)

        expect(result).toMatchObject({
            statusCode: 404,
        })
    })

    it('should say hi', async () => {
        const event = {
            path: '/say/hi',
            httpMethod: 'GET',
            queryStringParameters: {
                name: 'Zero',
            },
        }

        const result = await handler(event)

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify('Hi Zero'),
        })
    })
})