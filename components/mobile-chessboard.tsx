"use client"

import { useEffect, useState, useRef } from "react"
import { useGame } from "@/context/game-context"
import { ChessPiece } from "./chess-pieces"
import { cn } from "@/lib/utils"
import CapturedPieces from "./captured-pieces"
import { getAIMove } from "@/lib/ai-engine"

interface AnimatingPiece {
  piece: string
  from: string
  to: string
  startTime: number
}

export default function MobileChessboard() {
  const { state, dispatch } = useGame()
  const [animatingPieces, setAnimatingPieces] = useState<AnimatingPiece[]>([])
  const boardRef = useRef<HTMLDivElement>(null)

  // AI Move Logic with enhanced AI engine
  useEffect(() => {
    if (state.currentTurn !== state.playerColor && state.gameStatus === "playing") {
      dispatch({ type: "SET_GAME_STATUS", payload: "thinking" })

      // Determine AI personality and thinking time
      let personality: "defensive-tactical" | "aggressive" | "positional" | "balanced" | "style-based" =
        "defensive-tactical"
      let thinkingTime = 500

      if (state.difficulty === "style" && state.playerStyle) {
        personality = "style-based"
        thinkingTime = 600
      } else if (state.difficulty === "easy") {
        personality = "defensive-tactical"
        thinkingTime = 300
      } else if (state.difficulty === "medium") {
        personality = "balanced"
        thinkingTime = 400
      } else if (state.difficulty === "hard") {
        personality = "aggressive"
        thinkingTime = 500
      }

      const timeoutId = setTimeout(() => {
        try {
          const selectedMove = getAIMove(state.game, {
            personality,
            thinkingTime,
            playerStyle: state.playerStyle || undefined,
          })

          if (!selectedMove) {
            dispatch({ type: "SET_GAME_STATUS", payload: "playing" })
            return
          }

          // Quick animation
          const piece = state.game.get(selectedMove.from)
          if (piece) {
            const animatingPiece: AnimatingPiece = {
              piece: `${piece.color}${piece.type.toUpperCase()}`,
              from: selectedMove.from,
              to: selectedMove.to,
              startTime: Date.now(),
            }
            setAnimatingPieces([animatingPiece])

            setTimeout(() => {
              dispatch({
                type: "MAKE_MOVE",
                payload: {
                  from: selectedMove.from,
                  to: selectedMove.to,
                  promotion: selectedMove.promotion,
                },
              })
              setAnimatingPieces([])
              dispatch({ type: "SET_GAME_STATUS", payload: "playing" })
            }, 150)
          } else {
            dispatch({
              type: "MAKE_MOVE",
              payload: {
                from: selectedMove.from,
                to: selectedMove.to,
                promotion: selectedMove.promotion,
              },
            })
            dispatch({ type: "SET_GAME_STATUS", payload: "playing" })
          }
        } catch (error) {
          console.error("AI move error:", error)
          dispatch({ type: "SET_GAME_STATUS", payload: "playing" })
        }
      }, thinkingTime)

      return () => clearTimeout(timeoutId)
    }
  }, [
    state.currentTurn,
    state.playerColor,
    state.gameStatus,
    state.fen,
    state.difficulty,
    state.playerStyle,
    state.moveHistory.length,
    dispatch,
  ])

  const getSquarePosition = (square: string) => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

    const file = square[0]
    const rank = Number.parseInt(square[1])

    const fileIndex = files.indexOf(file)
    const rankIndex = ranks.indexOf(rank)

    if (state.playerColor === "black") {
      return {
        x: (7 - fileIndex) * 12.5,
        y: (7 - rankIndex) * 12.5,
      }
    }

    return {
      x: fileIndex * 12.5,
      y: rankIndex * 12.5,
    }
  }

  const handleSquareClick = (square: string) => {
    // Prevent moves when it's not player's turn or game is over
    if (state.currentTurn !== state.playerColor || state.gameStatus !== "playing") {
      return
    }

    // If clicking the same square, deselect
    if (state.selectedSquare === square) {
      dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
      dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
      return
    }

    // If a square is selected and clicking on a possible move
    if (state.selectedSquare && state.possibleMoves.includes(square)) {
      // Check if this is a pawn promotion
      const piece = state.game.get(state.selectedSquare)
      let promotion: string | undefined

      if (piece?.type === "p") {
        const isPromotion = (piece.color === "w" && square[1] === "8") || (piece.color === "b" && square[1] === "1")
        if (isPromotion) {
          promotion = "q" // Auto-promote to queen for simplicity
        }
      }

      // Instant move for player - no animation lag
      dispatch({
        type: "MAKE_MOVE",
        payload: {
          from: state.selectedSquare,
          to: square,
          promotion,
        },
      })
      return
    }

    // Select a new piece
    const piece = state.game.get(square)
    if (piece && piece.color === (state.playerColor === "white" ? "w" : "b")) {
      try {
        const moves = state.game.moves({ square, verbose: true })
        dispatch({ type: "SET_SELECTED_SQUARE", payload: square })
        dispatch({ type: "SET_POSSIBLE_MOVES", payload: moves.map((move) => move.to) })
      } catch (error) {
        console.error("Error getting moves for square:", square, error)
        dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
        dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
      }
    } else {
      // Clear selection if clicking on empty square or opponent piece
      dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
      dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
    }
  }

  const renderSquare = (square: string, piece: any, isLight: boolean) => {
    const isSelected = state.selectedSquare === square
    const isPossibleMove = state.possibleMoves.includes(square)
    const isLastMove = state.lastMove && (state.lastMove.from === square || state.lastMove.to === square)
    const isCapture = state.lastMove && state.lastMove.to === square && state.lastMove.captured

    return (
      <div
        key={square}
        className={cn(
          "aspect-square flex items-center justify-center relative cursor-pointer transition-colors duration-150",
          // Base square colors - simplified
          isLight ? "bg-amber-100" : "bg-amber-700",
          // Selected square - bright blue focus
          isSelected && "bg-blue-400 ring-2 ring-blue-600",
          // Last move highlighting - green
          isLastMove && !isCapture && "bg-green-400",
          // Capture highlighting - red
          isCapture && "bg-red-500",
          // Hover effect - simple brightness
          "hover:brightness-110 active:brightness-90",
        )}
        onClick={() => handleSquareClick(square)}
      >
        {/* Simplified possible move indicators */}
        {isPossibleMove && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {piece ? (
              // Capture indicator - simple red border
              <div className="w-full h-full border-4 border-red-600 bg-red-400/30"></div>
            ) : (
              // Move indicator - simple green dot
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            )}
          </div>
        )}

        {/* Chess piece - no hover effects for performance */}
        {piece && (
          <div className="relative z-20">
            <ChessPiece
              piece={`${piece.color}${piece.type.toUpperCase()}`}
              size={typeof window !== "undefined" && window.innerWidth < 400 ? 32 : 40}
            />
          </div>
        )}

        {/* Square label - smaller and simpler */}
        <div
          className={cn(
            "absolute bottom-0 right-0 text-xs opacity-40 p-0.5",
            isLight ? "text-amber-800" : "text-amber-100",
          )}
        >
          {square}
        </div>
      </div>
    )
  }

  const renderAnimatingPieces = () => {
    return animatingPieces.map((animPiece, index) => {
      const progress = Math.min((Date.now() - animPiece.startTime) / 200, 1)
      const easeProgress = progress

      const fromPos = getSquarePosition(animPiece.from)
      const toPos = getSquarePosition(animPiece.to)

      const currentX = fromPos.x + (toPos.x - fromPos.x) * easeProgress
      const currentY = fromPos.y + (toPos.y - fromPos.y) * easeProgress

      return (
        <div
          key={`${animPiece.from}-${animPiece.to}-${index}`}
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${currentX}%`,
            top: `${currentY}%`,
            transform: `translate(-50%, -50%)`,
          }}
        >
          <ChessPiece piece={animPiece.piece} size={40} />
        </div>
      )
    })
  }

  const renderBoard = () => {
    const squares = []
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
    const ranks = state.playerColor === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

    for (const rank of ranks) {
      for (const file of files) {
        const square = `${file}${rank}`
        const piece = state.game.get(square)
        const isLight = (files.indexOf(file) + rank) % 2 === 1

        squares.push(renderSquare(square, piece, isLight))
      }
    }

    return squares
  }

  const getAIDescription = () => {
    if (state.playerStyle) {
      return `${state.playerStyle.name} (Style Mode)`
    }

    switch (state.difficulty) {
      case "easy":
        return "Defensive Tactical AI"
      case "medium":
        return "Balanced AI"
      case "hard":
        return "Aggressive AI"
      default:
        return "Defensive Tactical AI"
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* Captured pieces for opponent - simplified */}
      <CapturedPieces color={state.playerColor === "white" ? "black" : "white"} className="min-h-[50px]" />

      {/* Board container - simplified styling */}
      <div className="relative p-3 bg-amber-900 rounded-xl shadow-lg">
        {/* Coordinate labels - smaller */}
        <div className="flex justify-between px-1 mb-1">
          {(state.playerColor === "white"
            ? ["a", "b", "c", "d", "e", "f", "g", "h"]
            : ["h", "g", "f", "e", "d", "c", "b", "a"]
          ).map((file) => (
            <div key={file} className="text-amber-200 text-xs w-8 text-center">
              {file}
            </div>
          ))}
        </div>

        {/* Main board */}
        <div className="relative">
          {/* Rank labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-0.5 -ml-5">
            {(state.playerColor === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]).map((rank) => (
              <div key={rank} className="text-amber-200 text-xs h-8 flex items-center">
                {rank}
              </div>
            ))}
          </div>

          {/* Chess board - simplified border */}
          <div
            ref={boardRef}
            className="grid grid-cols-8 gap-0 border border-amber-950 rounded-lg overflow-hidden shadow-md relative"
          >
            {renderBoard()}
            {renderAnimatingPieces()}
          </div>
        </div>

        {/* Bottom coordinates */}
        <div className="flex justify-between px-1 mt-1">
          {(state.playerColor === "white"
            ? ["a", "b", "c", "d", "e", "f", "g", "h"]
            : ["h", "g", "f", "e", "d", "c", "b", "a"]
          ).map((file) => (
            <div key={file} className="text-amber-200 text-xs w-8 text-center">
              {file}
            </div>
          ))}
        </div>
      </div>

      {/* Captured pieces for player */}
      <CapturedPieces color={state.playerColor} className="min-h-[50px]" />

      {/* AI thinking indicator with style info */}
      {state.gameStatus === "thinking" && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">{getAIDescription()} thinking...</span>
          </div>
        </div>
      )}
    </div>
  )
}
