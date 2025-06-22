"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { Chess } from "chess.js"
import type { PlayerStyle } from "@/lib/pgn-parser"

export type Difficulty = "easy" | "medium" | "hard" | "style"
export type GameStatus = "playing" | "checkmate" | "stalemate" | "draw" | "thinking"

interface GameState {
  game: Chess
  fen: string
  moveHistory: string[]
  gameStatus: GameStatus
  difficulty: Difficulty
  playerColor: "white" | "black"
  currentTurn: "white" | "black"
  selectedSquare: string | null
  possibleMoves: string[]
  lastMove: { from: string; to: string; captured?: string } | null
  capturedPieces: { white: string[]; black: string[] }
  playerStyle: PlayerStyle | null
}

type GameAction =
  | { type: "MAKE_MOVE"; payload: { from: string; to: string; promotion?: string } }
  | { type: "SET_SELECTED_SQUARE"; payload: string | null }
  | { type: "SET_POSSIBLE_MOVES"; payload: string[] }
  | { type: "SET_DIFFICULTY"; payload: Difficulty }
  | { type: "SET_PLAYER_COLOR"; payload: "white" | "black" }
  | { type: "SET_PLAYER_STYLE"; payload: PlayerStyle | null }
  | { type: "RESET_GAME" }
  | { type: "UNDO_MOVE" }
  | { type: "SET_GAME_STATUS"; payload: GameStatus }
  | { type: "LOAD_GAME"; payload: Partial<GameState> }

const initialState: GameState = {
  game: new Chess(),
  fen: new Chess().fen(),
  moveHistory: [],
  gameStatus: "playing",
  difficulty: "medium",
  playerColor: "white",
  currentTurn: "white",
  selectedSquare: null,
  possibleMoves: [],
  lastMove: null,
  capturedPieces: { white: [], black: [] },
  playerStyle: null,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MAKE_MOVE": {
      try {
        const newGame = new Chess(state.fen)

        // Validate that the move is legal before attempting it
        const possibleMoves = newGame.moves({ verbose: true })
        const moveDetails = possibleMoves.find(
          (move) => move.from === action.payload.from && move.to === action.payload.to,
        )

        if (!moveDetails) {
          console.warn(`Invalid move attempted: ${action.payload.from} to ${action.payload.to}`)
          return {
            ...state,
            selectedSquare: null,
            possibleMoves: [],
          }
        }

        // Attempt the move
        let moveResult
        try {
          // For pawn promotion, check if it's needed
          const piece = newGame.get(action.payload.from)
          const isPromotion =
            piece?.type === "p" &&
            ((piece.color === "w" && action.payload.to[1] === "8") ||
              (piece.color === "b" && action.payload.to[1] === "1"))

          if (isPromotion) {
            moveResult = newGame.move({
              from: action.payload.from,
              to: action.payload.to,
              promotion: action.payload.promotion || "q",
            })
          } else {
            moveResult = newGame.move({
              from: action.payload.from,
              to: action.payload.to,
            })
          }
        } catch (error) {
          console.error("Move failed:", error)
          return {
            ...state,
            selectedSquare: null,
            possibleMoves: [],
          }
        }

        if (!moveResult) {
          console.warn("Move was rejected by chess.js")
          return {
            ...state,
            selectedSquare: null,
            possibleMoves: [],
          }
        }

        // Track captured pieces
        const newCapturedPieces = { ...state.capturedPieces }
        if (moveDetails.captured) {
          const capturedPiece = `${moveDetails.color === "w" ? "b" : "w"}${moveDetails.captured.toUpperCase()}`
          if (moveDetails.color === "w") {
            newCapturedPieces.black.push(capturedPiece)
          } else {
            newCapturedPieces.white.push(capturedPiece)
          }
        }

        // Determine game status
        let newStatus: GameStatus = "playing"
        if (newGame.isGameOver()) {
          if (newGame.isCheckmate()) {
            newStatus = "checkmate"
          } else if (newGame.isStalemate()) {
            newStatus = "stalemate"
          } else {
            newStatus = "draw"
          }
        }

        return {
          ...state,
          game: newGame,
          fen: newGame.fen(),
          moveHistory: newGame.history(),
          gameStatus: newStatus,
          currentTurn: newGame.turn() === "w" ? "white" : "black",
          selectedSquare: null,
          possibleMoves: [],
          lastMove: {
            from: action.payload.from,
            to: action.payload.to,
            captured: moveDetails.captured,
          },
          capturedPieces: newCapturedPieces,
        }
      } catch (error) {
        console.error("Error in MAKE_MOVE:", error)
        return {
          ...state,
          selectedSquare: null,
          possibleMoves: [],
        }
      }
    }

    case "SET_SELECTED_SQUARE":
      return {
        ...state,
        selectedSquare: action.payload,
      }

    case "SET_POSSIBLE_MOVES":
      return {
        ...state,
        possibleMoves: action.payload,
      }

    case "SET_DIFFICULTY":
      return {
        ...state,
        difficulty: action.payload,
      }

    case "SET_PLAYER_COLOR":
      return {
        ...state,
        playerColor: action.payload,
      }

    case "SET_PLAYER_STYLE":
      return {
        ...state,
        playerStyle: action.payload,
        difficulty: action.payload ? "style" : "medium",
      }

    case "RESET_GAME": {
      const newGame = new Chess()
      return {
        ...initialState,
        difficulty: state.difficulty,
        playerColor: state.playerColor,
        playerStyle: state.playerStyle,
        game: newGame,
        fen: newGame.fen(),
        capturedPieces: { white: [], black: [] },
      }
    }

    case "UNDO_MOVE": {
      try {
        const newGame = new Chess(state.fen)

        // Undo the last move
        const undoResult = newGame.undo()
        if (!undoResult) {
          console.warn("No move to undo")
          return state
        }

        // If playing against AI, undo AI move too
        if (state.playerColor !== state.currentTurn && newGame.history().length > 0) {
          const secondUndo = newGame.undo()
          if (!secondUndo) {
            console.warn("Could not undo AI move")
          }
        }

        return {
          ...state,
          game: newGame,
          fen: newGame.fen(),
          moveHistory: newGame.history(),
          gameStatus: "playing",
          currentTurn: newGame.turn() === "w" ? "white" : "black",
          selectedSquare: null,
          possibleMoves: [],
          lastMove: null,
        }
      } catch (error) {
        console.error("Error in UNDO_MOVE:", error)
        return state
      }
    }

    case "SET_GAME_STATUS":
      return {
        ...state,
        gameStatus: action.payload,
      }

    case "LOAD_GAME":
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Save game state to localStorage
  useEffect(() => {
    try {
      const gameData = {
        fen: state.fen,
        moveHistory: state.moveHistory,
        difficulty: state.difficulty,
        playerColor: state.playerColor,
        playerStyle: state.playerStyle,
      }
      localStorage.setItem("smartchess-game", JSON.stringify(gameData))
    } catch (error) {
      console.error("Failed to save game state:", error)
    }
  }, [state.fen, state.moveHistory, state.difficulty, state.playerColor, state.playerStyle])

  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const savedGame = localStorage.getItem("smartchess-game")
      if (savedGame) {
        const gameData = JSON.parse(savedGame)
        const game = new Chess()

        // Replay moves to restore game state
        if (gameData.moveHistory && gameData.moveHistory.length > 0) {
          for (const moveStr of gameData.moveHistory) {
            try {
              game.move(moveStr)
            } catch (error) {
              console.error("Failed to replay move:", moveStr, error)
              // If we can't replay moves, start fresh
              return
            }
          }
        }

        dispatch({
          type: "LOAD_GAME",
          payload: {
            game,
            fen: game.fen(),
            moveHistory: game.history(),
            difficulty: gameData.difficulty || "medium",
            playerColor: gameData.playerColor || "white",
            playerStyle: gameData.playerStyle || null,
            currentTurn: game.turn() === "w" ? "white" : "black",
          },
        })
      }
    } catch (error) {
      console.error("Failed to load saved game:", error)
    }
  }, [])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
