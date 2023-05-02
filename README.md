# putzbot

![GitHub](https://img.shields.io/github/license/ematala/putzbot)
![GitHub last commit](https://img.shields.io/github/last-commit/ematala/putzbot)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ematala/putzbot)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/ematala/putzbot)
[![deploy-appengine](https://github.com/ematala/putzbot/actions/workflows/deploy-appengine.yaml/badge.svg)](https://github.com/ematala/putzbot/actions/workflows/deploy-appengine.yaml)

A Telegram bot to automate our shared flat. Users can send messages to the bot on telegram such as request their weekly duty, remind others or rotate to the next cycle.

The app uses [Telegraf](https://telegraf.js.org/index.html) to interact with users via a webhook that is exposed to an [express](https://expressjs.com/) server. It can be served locally or in a cloud environment such as Google Cloud App Engine.

## Installation

To develop the app locally, clone the repository, run the install script and start a local development server.

Note that the app is currently using a managed MySQL database, hosted on [PlanetScale](https://planetscale.com/). To change this, replace the `provider` under [schema.prisma](./prisma/schema.prisma) and migrate your own database. For more see the [prisma docs](https://www.prisma.io/docs).

```sh
# clone repo
git clone git@github.com:ematala/putzbot.git

# navigate into repo
cd putzbot

# set environment variables
cp .env.example .env

# install dependencies with pnpm
pnpm install

# start local development server
pnpm dev
```

## Secrets

In order to run the app, several environment variables are required that need to be provided inside the [.env](./.env.example) file or a provider-specific configuration file.

- TELEGRAM_BOT_TOKEN: The Telegram API Token, issued by the [@BotFather](https://t.me/BotFather)
- DATABASE_URL: A connection string to a database.
- PASSWORD: A custom app specific password that users can send to the bot during their registration to prevent unauthorized access.
- APP_URL: A static URL to the hosted version of the app. Used to register the webhook for production deployments
- WEBHOOK_SECRET: A custom secret that gets sent along inside the webhook as `X-Telegram-Bot-Api-Secret-Token` header to prevent unauthorized requests. See [Telegram api docs](https://core.telegram.org/bots/api#setwebhook) for more.

## References

- https://core.telegram.org/bots/webhooks
