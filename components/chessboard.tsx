"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Chess } from "chess.js"
import { useGame } from "@/context/game-context"
import { ChessPiece } from "./chess-pieces"
import { cn } from "@/lib/utils"

interface AnimatingPiece {
  piece: string
  from: string
  to: string
  startTime: number
}

export default function Chessboard() {
  const { state, dispatch } = useGame()
  const [animatingPieces, setAnimatingPieces] = useState<AnimatingPiece[]>([])
  const [draggedPiece, setDraggedPiece] = useState<{
    piece: string
    square: string
    startX: number
    startY: number
  } | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()

  // AI Move Logic
  useEffect(() => {
    if (state.currentTurn !== state.playerColor && state.gameStatus === "playing") {
      dispatch({ type: "SET_GAME_STATUS", payload: "thinking" })

      const thinkingTime = state.difficulty === "easy" ? 800 : state.difficulty === "medium" ? 1200 : 1800

      setTimeout(() => {
        const moves = state.game.moves({ verbose: true })
        if (moves.length > 0) {
          let selectedMove

          if (state.difficulty === "easy") {
            selectedMove = moves[Math.floor(Math.random() * moves.length)]
          } else if (state.difficulty === "medium") {
            const captures = moves.filter((move) => move.captured)
            const checks = moves.filter((move) => {
              const testGame = new Chess(state.fen)
              testGame.move(move)
              return testGame.inCheck()
            })

            if (captures.length > 0) {
              selectedMove = captures[Math.floor(Math.random() * captures.length)]
            } else if (checks.length > 0) {
              selectedMove = checks[Math.floor(Math.random() * checks.length)]
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)]
            }
          } else {
            const captures = moves.filter((move) => move.captured)
            const centerMoves = moves.filter((move) => ["d4", "d5", "e4", "e5"].includes(move.to))

            if (captures.length > 0) {
              const sortedCaptures = captures.sort((a, b) => {
                const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
                return (
                  (pieceValues[b.captured as keyof typeof pieceValues] || 0) -
                  (pieceValues[a.captured as keyof typeof pieceValues] || 0)
                )
              })
              selectedMove = sortedCaptures[0]
            } else if (centerMoves.length > 0) {
              selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)]
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)]
            }
          }

          // Add animation for AI move
          const piece = state.game.get(selectedMove.from)
          if (piece) {
            const animatingPiece: AnimatingPiece = {
              piece: `${piece.color}${piece.type.toUpperCase()}`,
              from: selectedMove.from,
              to: selectedMove.to,
              startTime: Date.now(),
            }
            setAnimatingPieces([animatingPiece])

            // Complete the move after animation
            setTimeout(() => {
              dispatch({
                type: "MAKE_MOVE",
                payload: { from: selectedMove.from, to: selectedMove.to },
              })
              setAnimatingPieces([])
            }, 600)
          } else {
            dispatch({
              type: "MAKE_MOVE",
              payload: { from: selectedMove.from, to: selectedMove.to },
            })
          }
        }

        dispatch({ type: "SET_GAME_STATUS", payload: "playing" })
      }, thinkingTime)
    }
  }, [state.currentTurn, state.playerColor, state.gameStatus, state.fen, state.difficulty, state.game, dispatch])

  // Animation loop
  useEffect(() => {
    if (animatingPieces.length > 0) {
      const animate = () => {
        setAnimatingPieces((pieces) => pieces.filter((piece) => Date.now() - piece.startTime < 600))
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animatingPieces])

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
    if (state.currentTurn !== state.playerColor || state.gameStatus !== "playing") return

    if (state.selectedSquare === square) {
      dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
      dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
      return
    }

    if (state.selectedSquare && state.possibleMoves.includes(square)) {
      // Add animation for player move
      const piece = state.game.get(state.selectedSquare)
      if (piece) {
        const animatingPiece: AnimatingPiece = {
          piece: `${piece.color}${piece.type.toUpperCase()}`,
          from: state.selectedSquare,
          to: square,
          startTime: Date.now(),
        }
        setAnimatingPieces([animatingPiece])

        setTimeout(() => {
          dispatch({
            type: "MAKE_MOVE",
            payload: { from: state.selectedSquare!, to: square },
          })
          setAnimatingPieces([])
        }, 300)
      } else {
        dispatch({
          type: "MAKE_MOVE",
          payload: { from: state.selectedSquare, to: square },
        })
      }
      return
    }

    const piece = state.game.get(square)
    if (piece && piece.color === (state.playerColor === "white" ? "w" : "b")) {
      const moves = state.game.moves({ square, verbose: true })
      dispatch({ type: "SET_SELECTED_SQUARE", payload: square })
      dispatch({ type: "SET_POSSIBLE_MOVES", payload: moves.map((move) => move.to) })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, square: string) => {
    if (state.currentTurn !== state.playerColor || state.gameStatus !== "playing") return

    const piece = state.game.get(square)
    if (piece && piece.color === (state.playerColor === "white" ? "w" : "b")) {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        setDraggedPiece({
          piece: `${piece.color}${piece.type.toUpperCase()}`,
          square,
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
        })
        setDragPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })

        const moves = state.game.moves({ square, verbose: true })
        dispatch({ type: "SET_SELECTED_SQUARE", payload: square })
        dispatch({ type: "SET_POSSIBLE_MOVES", payload: moves.map((move) => move.to) })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedPiece && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedPiece && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const squareSize = rect.width / 8
      const fileIndex = Math.floor(x / squareSize)
      const rankIndex = Math.floor(y / squareSize)

      const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
      const ranks = state.playerColor === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

      if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
        const targetSquare = `${files[fileIndex]}${ranks[rankIndex]}`
        if (state.possibleMoves.includes(targetSquare)) {
          handleSquareClick(targetSquare)
        }
      }

      setDraggedPiece(null)
      dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
      dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
    }
  }

  const renderSquare = (square: string, piece: any, isLight: boolean) => {
    const isSelected = state.selectedSquare === square
    const isPossibleMove = state.possibleMoves.includes(square)
    const isLastMove = state.lastMove && (state.lastMove.from === square || state.lastMove.to === square)
    const isDraggedFrom = draggedPiece?.square === square

    return (
      <div
        key={square}
        className={cn(
          "aspect-square flex items-center justify-center relative cursor-pointer transition-all duration-300 transform hover:scale-105",
          isLight
            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-100 dark:to-amber-200"
            : "bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 dark:from-amber-900 dark:to-black",
          isSelected && "ring-4 ring-blue-400 ring-inset shadow-xl animate-pulse",
          isLastMove &&
            "bg-gradient-to-br from-emerald-300 via-green-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-800",
          "shadow-inner border border-amber-600/20",
        )}
        onClick={() => handleSquareClick(square)}
        onMouseDown={(e) => handleMouseDown(e, square)}
      >
        {/* Enhanced possible move indicators */}
        {isPossibleMove && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {piece ? (
              <div className="w-full h-full bg-red-500/40 border-4 border-red-600 rounded-lg animate-pulse shadow-lg" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-lg animate-bounce border-2 border-green-300" />
            )}
          </div>
        )}

        {/* Enhanced chess piece rendering */}
        {piece && !isDraggedFrom && (
          <div className="relative z-20 transition-all duration-200 hover:scale-110 drop-shadow-2xl">
            <ChessPiece piece={`${piece.color}${piece.type.toUpperCase()}`} size={45} />
          </div>
        )}

        {/* Enhanced square coordinates */}
        <div
          className={cn(
            "absolute bottom-0.5 right-0.5 text-xs font-bold opacity-70 select-none",
            isLight ? "text-amber-900" : "text-amber-100",
          )}
        >
          {square}
        </div>

        {/* Square texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-white to-transparent pointer-events-none" />
      </div>
    )
  }

  const renderAnimatingPieces = () => {
    return animatingPieces.map((animPiece, index) => {
      const progress = Math.min((Date.now() - animPiece.startTime) / 600, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic

      const fromPos = getSquarePosition(animPiece.from)
      const toPos = getSquarePosition(animPiece.to)

      const currentX = fromPos.x + (toPos.x - fromPos.x) * easeProgress
      const currentY = fromPos.y + (toPos.y - fromPos.y) * easeProgress

      return (
        <div
          key={`${animPiece.from}-${animPiece.to}-${index}`}
          className="absolute z-20 pointer-events-none transition-transform duration-100"
          style={{
            left: `${currentX}%`,
            top: `${currentY}%`,
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(progress * Math.PI) * 0.2})`,
          }}
        >
          <ChessPiece piece={animPiece.piece} size={45} className="drop-shadow-2xl" />
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

  return (
    <div className="w-full max-w-sm mx-auto relative">
      {/* Enhanced board container with luxury styling */}
      <div className="relative p-6 bg-gradient-to-br from-amber-900 via-amber-950 to-black rounded-3xl shadow-2xl border-4 border-amber-700">
        {/* Decorative inner border */}
        <div className="absolute inset-4 bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 rounded-2xl shadow-inner border-2 border-amber-600/30"></div>

        {/* Wood grain texture overlay */}
        <div className="absolute inset-4 bg-gradient-to-br from-amber-700/20 via-transparent to-amber-900/20 rounded-2xl"></div>

        {/* Coordinate labels with enhanced styling */}
        <div className="relative z-10">
          {/* File labels (a-h) */}
          <div className="flex justify-between px-3 mb-2">
            {(state.playerColor === "white"
              ? ["a", "b", "c", "d", "e", "f", "g", "h"]
              : ["h", "g", "f", "e", "d", "c", "b", "a"]
            ).map((file) => (
              <div key={file} className="text-amber-200 text-sm font-bold w-8 text-center drop-shadow-lg">
                {file}
              </div>
            ))}
          </div>

          {/* Main board */}
          <div className="relative">
            {/* Rank labels (1-8) */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1 -ml-8">
              {(state.playerColor === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]).map((rank) => (
                <div key={rank} className="text-amber-200 text-sm font-bold h-8 flex items-center drop-shadow-lg">
                  {rank}
                </div>
              ))}
            </div>

            {/* Enhanced chess board */}
            <div
              ref={boardRef}
              className="grid grid-cols-8 gap-0 border-4 border-amber-950 rounded-xl overflow-hidden shadow-2xl relative bg-gradient-to-br from-amber-100 to-amber-200"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setDraggedPiece(null)
                dispatch({ type: "SET_SELECTED_SQUARE", payload: null })
                dispatch({ type: "SET_POSSIBLE_MOVES", payload: [] })
              }}
            >
              {renderBoard()}
              {renderAnimatingPieces()}

              {/* Enhanced dragged piece */}
              {draggedPiece && (
                <div
                  className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: dragPosition.x,
                    top: dragPosition.y,
                  }}
                >
                  <ChessPiece
                    piece={draggedPiece.piece}
                    size={55}
                    className="drop-shadow-2xl scale-125 animate-pulse"
                  />
                </div>
              )}
            </div>
          </div>

          {/* File labels bottom */}
          <div className="flex justify-between px-3 mt-2">
            {(state.playerColor === "white"
              ? ["a", "b", "c", "d", "e", "f", "g", "h"]
              : ["h", "g", "f", "e", "d", "c", "b", "a"]
            ).map((file) => (
              <div key={file} className="text-amber-200 text-sm font-bold w-8 text-center drop-shadow-lg">
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced game status indicators */}
      {state.gameStatus === "thinking" && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white px-8 py-4 rounded-full shadow-2xl border-2 border-purple-400">
            <div className="relative">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-6 h-6 border-3 border-white/30 rounded-full animate-ping"></div>
            </div>
            <span className="font-semibold text-lg">AI is thinking...</span>
          </div>
        </div>
      )}

      {/* Enhanced check indicator */}
      {state.game.inCheck() && state.gameStatus === "playing" && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-3 rounded-full shadow-2xl animate-pulse border-2 border-red-400">
            <span className="text-2xl">⚠️</span>
            <span className="font-bold text-lg">CHECK!</span>
          </div>
        </div>
      )}
    </div>
  )
}
