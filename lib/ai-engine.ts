import { Chess } from "chess.js"
import type { PlayerStyle } from "./pgn-parser"
// Add type definitions for chess.js
interface ChessMove {
  from: string
  to: string
  flags: string
  piece: string
  captured?: string
  san: string
}

interface ChessGame {
  moves: (options?: { verbose?: boolean }) => ChessMove[]
  fen: () => string
  history: (options?: { verbose?: boolean }) => ChessMove[]
  isGameOver: () => boolean
  isCheckmate: () => boolean
  isStalemate: () => boolean
  turn: () => string
  move: (move: string | { from: string, to: string, promotion?: string }) => ChessMove | null
  load: (fen: string) => boolean
}

export type AIPersonality = "defensive-tactical" | "aggressive" | "positional" | "balanced" | "style-based"

export interface AIConfig {
  personality: AIPersonality
  thinkingTime: number
  playerStyle?: PlayerStyle
}

// Default defensive tactical AI
export function getDefensiveTacticalMove(game: Chess): any {
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  // Score moves based on defensive tactical principles
  const scoredMoves = moves.map((move) => {
    let score = Math.random() * 2 // Base randomness

    // Defensive priorities

    // 1. Captures are good (tactical)
    if (move.captured) {
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
      const captureValue = pieceValues[move.captured as keyof typeof pieceValues] || 0
      const pieceValue = pieceValues[move.piece as keyof typeof pieceValues] || 0

      // Good captures (winning material)
      if (captureValue >= pieceValue) {
        score += captureValue * 2
      } else {
        // Bad captures (losing material) - still consider but lower score
        score += captureValue * 0.5
      }
    }

    // 2. Checks are tactical opportunities
    if (move.san.includes("+")) {
      score += 3
    }

    // 3. Checkmate is highest priority
    if (move.san.includes("#")) {
      score += 100
    }

    // 4. Defensive piece development
    if (move.piece === "n" || move.piece === "b") {
      // Develop knights and bishops
      if (move.from[1] === "1" || move.from[1] === "8") {
        score += 2 // Developing from back rank
      }
    }

    // 5. Central control (defensive positioning)
    const centralSquares = ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"]
    if (centralSquares.includes(move.to)) {
      score += 1.5
    }

    // 6. Castling for king safety (defensive)
    if (move.san.includes("O-O")) {
      score += 4
    }

    // 7. Avoid moving the same piece twice in opening
    const moveCount = game.history().length
    if (moveCount < 16) {
      // Opening phase
      const recentMoves = game.history({ verbose: true }).slice(-4)
      const samePieceMoved = recentMoves.some(
        (prevMove) => prevMove.piece === move.piece && prevMove.from === move.from,
      )
      if (samePieceMoved) {
        score -= 1 // Slight penalty for moving same piece
      }
    }

    // 8. Protect important pieces
    if (move.piece === "k" && moveCount > 20) {
      // King activity in endgame
      score += 1
    }

    // 9. Pawn structure considerations
    if (move.piece === "p") {
      // Avoid isolated pawns in opening/middlegame
      if (moveCount < 40) {
        const file = move.to[0]
        const adjacentFiles = [String.fromCharCode(file.charCodeAt(0) - 1), String.fromCharCode(file.charCodeAt(0) + 1)]

        // Simple check for pawn support (not perfect but fast)
        const hasPawnSupport = moves.some((m) => m.piece === "p" && adjacentFiles.includes(m.to[0]))

        if (hasPawnSupport) {
          score += 0.5
        }
      }
    }

    return { move, score }
  })

  // Sort by score and pick from top moves
  scoredMoves.sort((a, b) => b.score - a.score)

  // Pick from top 30% of moves to maintain some unpredictability
  const topCount = Math.max(1, Math.floor(scoredMoves.length * 0.3))
  const topMoves = scoredMoves.slice(0, topCount)

  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}

export function getAIMove(game: Chess, config: AIConfig): any {
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  switch (config.personality) {
    case "defensive-tactical":
      return getDefensiveTacticalMove(game)

    case "aggressive":
      return getCarlsenStyleMove(game)  // Updated to use Carlsen's style for hard mode

    case "positional":
      return getPositionalMove(game)

    case "style-based":
      if (config.playerStyle) {
        return getStyleBasedMove(game, config.playerStyle)
      }
      // Fallback to Carlsen's style
      return getCarlsenStyleMove(game)

    default:
      return getCarlsenStyleMove(game)  // Default to Carlsen's style
  }
}

function getCarlsenStyleMove(game: Chess): any {
  const moves = game.moves({ verbose: true })
  const moveCount = game.history().length
  const isEndgame = game.board().flat().filter(p => p && p.type !== 'k').length <= 10

  const scoredMoves = moves.map((move) => {
    let score = Math.random() * 2  // Base randomness
    const piece = move.piece
    const to = move.to
    const from = move.from
    
    // Tactical elements (Carlsen is excellent at converting small advantages)
    if (move.captured) {
      const pieceValues = { p: 1, n: 3, b: 3.25, r: 5, q: 9, k: 0 }
      const captureValue = pieceValues[move.captured as keyof typeof pieceValues] || 0
      score += captureValue * 1.5
    }

    // King safety and activity based on game phase
    if (piece === 'k') {
      if (isEndgame) {
        // King activity in endgame (Carlsen is known for his endgame technique)
        score += 1.5
        // Centralize the king in endgames
        const centerDistance = Math.abs(4.5 - (to.charCodeAt(0) - 'a'.charCodeAt(0)))
        score += (4 - centerDistance) * 0.5
      } else {
        // Keep king safe in opening/middlegame
        const rank = to[1]
        if (rank === '1' || rank === '8') score -= 1
      }
    }

    // Pawn structure (Carlsen is excellent at creating and exploiting weaknesses)
    if (piece === 'p') {
      // Create passed pawns
      const file = to[0]
      const isPassed = !game.board().some((row, rankIdx) => {
        const square = row[file.charCodeAt(0) - 97]
        return square && square.color !== game.turn() && square.type === 'p' && 
               ((game.turn() === 'w' && rankIdx < parseInt(to[1])) || 
                (game.turn() === 'b' && rankIdx + 1 > parseInt(to[1])))
      })
      
      if (isPassed) {
        score += 3
        // Push passed pawns in endgame
        if (isEndgame) score += 2
      }
      
      // Avoid isolated pawns
      const adjacentFiles = [String.fromCharCode(file.charCodeAt(0) - 1), String.fromCharCode(file.charCodeAt(0) + 1)]
      const hasPawnSupport = game.board().some(row => 
        row.some(sq => 
          sq && 
          sq.type === 'p' && 
          sq.color === game.turn() && 
          adjacentFiles.includes(String.fromCharCode(sq.square.charCodeAt(0))))
      )
      if (!hasPawnSupport) score -= 1.5
    }

    // Piece activity (Carlsen is great at improving piece placement)
    const centralSquares = ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"]
    const strongSquares = {
      'n': ["d5", "e5", "d4", "e4", "f5", "f4", "c5", "c4"],
      'b': ["d5", "e5", "d4", "e4", "f5", "f4", "c5", "c4", "a3", "h3", "a6", "h6"],
      'r': ["d1", "e1", "d8", "e8", "d2", "e2", "d7", "e7", "c1", "f1", "c8", "f8"],
      'q': ["d3", "e3", "d6", "e6", "c3", "f3", "c6", "f6"]
    }

    if (piece in strongSquares) {
      if (strongSquares[piece as keyof typeof strongSquares].includes(to)) {
        score += 1.5
      }
    }

    // Tactical shots
    if (move.san.includes('+')) score += 3
    if (move.san.includes('#')) score += 100
    if (move.san.includes('x') && !isEndgame) score += 1.5  // More aggressive in non-endgames

    // King safety (opposite of Carlsen's opponents)
    if (piece !== 'k') {
      const opponentKingSquare = game.board().flat().find(sq => sq && sq.type === 'k' && sq.color !== game.turn())?.square
      if (opponentKingSquare) {
        const kingFile = opponentKingSquare[0].charCodeAt(0) - 'a'.charCodeAt(0)
        const kingRank = parseInt(opponentKingSquare[1])
        const toFile = to.charCodeAt(0) - 'a'.charCodeAt(0)
        const toRank = parseInt(to[1])
        
        // Encourage moves that bring pieces closer to the enemy king
        const distance = Math.max(Math.abs(kingFile - toFile), Math.abs(kingRank - toRank))
        score += (8 - distance) * 0.3
      }
    }

    // Endgame technique (Carlsen's specialty)
    if (isEndgame) {
      // Activate the king
      if (piece === 'k') {
        score += 1.5
      }
      
      // Rook activity in endgames
      if (piece === 'r') {
        // Rooks belong behind passed pawns
        const file = to[0]
        const isBehindPassedPawn = game.board().some(row => 
          row.some(sq => {
            if (!sq || sq.type !== 'p' || sq.color !== game.turn()) return false
            const pawnFile = sq.square[0]
            const pawnRank = parseInt(sq.square[1])
            const isPassed = !game.board().some((r, rIdx) => {
              const s = r[pawnFile.charCodeAt(0) - 97]
              return s && s.type === 'p' && s.color !== game.turn() && 
                     ((game.turn() === 'w' && rIdx < pawnRank) || 
                      (game.turn() === 'b' && rIdx + 1 > pawnRank))
            })
            return isPassed && file === pawnFile && 
                   ((game.turn() === 'w' && to[1] > sq.square[1]) || 
                    (game.turn() === 'b' && to[1] < sq.square[1]))
          })
        )
        
        if (isBehindPassedPawn) score += 2.5
      }
    }

    return { move, score }
  })

  // Sort by score and pick from top moves
  scoredMoves.sort((a, b) => b.score - a.score)
  
  // Pick from top 20% of moves to maintain some unpredictability but still be strong
  const topCount = Math.max(1, Math.floor(scoredMoves.length * 0.2))
  const topMoves = scoredMoves.slice(0, topCount)
  
  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}

function getPositionalMove(game: Chess): any {
  const moves = game.moves({ verbose: true })

  const scoredMoves = moves.map((move) => {
    let score = Math.random() * 2

    // Positional priorities
    if (move.piece === "n" || move.piece === "b") score += 2 // Piece development
    if (move.san.includes("O-O")) score += 3 // Castling

    // Central control
    const centralSquares = ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"]
    if (centralSquares.includes(move.to)) score += 2

    // Avoid early queen moves
    if (move.piece === "q" && game.history().length < 10) score -= 2

    return { move, score }
  })

  scoredMoves.sort((a, b) => b.score - a.score)
  const topMoves = scoredMoves.slice(0, Math.max(1, Math.floor(scoredMoves.length * 0.3)))
  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}

function getStyleBasedMove(game: Chess, playerStyle: PlayerStyle): any {
  const moves = game.moves({ verbose: true })
  const moveCount = game.history().length

  const gamePhase = moveCount < 15 ? "opening" : moveCount < 50 ? "middlegame" : "endgame"

  const scoredMoves = moves.map((move) => {
    let score = Math.random() * 2

    // Apply style-based scoring
    if (move.captured) {
      score += (playerStyle.aggressiveness / 100) * 5
    }

    // Piece preferences
    const piece = move.piece
    switch (piece) {
      case "q":
        score += playerStyle.pieceActivity.queenMoves / 200
        break
      case "r":
        score += playerStyle.pieceActivity.rookMoves / 200
        break
      case "b":
        score += playerStyle.pieceActivity.bishopMoves / 200
        break
      case "n":
        score += playerStyle.pieceActivity.knightMoves / 200
        break
      case "p":
        score += playerStyle.pieceActivity.pawnMoves / 200
        break
    }

    // Endgame king activity
    if (gamePhase === "endgame" && piece === "k") {
      score += playerStyle.endgameStyle.kingActivity / 100
    }

    return { move, score }
  })

  scoredMoves.sort((a, b) => b.score - a.score)
  const topMoves = scoredMoves.slice(0, Math.max(1, Math.floor(scoredMoves.length * 0.3)))
  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}
