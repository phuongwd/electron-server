# Chestnut 🌰

![tests](https://github.com/stashpad/chestnut/actions/workflows/tests.yml/badge.svg?branch=main)

> Chestnut is a lightweight server for deploying Electron apps. With the click of a button, you can deploy to [Render](https://render.com) to provide downloads and updates for your users.

<p align="center">
  <a href="https://github.com/stashpad/chestnut/blob/master/LICENSE">License</a> ·
  <a href="https://github.com/stashpad/chestnut#contributing">Contributing</a>
</p>

- Built with [Express](https://expressjs.com/) and Typescript
- Caches release files & metadata from [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) on disk
- Refreshes the cache every 10 minutes ([configurable](https://github.com/stashpad/chestnut#congfiguration))
- Supports macOS, Windows, and Linux (using `.AppImage`)
- Works with Electron's built in `autoUpdater`, or `electron-updater`'s version (provided by `electron-builder`)
- Supports public and private GitHub repos

## Why use Chestnut instead of Hazel?

- File caching support. While this means using more bandwidth, it allows you to use a private repository on GitHub to store your releases.
- Supports both Electron updater systems (both Electron's built in `autoUpdater` and the `electron-updater` that comes with `electron-builder`)
- You can easily provide automatic updates on Linux (via `.AppImage`)
- Security updates. Hazel is [no longer receiving updates](https://github.com/vercel/hazel/issues/62#issuecomment-1159562487) so important security fixes may not be applied.

## Usage 📦

Easily deploy to [Render](https://render.com)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/stashpad/chestnut/tree/main)

Once it is deployed, configure your Electron app to work with the Chestnut deployment.

```ts
const { app, autoUpdater } = require('electron')

const server = '<deployment-url>' // Ex. https://releases.stashpad.com
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })

setInterval(() => {
  autoUpdater.checkForUpdates()
}, 10 * 60 * 1000) // every 10 mins
```

You're all set! ✅

The updater will ask your Chestnut deployment for updates.

## Configuration ⚙️

Chestnut can be easily configured using environment variables.

Required:

- `ACCOUNT`: The github user/organization name. (Ex. `stashpad`)
- `REPOSITORY`: The github repo name. (Ex. `desktop`)

Optional:

- `PORT`: The port that Chestnut should use (defaults to 3000)
- `INTERVAL`: Refreshes the cache every `INTERVAL` minutes (defaults to 10)
- `TOKEN`: Your GitHub token with the `repo` scope
- `URL`: The server's URL
- `PASSWORD`: Used to bust the file cache and force a reload of the latest release. Please choose a secure password since busting the cache will use up your GitHub Token's request limit.

## Usage with Electron's `autoUpdater`

An example of how to use Chestnut with Electron's built in `autoUpdater`

```ts
const { app, autoUpdater } = require('electron')

const server = '<deployment-url>' // Ex. https://releases.stashpad.com
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })
```

## Usage with `electron-updater`

An example of how to use Chestnut with `electron-updater`'s `autoUpdater`, provided by the `electron-builder` library. It consumes the files in the GitHub Release directly, checking the `latest.yml` family of files to know when an update is available

```ts
const { autoUpdater } = require('electron-updater')
const server = '<deployment-url>/files' // Ex. https://releases.stashpad.com/files

autoUpdater.setFeedURL({ provider: 'generic', url: server })
```

## Routes

### /

Displays an overview page showing the repository information as well as available platforms (and file sizes). Provides links to the repo, releases, currently cached version, and direct download links for each platform.

### /download

Detects the platform requested by the visitor (via the user agent header) and downloads the correct package for the platform.

If the latest version can't be found in GitHub Releases, or if the platform is not supported, it will return a `404 Not Found`.

### /download/:platform

Accepts a platform (such as `mac`, `mac_arm64`, `windows`, etc.) to download a specific package. Common aliases like `darwin`, and `win32` are supported.

Here is a list of platforms and their common aliases.

```ts
darwin: ["mac", "macos", "osx"],
exe: ["win32", "windows", "win"],
deb: ["debian"],
rpm: ["fedora"],
AppImage: ["appimage", "linux"],
dmg: ["dmg"],
```

To programatically get the platform in your app's code, you can use `process.platform` or `os.platform()` provided by `node`.

If the platform does not exist for the currently cached release, it will return a `404 Not Found`.

### /update/:platform/:currentVersion

Check if there is an update available based on the `:currentVersion` parameter passed by the `autoUpdater` and provides some metadata about the new version as well as a `url` to use for downloading it.

If there is not a cached release, it will return a `204 No Content`.

### /files/:filename

Returns the files exactly as requested by the `electron-updater` lib. For example, the auto updater will request `latest-mac.yml` to know if an update is available for mac. The yml files are generated by the `electron-builder` library and should be included in the GitHub Release. Similarly it will return a download of any existing file like `/files/YourApp-1.0.0.exe`.

### /refresh/:password

Checks GitHub for the latest release and forces all file to be cached, bypassing the cache interval. Hit this route with the `PASSWORD` provided as an environment variable. If there is no ENV variable specified then the route will do nothing and return a `200 OK`.

For GitHub releases stored in a private repo, this consumes a request on your GitHub token's rate limit.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your machine
2. `cd` into the directory of your clone: cd `chestnut`
3. Run the development server: `yarn start`
4. Open a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) with your changes

## Credits

Chestnut is an evolution of the popular [Hazel](https://github.com/vercel/hazel) server from [vercel](https://vercel.com/). Much of the code was brought directly from Hazel. Thanks to their previous work, we are able to stand on the shoulders of giants 💪.

The name Chestnut is inspired by the [Squirrel](https://github.com/Squirrel) updater used to update Electron apps on both the macOS and Windows platforms.

Here at Stashpad, we found that nothing quite fit our needs for deploying our desktop app - so we built Chestnut. We hope it can help you too!

## Todos

- Create a full boilerplate example with electron `autoUpdater`
- Create a full boilerplate example with `electron-updater`
- How to deploy elsewhere (using a Dockerfile?)
