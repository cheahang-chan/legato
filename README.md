Created a new repository since the original repo is unaccessible.
Forked from the Original Repository at `iRiceCrispy/Spooder`

## Legato
A Discord bot to manage party and boss drops from Maplestory.

### Guide:
```
1. Use the setchannel command to set dedicated channels for the bot to post stuff in. Can be all the same or diff channels.
2. Use the party command to create/delete/edit parties.
3. Use the setdrop command to create your drops.
4. Use the sold command to mark a drop as sold.
5. Use the paid command to mark a user as paid for their split.
6. Use the paycheck/paychecks command to view peoples paychecks.
Each command should be pretty self explanatory.
```

### Commands:
```
Server Management:
/setchannel <drops/sales> <channel>

Party Management:
/party create <partyName> <member(s)>
/party edit <partyName> <action (Add/Remove)> <member>

Drop Management:
/setdrop party <bossName> <itemName> <partyName> 
/setdrop manual <bossName> <itemName> <randoms> <members>
/drops list
/drops all
```

### Requirements:
1. Register for a [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
2. Follow official instructions to spin up a free MongoDB Instance [here](https://www.mongodb.com/basics/mongodb-atlas-tutorial)
3. Register for a [Discord Bot]()
4. Configure the Bot settings to enable `Privileged Gateway Intents`
5. Generate an OAuth2 URL with `Bot` option enabled
6. Install package dependencies using `npm install`

### Local Setup:
Simply configure `.env` using the `.env.sample` file and run
```
npm start
```

### Deployment:
Deployment uses a free cloud hosting provider [Fly.io](https://fly.io). Simply register the app and follow default setup instructions.
```
flyctl auth login
flyctl launch
flyctl deploy
```
To suspend/start the containers:
```
flyctl scale count <0/1>
```

### Deployment Pipeline:
WIP

### Known Issues:
1. First item in each server needs to be generated manually in MongoDB, otherwise `/setdrop` command will fail.