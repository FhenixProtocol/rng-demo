// SPDX-License-Identifier: MIT

pragma solidity >=0.8.13 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";
import {Console} from "@fhenixprotocol/contracts/utils/debug/Console.sol";

contract RngBinaryGame is Permissioned {
  struct GameGuess {
    uint8 guess;
    bool lt;
    bool gt;
  }

  struct GameState {
    address player;
    euint8 number;
    uint8 guesses;
  }

  uint8 public flag = 0;

  mapping(address => GameState) private gameState;
  mapping(address => mapping(uint8 => GameGuess)) private gameGuesses;

  constructor() {}

  error GameNotFound();
  error GameFinished();
  error OutOfGuesses();

  function createGame() public {
    gameState[msg.sender] = GameState({
      player: msg.sender,
      number: FHE.randomEuint8(),
      guesses: 0
    });
  }

  function guess(uint8 _guess) public {
    if (gameState[msg.sender].player != msg.sender) revert GameNotFound();
    GameState storage game = gameState[msg.sender];

    if (game.guesses >= 12) revert OutOfGuesses();

    if (
      game.guesses > 1 &&
      !gameGuesses[msg.sender][game.guesses - 1].lt &&
      !gameGuesses[msg.sender][game.guesses - 1].gt
    ) revert GameFinished();

    euint8 eGuess = FHE.asEuint8(uint256(_guess));
    Console.log("trivial encrypt finished");

    bool lt = FHE.decrypt(FHE.lt(eGuess, game.number));
    Console.log("lt finished");

    bool gt = FHE.decrypt(FHE.gt(eGuess, game.number));
    Console.log("gt finished");

    gameGuesses[msg.sender][game.guesses] = GameGuess({
      guess: _guess,
      lt: lt,
      gt: gt
    });
    game.guesses += 1;

    Console.log("finished");

    flag += 1;
  }

  function getGameState() public view returns (GameGuess[] memory guesses) {
    if (gameState[msg.sender].player != msg.sender) revert GameNotFound();
    GameState memory game = gameState[msg.sender];

    guesses = new GameGuess[](game.guesses);

    for (uint8 i = 0; i < game.guesses; i++) {
      guesses[i] = gameGuesses[msg.sender][i];
    }
  }
}
