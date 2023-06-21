A simple Node.js app that reads NARAKA: BLADEPOINT game state and allows user to:

-   Switch OBS scenes depending on game state.
-   Run Twitch ads automatically during lobby times.

# Installation (manual)

## Pre-requisites

-   Must have Node.js `v18` or greater, and `pnpm` installed.
-   Must have the repository cloned

## Installing dependencies

```sh
pnpm install
```

Copy `config/default.yaml.example` to `config/default.yaml` and change the values accordingly by refering to the [Configuration](#configuration) section.

## Starting

Execute the main program:

```sh
node .
```

# Installation (from compiled binary)

-   Download the [latest release](https://github.com/Rivelia/naraka-autoad/releases/latest/download/naraka-autoad.exe).
-   Create a `config` folder and copy [default.yaml.example](https://raw.githubusercontent.com/Rivelia/naraka-autoad/master/config/default.yaml.example) as `default.yaml` in the `config` folder, then change the values accordingly by refering to the [Configuration](#configuration) section.
-   Execute the executable `naraka-autoad.exe`.

# Configuration

For Twitch:

-   `client_id` and `client_secret` will be found in your Twitch API console.
-   `user_id` will be found by manually calling Twitch Helix API or using an [external service](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
-   Copy [`tokens.YOUR_TWITCH_USER_ID.json.example`](https://raw.githubusercontent.com/Rivelia/naraka-autoad/master/tokens.YOUR_TWITCH_USER_ID.json.example) to `token.YOUR_TWITCH_USER_ID.json` (replace `YOUR_TWITCH_USER_ID` to the same one found previously)
    -   If you already know your twitch API access token and refresh token, put them in the json file.
    -   If you don't know your twitch API access token and refresh token (you will be required to clone this repository, and have the [Pre-requisites](#pre-requisites) section fulfilled):
        -   Make sure you have `http://localhost` as a redirect URI in your twitch API
        -   Modify and then go to the following URL: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=YOUR_TWITCH_CLIENT_ID&redirect_uri=http://localhost&scope=channel%3Aedit%3Acommercial&state=c3ab8aa609ea11e793ae92361f002671`
        -   Click `Authorize`, you will be redirect to a `localhost` page that will fail. You will find the code in the redirected URL.
        -   Copy the code, open `init.js` and replace `YOUR_TWITCH_CODE` with the obtained code.
        -   Execute the script:
        ```sh
        node init.js
        ```
        -   You will find your access token and refresh token in the console output, modify `token.YOUR_TWITCH_USER_ID.json` with them accordingly.

For OBS:

Open OBS, go to `Tools > WebSocket Server Settings`, check the box `Enable WebSocket Server`. The port and password can be found after clicking on the `Show Connect Info` button.
