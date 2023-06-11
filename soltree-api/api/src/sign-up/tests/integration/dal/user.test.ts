import { handler } from '../../../index';
import { disconnectFromDatabase } from '../../../../db/index'

import { Context } from "aws-lambda";

describe('sign-up', () => {
    const mockContext: Context = {
        callbackWaitsForEmptyEventLoop: true
    } as Context;

    afterAll(async () => {
        await disconnectFromDatabase()
    })

    it('should add a new user to the db', async () => {
        const event = {
            email: 'test-signup@test.com',
            username: 'test-signup',
            password: '@Test123',
        }

        const expected = {
            'test': 1,
        }

        const actual = await handler(event, mockContext);

        const body = JSON.parse(actual.body);

        expect(body.acknowledged).toBe(true);
        expect(body.insertedId).toBeDefined();
        expect(actual.statusCode).toEqual(200);

    })
})