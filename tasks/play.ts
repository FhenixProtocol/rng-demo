import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import inquirer from "inquirer";
import { assertArgument, resolveAddress, TransactionRequest } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { getRpcTransaction } from "@nomicfoundation/hardhat-ethers/internal/ethers-utils";

const Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
function deepCopy<T = any>(value: T): T {
  if (
    value === null ||
    value === undefined ||
    Primitive.indexOf(typeof value) >= 0
  ) {
    return value;
  }

  // Keep any Addressable
  if (typeof (value as any).getAddress === "function") {
    return value;
  }

  if (Array.isArray(value)) {
    return (value as any).map(deepCopy);
  }

  if (typeof value === "object") {
    return Object.keys(value).reduce((accum, key) => {
      accum[key] = (value as any)[key];
      return accum;
    }, {} as any);
  }

  throw new Error(`Assertion error: ${value as any} (${typeof value})`);
}

const sendUncheckedTransaction = async (
  signer: HardhatEthersSigner,
  tx: TransactionRequest,
): Promise<string> => {
  const resolvedTx = deepCopy(tx);

  const promises: Array<Promise<void>> = [];

  // Make sure the from matches the sender
  if (resolvedTx.from !== null && resolvedTx.from !== undefined) {
    const _from = resolvedTx.from;
    promises.push(
      (async () => {
        const from = await resolveAddress(_from, signer.provider);
        assertArgument(
          from !== null &&
            from !== undefined &&
            from.toLowerCase() === signer.address.toLowerCase(),
          "from address mismatch",
          "transaction",
          tx,
        );
        resolvedTx.from = from;
      })(),
    );
  } else {
    resolvedTx.from = signer.address;
  }

  if (resolvedTx.gasLimit === null || resolvedTx.gasLimit === undefined) {
    promises.push(
      (async () => {
        resolvedTx.gasLimit = await signer.provider.estimateGas({
          ...resolvedTx,
          from: signer.address,
        });
      })(),
    );
  }

  // The address may be an ENS name or Addressable
  if (resolvedTx.to !== null && resolvedTx.to !== undefined) {
    const _to = resolvedTx.to;
    promises.push(
      (async () => {
        resolvedTx.to = await resolveAddress(_to, signer.provider);
      })(),
    );
  }

  // Wait until all of our properties are filled in
  if (promises.length > 0) {
    await Promise.all(promises);
  }

  const hexTx = getRpcTransaction(resolvedTx);

  return signer.provider.send("eth_sendTransaction", [hexTx]);
};

task("task:play").setAction(async function (_, hre) {
  const { fhenixjs, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  if ((await ethers.provider.getBalance(signer.address)).toString() === "0") {
    await fhenixjs.getFunds(signer.address);
  }

  let RngBinaryGame: Deployment;
  try {
    RngBinaryGame = await deployments.get("RngBinaryGame");
  } catch (e) {
    console.log(`${e}`);
    if (hre.network.name === "hardhat") {
      console.log(
        "You're running on Hardhat network, which is ephemeral. Contracts you deployed with deploy scripts are not available.",
      );
      console.log(
        "Either run the local node with npx hardhat node and use --localhost on tasks, or write tasks that deploy the contracts themselves",
      );
    }
    return;
  }

  console.log(
    "\n\nStep right up, I'm thinking of a number between 0 and 255 inclusive!",
  );
  console.log(
    "You have 12 guesses, after each guess I'll tell you if your number was too high or too low.",
  );
  console.log("Good luck!");

  let rngBinaryGame = await ethers.getContractAt(
    "RngBinaryGame",
    RngBinaryGame.address,
  );
  rngBinaryGame = rngBinaryGame.connect(signer);

  let tx = await rngBinaryGame.createGame();
  await tx.wait();

  let finished = false;

  while (!finished) {
    console.log(" ");
    const { guess } = await inquirer.prompt({
      type: "number",
      name: "guess",
      message: "Guess the number:",
      validate: (val) => {
        if (val == null) return "Number missing";
        if (isNaN(val)) return "Invalid number";
        if (!Number.isInteger(val)) return "Number must be an integer";
        if (val < 0 || val > 255) return "Number must be between 0 and 255";
        return true;
      },
    });
    console.log(" ");

    try {
      const populated = await rngBinaryGame.guess.populateTransaction(guess);
      console.log({ populated });
      const hash = await sendUncheckedTransaction(signer, populated);
      console.log({ hash });

      const tx = await signer.sendTransaction(populated);
      signer.sendTransaction(populated);
      signer.signTransaction;
      console.log({ tx });
      await tx.wait();
    } catch (e) {
      console.log("error", e);
    }

    const guesses = await rngBinaryGame.connect(signer).getGameState();

    const lastGuess = guesses[guesses.length - 1];
    if (lastGuess.gt) {
      console.log(`Ouch, ${lastGuess.guess} is too high`);
    } else if (lastGuess.lt) {
      console.log(`Yikes, ${lastGuess.guess} is too low`);
    } else {
      console.log(`Congratulations, ${lastGuess.guess} is correct!`);
      console.log(`You got it in ${guesses.length} guesses!`);
      finished = true;
    }

    if (guesses.length === 12) {
      console.log(
        "\nOh no! You've run out of your 12 guesses, better luck next time!",
      );
      finished = true;
    }
  }

  console.log("\nGoodbye! Thanks for playing!");
});
