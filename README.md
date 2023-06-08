# Legato &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![Deployment Status](https://github.com/cheahang-chan/legato/actions/workflows/fly.yml/badge.svg)](https://github.com/cheahang-chan/legato/actions/workflows/fly.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)
A Discord bot to manage party and boss drops from Maplestory.

Created a new repository since the original repo is unaccessible.  
Forked from the original repository at `iRiceCrispy/Spooder`

### Requirements:
1. Register for a [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
2. Follow official instructions to spin up a free MongoDB Instance [here](https://www.mongodb.com/basics/mongodb-atlas-tutorial)
3. Register for a [Discord Bot](https://discord.com/developers/applications)
4. Configure the Bot settings to enable `Privileged Gateway Intents`
5. Generate an OAuth2 URL with `Bot` option enabled
6. Install package dependencies using `npm install`

### Local Installation:
Simply configure `.env` using the `.env.sample` file and run
```
npm start
```

### Deployment:
Deployment uses a free cloud hosting provider [Fly.io](https://fly.io). Simply register the app and follow [default setup instructions](https://fly.io/docs/hands-on/install-flyctl/) for your OS.
```
flyctl auth login
flyctl launch
flyctl deploy
```
To suspend/start the containers:
```
flyctl scale count <0/1>
```
### Deployment Pipeline using GitHub Actions on [Fly.io](https://fly.io):
1. Fork the GitHub repository
2. Create an auth token using `flyctl tokens create <name>`
3. Create a new repository secret `FLY_API_TOKEN` in GitHub Action Secrets
4. Create new secrets in Fly.io for `DISCORD_BOT_TOKEN` and `MONGO_URI` using:
```
flyctl secrets set DISCORD_BOT_TOKEN=<token>
flyctl secrets set MONGO_URI=<connectionString>
```
5. Commit changes or manually start GitHub Actions for deployment

### Guide:
```
1. Use the setchannel command to set dedicated channels for the bot to post stuff in. Can be all the same or diff channels.
2. Use the party command to create/delete/edit parties.
3. Use the setdrop command to create your drops.
4. Use the sold command to mark a drop as sold.
5. Use the paid command to mark a user as paid for their split.
6. Use the paycheck/paychecks command to view peoples paychecks.
7. Use the drop command to view current/all drops in the server.
8. Use the owe list command to view how much you/user owes everyone.
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

Paycheck Management:
/paychecks
/paycheck list
/paycheck from <member>
/paycheck user <member>
/owe list <user?>
```

### Known Issues:
1. First item in each server needs to be generated manually in MongoDB, otherwise `/setdrop` command will fail.
