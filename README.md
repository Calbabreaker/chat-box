# Chat Box!

A chatting app with accounts just like the thousands of ones out there except probaly worse.

## Demo

Working demo on the [Server](https://naltonsoftware.com/chatbox).

## Instalation

If you want to use this, then give credit.

First clone and dowload depedencies:

```sh
git clone https://github.com/Calbabreaker/chat-box.git
cd chat-box
npm install
```

Then you need to get a redis-server (linux Ubuntu):

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
npm start
```

You might want to edit the .env to your likings (explanation in .env_sample)

## LICENSE

GPL-3.0
