## Local MongoDb
Pull the Image using
```
docker pull mongo
```

Run the image using  
```
npm run db-up
```

To connect to the db use 
```
docker exec -it <CONTAINER_NAME> bash
```
Once inside the container use `mongosh` to open the mongo CLI