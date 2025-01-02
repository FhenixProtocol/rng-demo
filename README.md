# RNG Binary Guessing Game

This repo is an example of the RNG functions released as part of the Fhenix Nitrogen testnet. Take a look at the [randomness docs](https://docs.fhenix.zone/docs/devdocs/Writing%20Smart%20Contracts/Randomness) for more information.

The example contract is a guessing game:

- Starting the game uses the function `FHE.randomEuint8` to generate a random uint8 between 0 and 255 inclusive.
- Players can then make a series of guesses to find the random number.
- The contract tells the player whether the random number is `gt` or `lt` their guess.

Important note: When a player makes their guess, `lt` and `gt` are determined _without_ decrypting the random number to prevent it from being leaked.

### Relevant Files

- `contracts/RngBinaryGame.sol` [link](./contracts/RngBinaryGame.sol)
- `test/RngBinaryGame.ts` [link](./test/RngBinaryGame.ts)
- `tasks/play.ts` [link](./tasks/play.ts)

### Playing the Game

You can play the guessing game with the command `pnpm play` which runs the `play` task found here.

### Setup

This example was built using the `fhenix-hardhat-example` repo found [here](https://github.com/FhenixProtocol/fhenix-hardhat-example). See the readme below for setting up and interacting with this repo.

---

`fhenix-hardhat-example:README.md`

# Fhenix Hardhat Example [![Open in Gitpod][gitpod-badge]][gitpod]

This repository contains a sample project that you can use as the starting point
for your Fhenix project. It's also a great fit for learning the basics of
Fhenix smart contract development.

This project is intended to be used with the
[Fhenix Hardhat Beginners Tutorial](TODO), but you should be
able to follow it by yourself by reading the README and exploring its
`contracts`, `tests`, `deploy` and `tasks` directories.

It comes with two fhenix-specific hardhat plugins:

- `fhenix-hardhat-plugin`: The main plugin for fhenix development in hardhat. It injects `fhenixjs` into the hardhat runtime environment, which allows you to interact with encrypted data in your tests and tasks.
- `fhenix-hardhat-docker`: A plugin that allows you to run a local Fhenix testnet in a docker container. This is useful for testing your contracts in a sandbox before deploying them on a testnet or on mainnet.

## Quick start

The first things you need to do are cloning this repository and installing its dependencies:

```sh
git clone https://github.com/FhenixProtocol/fhenix-hardhat-example.git
cd fhenix-hardhat-example
pnpm install
```

Next, you need an .env file containing your mnemonics or keys. You can use .env.example that comes with a predefined mnemonic, or use your own

```sh
cp .env.example .env
```

Once the file exists, let's run a LocalFhenix instance:

```sh
pnpm localfhenix:start
```

This will start a LocalFhenix instance in a docker container. If this worked you should see a `Started LocalFhenix successfully` message in your console.

If not, please make sure you have `docker` installed and running on your machine. You can find instructions on how to install docker [here](https://docs.docker.com/get-docker/).

Now that we have a LocalFhenix instance running, we can deploy our contracts to it:

```sh
npx hardhat deploy
```

Note that this template defaults to use the `localfhenix` network, which is injected into the hardhat configuration.

Finally, we can run the tasks with:

```sh
pnpm task:getCount # => 0
pnpm task:addCount
pnpm task:getCount # => 1
pnpm task:addCount --amount 5
pnpm task:getCount # => 6
```

## Hardhat Network

This template contains experimental support for testing using Hardhat Network. By importing the `fhenix-hardhat-network` plugin in `hardhat.config.ts` we add support for simulated operations using Hardhat Network. These do not perform the full FHE computations, and are menant to serve as development tools to verify contract logic.

Note that in order to use the hardhat network in tasks with `--network hardhat` the tasks need to deploy the contract themselves, as the network is ephemeral. Alternatively you can use the stand-alone hardhat network by setting it as the default network in `hardhat.config.ts`.

If you have any issues or feature requests regarding this support please open a ticket in this repository

## Troubleshooting

If Localfhenix doesn't start this could indicate an error with docker. Please verify that docker is running correctly using the `docker run hello-world` command, which should run a basic container and verify that everything is plugged in.

For example, if the docker service is installed but not running, it might indicate you need to need to start it manually.

## More Info

To learn more about the Fhenix Hardhat plugin, check out the [Fhenix Hardhat Plugin Repository](https://github.com/FhenixProtocol/fhenix-hardhat-plugin).

[gitpod]: https://gitpod.io/#https://github.com/fhenixprotocol/fhenix-hardhat-example
[gitpod-badge]: https://img.shields.io/badge/Gitpod-Open%20in%20Gitpod-FFB45B?logo=gitpod
