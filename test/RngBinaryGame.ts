/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import hre, { ethers, fhenixjs } from "hardhat";
import { RngBinaryGame } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getTokensFromFaucet } from "../utils/instance";

describe("RngBinaryGame", function () {
  let signer: SignerWithAddress;

  let rngBinaryGame: RngBinaryGame;
  let rngBinaryGameAddress: string;

  before(async () => {
    signer = (await ethers.getSigners())[0];
    await getTokensFromFaucet(hre, signer.address);

    const rngBinaryGameFactory = await ethers.getContractFactory(
      "RngBinaryGame",
    );
    rngBinaryGame = await rngBinaryGameFactory.deploy();
    await rngBinaryGame.waitForDeployment();
    rngBinaryGameAddress = await rngBinaryGame.getAddress();
  });

  describe("Behavior", function () {
    it("Can create a game", async function () {
      await expect(rngBinaryGame.getGameState()).to.be.revertedWithCustomError(
        rngBinaryGame,
        "GameNotFound",
      );
      await rngBinaryGame.connect(signer).createGame();
      await expect(rngBinaryGame.getGameState()).to.not.be.reverted;
    });

    it("Gameplay works", async function () {
      await rngBinaryGame.connect(signer).createGame();

      let min = 0;
      let max = 255;
      let finished = false;
      let n = 0;

      const getGuess = () => {
        return Math.floor((min + max) / 2);
      };

      while (!finished && n < 12) {
        n += 1;
        const guess = getGuess();

        const tx = await rngBinaryGame.connect(signer).guess(guess);
        await tx.wait();

        const guesses = await rngBinaryGame.connect(signer).getGameState();

        const lastGuess = guesses[guesses.length - 1];
        if (lastGuess.gt) {
          console.log(`Guess: ${lastGuess.guess} - too high`);
          max = guess;
        } else if (lastGuess.lt) {
          console.log(`Guess: ${lastGuess.guess} - too low`);
          min = guess;
        } else {
          console.log(`Guess: ${lastGuess.guess} - correct!`);
          finished = true;
        }
      }
    });
  });
});
