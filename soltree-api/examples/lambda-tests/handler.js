// https://medium.com/geekculture/developing-aws-lambda-functions-locally-879dad302e5a

exports.handler = async (event) => {
    // return 'Hello world'

    if (event.path === '/say/hi') {
        return {
            statusCode: 200,
            body: JSON.stringify(
                'Hi ' + event.queryStringParameters.name
            ),
        }
    }

    return {
        statusCode: 404,
        body: JSON.stringify('Not found',)
    }
}