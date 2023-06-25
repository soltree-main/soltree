import { Db, MongoClient } from "mongodb";
import 'dotenv/config';

// Define our connection string. Info on where to get this will be described below. In a real world application you'd want to get this string from a key vault like AWS Key Management, but for brevity, we'll hardcode it in our serverless function here.
const MONGODB_URI = process.env.MONGODB_URI;

// Once we connect to the database once, we'll store that connection and reuse it so that we don't have to connect to the database on every request.
let cachedDb: Db | null = null;

// Store client so that it can be closed later
let client: MongoClient

export async function connectToDatabase(dbName: string): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if(!MONGODB_URI) {
    throw Error(`mongo db uri not defined: ${MONGODB_URI}`);
  }

  // Connect to our MongoDB database hosted on MongoDB Atlas
  client = await MongoClient.connect(MONGODB_URI);

  // Specify which database we want to use
  const db = client.db(dbName);

  cachedDb = db;
  return db;
}

export async function disconnectFromDatabase(): Promise<void> {
  if(client) {
    await client.close();
  }
}
