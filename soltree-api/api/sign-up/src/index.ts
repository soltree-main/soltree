import { Context } from "aws-lambda";
import { connectToDatabase } from "../../db";
import { User } from "../../shared/types/user";

const transformAddUserEvent = (event: any): User | null => {
  // const body = JSON.parse(event);

  if (!event.email || !event.username || !event.password) {
    return null;
  }

  return {
    email: event.email,
    username: event.username,
    password: event.password,
    verified: false,
  };
};

export const handler = async (event: any, context: Context) => {
  /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. 
    Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, 
    even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. 
    Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
  context.callbackWaitsForEmptyEventLoop = false;

  const user = transformAddUserEvent(event);

  if (!user) {
    return {
      statusCode: 400,
      body: `Invalid Request: ${JSON.stringify(event, null, 2)}`,
    };
  }

  // Get an instance of our database
  const db = await connectToDatabase("soltreegame");

  // Insert the user into the db
  const result = await db.collection("users").insertOne(user);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
