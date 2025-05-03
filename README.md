<h1 align="center">BentoStream</h1>

<br />

<div align="center">

<a href="">[![Author](https://img.shields.io/badge/Author-Comfy-brightgreen.svg)](https://www.youtube.com/@thomasthemaker/)</a>

</div>

<p align="center">Reference original repository: <a href="https://github.com/miroslavpejic85/mirotalkbro.git">mirotalkbro</a></p>

<p align="center">BentoStream is a minimal streaming solution built for self-hosting. Zero user interaction is required. This works as a replacement of Dolby.io with the goal under 50$/month running</a></p>



<p align="center">
    <a href="https://bro.mirotalk.com"><video src="./assets/bentohome.mov" autoplay loop muted playsinline style="max-width:100%; height:auto;"></video></a>
</p>

---

<p align="center">
    Join our community for questions, discussions, and support on <a href="https://discord.gg/rgGYfeYW3N">Discord</a>
</p>

---

</details>

<details open>
<summary>Quick Start</summary>

<br/>

Start the app using [nodejs](https://nodejs.org/en/download):

```bash
# Clone the project repo
$ git clone https://github.com/BentoBotFight/BentoStream.git
# Go to project dir
$ cd BentoStream
# Copy .env.template in .env and edit it if needed
$ cp .env.template .env
# Install dependencies
$ npm install
# Run the app
$ npm start
```

Start the app using [docker](https://docs.docker.com/engine/install/) - [docker-compose](https://docs.docker.com/compose/) and optional [official image](https://hub.docker.com/r/mirotalk/bro):

![docker](public/assets/images/docker.png)

```bash
# Clone the project repo
$ git clone https://github.com/miroslavpejic85/mirotalkbro.git
# Go to project dir
$ cd mirotalkbro
# Copy .env.template in .env and edit it if needed
$ cp .env.template .env
# Copy docker-compose.template.yml in docker-compose.yml and edit it if needed
$ cp docker-compose.template.yml docker-compose.yml
# Get official image from Docker Hub
$ docker pull mirotalk/bro:latest
# Run the image in a container
$ docker-compose up #-d
```

Server up and running

```js
Server is running {
  home: 'http://localhost:3016',
  broadcast: 'http://localhost:3016/broadcast?id=123&name=Broadcaster',
  viewer: 'http://localhost:3016/viewer?id=123&name=Viewer',
  viewerHome: 'http://localhost:3016/home?id=123'
}
```

The app should now be running on your http://localhost:3016, you can choose if join room as a `Broadcaster` or `Viewer`.

The `Broadcaster` stream the audio, video or screen to all connected viewers and can receive messages from them.

The `Viewer` get the audio, video or screen that is streamed from the broadcaster and can send messages to it.

<details open>
<summary>Hetzner & Contabo</summary>

<br/>

[![Hetzner](public/assets/images/hetzner.png)](https://hetzner.cloud/?ref=XdRifCzCK3bn)

This application is running for `demonstration purposes` on [Hetzner](https://www.hetzner.com/), one of `the best` [cloud providers](https://www.hetzner.com/cloud) and [dedicated root servers](https://www.hetzner.com/dedicated-rootserver).

---

Personally, I used a VPS with 4vCPU & 8GB RAM for 10$/month. Works well.

---



To set up your own instance of `MiroTalk BRO` on a dedicated cloud server, please refer to our comprehensive [self-hosting documentation](https://docs.mirotalk.com/mirotalk-bro/self-hosting/). This guide will walk you through the process step by step, ensuring a smooth and successful deployment.

</details>

</details>

<details>
<summary>Direct Join</summary>

<br>

You can direct join room as `broadcaster` or `viewer` specifying the room id and your name.

| As            | URL                                                     |
| ------------- | ------------------------------------------------------- |
| `Broadcaster` | http://localhost:3016/broadcast?id=123&name=Broadcaster |
| `Viewer`      | http://localhost:3016/viewer?id=123&name=Viewer         |

| Params | Type   | Description |
| ------ | ------ | ----------- |
| id     | string | Room Id     |
| name   | string | User name   |

</details>

<details>
<summary>Embedding</summary>

<br/>

Embedding MiroTalk Live Broadcast into a service or app using an iframe.

```html
<iframe
    allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; web-share; autoplay"
    src="https://bro.mirotalk.com"
    style="height: 100vh; width: 100vw; border: 0px;"
 ></iframe>
**Disclaimer:** Through real usage, players with low-end Android devices may experience frame losses and high latency.
```

</details>

<details>
<summary>Documentations</summary>

<br>

-   [Install your own Stun/Turn](./docs/coturn.md)
-   [Ngrok](./docs/ngrok.md)
-   [How to Self-hosting](./docs/self-hosting.md)
-   [Rest API](./app/api/README.md)

</details>



<br/>

If you want to use this project but struggle, email me or talk to me on Discord.

Email: tungvunguyennguyen@gmail.com
Discord: https://discord.gg/rQWPPPNMmZ

</details>
