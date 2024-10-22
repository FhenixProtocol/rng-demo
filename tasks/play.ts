import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import inquirer from "inquirer";

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

    const tx = await rngBinaryGame.guess(guess);
    await tx.wait();

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
