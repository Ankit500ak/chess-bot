"use client"

import { ChessPiece } from "./chess-pieces"
import { useGame } from "@/context/game-context"
import { cn } from "@/lib/utils"

interface CapturedPiecesProps {
  color: "white" | "black"
  className?: string
}

export default function CapturedPieces({ color, className }: CapturedPiecesProps) {
  const { state } = useGame()
  const capturedPieces = state.capturedPieces[color]

  if (capturedPieces.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-2 bg-black/10 rounded-lg", className)}>
        <span className="text-xs text-slate-400">No captures yet</span>
      </div>
    )
  }

  // Group pieces by type for better display
  const groupedPieces = capturedPieces.reduce(
    (acc, piece) => {
      const pieceType = piece.slice(1) // Remove color prefix
      if (!acc[pieceType]) {
        acc[pieceType] = []
      }
      acc[pieceType].push(piece)
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Order pieces by value (highest first)
  const pieceOrder = ["Q", "R", "B", "N", "P"]
  const orderedPieces = pieceOrder.flatMap((type) => groupedPieces[type] || [])

  return (
    <div className={cn("flex flex-wrap gap-1 p-2 bg-black/10 rounded-lg", className)}>
      <div className="text-xs text-slate-400 mb-1 w-full">Captured ({capturedPieces.length})</div>
      <div className="flex flex-wrap gap-1">
        {orderedPieces.map((piece, index) => (
          <div key={`${piece}-${index}`} className="opacity-70">
            <ChessPiece piece={piece} size={20} />
          </div>
        ))}
      </div>
    </div>
  )
}
