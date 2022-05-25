# Chat Box!

A chatting app with accounts just like the thousands of ones out there but probaly worse.

## Demo

Working demo on the [Website](https://naltonsoftware.com/chatbox).

## Installation

If you want to use this, then give credit.

First clone and download dependencies: (pnpm is used)

```sh
git clone https://github.com/Calbabreaker/chat-box.git
cd chat-box
pnpm
```

Then you need to get a redis-server (Ubuntu):

```sh
sudo apt update
sudo apt install redis-server
```

Start redis-server as detached process:

```sh
redis-server &
```

Start the node server:

```sh
pnpm start
```

For more detail instructions please see this [post](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04) (for redis) and this [post](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04) (for nodejs).

You might want to edit the .env to your likings (explanation in .env_sample)
