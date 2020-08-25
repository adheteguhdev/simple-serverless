const serverlessHttp = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const uuid = require('uuid');

let { DYNAMODB_TABLE, IS_OFFLINE } = process.env;
IS_OFFLINE = 'true'
const dynamoDb = IS_OFFLINE === 'true' ?
  new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    // accessKeyId: 'xxxx',
    // secretAccessKey: 'xxxx',
    endpoint: 'http://localhost:8000'
  }) : new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json())

app.get('/test', (req, res) => {
  res.send("HELLO WORLD!!!");
});

app.get('/user', async (req, res) => {

  const params = {
    TableName: DYNAMODB_TABLE
  }

  try {
    const userData = await dynamoDb.scan(params).promise();

    const { Items: Users } = userData;

    res.status(200).json({ Users });

  } catch (error) {
    return res.status(500).json({ error: "error when retrieve data" })
  }

});

app.post('/user', async (req, res) => {
  req.body.createdAt = Date.now();
  const { name, age, createdAt } = req.body
  const userId = uuid.v4();

  const params = {
    TableName: DYNAMODB_TABLE,
    Item: {
      userId,
      name,
      age,
      createdAt,
    }
  }

  try {
    await dynamoDb.put(params).promise();

    res.status(200).json({ userId, name, age, createdAt })
  } catch (error) {
    return res.status(500).json({ error: "Error when create data" });
  }

});

app.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  const params = {
    TableName: DYNAMODB_TABLE,
    Key: {
      userId
    }
  }

  try {
    const userData = await dynamoDb.get(params).promise();
    if (userData.Item) {
      const { userId, name, age, createdAt } = userData.Item;
      return res.status(200).json({ userId, name, age, createdAt })
    }
    return res.status(404).json({ message: `Data with userId: ${userId} not found` })

  } catch (error) {
    return res.status(500).json({ error: "Error retrieving data" })
  }
})

app.put('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  const { name, age } = req.body;

  let params = {
    TableName: DYNAMODB_TABLE,
    Key: { userId },
    UpdateExpression: 'set #name = :name, #age = :age',
    ExpressionAttributeNames: { '#name': 'name', '#age': 'age' },
    ExpressionAttributeValues: { ':name': name, ':age': age },
  }

  try {

    await dynamoDb.update(params).promise();

    res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'error when update data' })
  }
})

app.delete('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  const params = {
    TableName: DYNAMODB_TABLE,
    Key: {
      userId
    }
  }

  try {
    await dynamoDb.delete(params).promise();

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: "error when delete data" })
  }

})


module.exports.handler = serverlessHttp(app);

//  curl -H "Content-Type: application/json" -X DELETE http://localhost:3000/dev/user/825290d3-f90c-4fda-94d2-3521966a0f3a -v
// curl -H "Content-Type: application/json" -X PUT http://localhost:3000/dev/user/825290d3-f90c-4fda-94d2-3521966a0f3a -d '{"name": "Update Adhe1", "age": "22"}' -v

//  curl -H "Content-Type: application/json" -X POST http://localhost:3000/dev/user -d '{"name": "Teguhss", "age": 23}'