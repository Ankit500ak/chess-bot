export interface ParsedGame {
  moves: string[]
  result: string
  white: string
  black: string
  event?: string
  date?: string
  eco?: string
}

export interface PlayerStyle {
  name: string
  totalGames: number
  averageGameLength: number
  openingPreferences: Record<string, number>
  pieceActivity: {
    queenMoves: number
    rookMoves: number
    bishopMoves: number
    knightMoves: number
    pawnMoves: number
  }
  tacticalPatterns: {
    captures: number
    checks: number
    castling: number
    promotions: number
  }
  endgameStyle: {
    kingActivity: number
    pawnPushes: number
    pieceExchanges: number
  }
  aggressiveness: number // 0-100 scale
  positionalVsTactical: number // 0-100 (0 = tactical, 100 = positional)
}

// Optimized PGN parsing with better regex and streaming
export function parsePGN(pgnText: string): ParsedGame[] {
  const games: ParsedGame[] = []

  // Split games more efficiently
  const gameBlocks = pgnText.split(/(?=\[Event)/g).filter((block) => block.trim())

  for (const block of gameBlocks) {
    try {
      const game = parseGameBlock(block)
      if (game && game.moves.length > 5) {
        // Only include games with meaningful moves
        games.push(game)
      }
    } catch (error) {
      // Skip malformed games silently
      continue
    }
  }

  return games
}

function parseGameBlock(block: string): ParsedGame | null {
  const headers: Record<string, string> = {}
  let movesText = ""

  // More efficient header parsing
  const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g
  let match
  while ((match = headerRegex.exec(block)) !== null) {
    headers[match[1]] = match[2]
  }

  // Extract moves section more efficiently
  const movesMatch = block.match(/\]\s*\n\s*(.+?)(?:\s*(?:1-0|0-1|1\/2-1\/2|\*))?$/s)
  if (movesMatch) {
    movesText = movesMatch[1]
  }

  const moves = parseMoves(movesText)

  if (moves.length === 0) return null

  return {
    moves,
    result: headers.Result || "*",
    white: headers.White || "Unknown",
    black: headers.Black || "Unknown",
    event: headers.Event,
    date: headers.Date,
    eco: headers.ECO,
  }
}

// Optimized move parsing
function parseMoves(movesText: string): string[] {
  // Clean text more efficiently
  const cleanText = movesText
    .replace(/\{[^}]*\}/g, " ") // Remove comments
    .replace(/$$[^)]*$$/g, " ") // Remove variations
    .replace(/\$\d+/g, " ") // Remove annotations
    .replace(/[!?]+/g, "") // Remove move quality marks
    .replace(/\d+\.\s*/g, " ") // Remove move numbers
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, "") // Remove results
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  if (!cleanText) return []

  // Split and validate moves
  const tokens = cleanText.split(" ")
  const moves: string[] = []

  for (const token of tokens) {
    if (isValidMove(token)) {
      moves.push(token)
    }
  }

  return moves
}

// Faster move validation
function isValidMove(move: string): boolean {
  if (!move || move.length < 2) return false

  // Quick checks first
  if (move === "O-O" || move === "O-O-O") return true
  if (move.includes("O-O")) return move.match(/^O-O(-O)?[+#]?$/) !== null

  // Standard move pattern
  return /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$/.test(move)
}

// Optimized style analysis with early returns and caching
export function analyzePlayerStyle(games: ParsedGame[], playerName: string): PlayerStyle {
  const playerGames = games.filter(
    (game) =>
      game.white.toLowerCase().includes(playerName.toLowerCase()) ||
      game.black.toLowerCase().includes(playerName.toLowerCase()),
  )

  if (playerGames.length === 0) {
    throw new Error(`No games found for player: ${playerName}`)
  }

  // Initialize style object
  const style: PlayerStyle = {
    name: playerName,
    totalGames: playerGames.length,
    averageGameLength: 0,
    openingPreferences: {},
    pieceActivity: {
      queenMoves: 0,
      rookMoves: 0,
      bishopMoves: 0,
      knightMoves: 0,
      pawnMoves: 0,
    },
    tacticalPatterns: {
      captures: 0,
      checks: 0,
      castling: 0,
      promotions: 0,
    },
    endgameStyle: {
      kingActivity: 0,
      pawnPushes: 0,
      pieceExchanges: 0,
    },
    aggressiveness: 50,
    positionalVsTactical: 50,
  }

  let totalMoves = 0
  let playerMoveCount = 0

  // Analyze games efficiently
  for (const game of playerGames) {
    const moves = game.moves
    totalMoves += moves.length

    const isWhite = game.white.toLowerCase().includes(playerName.toLowerCase())

    // Quick opening analysis (first 6 moves only)
    const opening = moves.slice(0, 6).join(" ")
    if (opening) {
      style.openingPreferences[opening] = (style.openingPreferences[opening] || 0) + 1
    }

    // Analyze player's moves only
    for (let i = 0; i < Math.min(moves.length, 80); i++) {
      // Limit analysis for speed
      const move = moves[i]
      const isPlayerMove = (i % 2 === 0 && isWhite) || (i % 2 === 1 && !isWhite)

      if (!isPlayerMove) continue

      playerMoveCount++

      // Quick piece identification
      const firstChar = move[0]
      if (firstChar === "Q") style.pieceActivity.queenMoves++
      else if (firstChar === "R") style.pieceActivity.rookMoves++
      else if (firstChar === "B") style.pieceActivity.bishopMoves++
      else if (firstChar === "N") style.pieceActivity.knightMoves++
      else if (firstChar === "K") {
        // King moves (not castling)
        if (!move.includes("O")) {
          if (i >= moves.length - 20) style.endgameStyle.kingActivity++
        }
      } else {
        // Pawn moves
        style.pieceActivity.pawnMoves++
        if (i >= moves.length - 20) style.endgameStyle.pawnPushes++
      }

      // Quick pattern recognition
      if (move.includes("x")) {
        style.tacticalPatterns.captures++
        if (i >= moves.length - 20) style.endgameStyle.pieceExchanges++
      }
      if (move.includes("+") || move.includes("#")) style.tacticalPatterns.checks++
      if (move.includes("O-O")) style.tacticalPatterns.castling++
      if (move.includes("=")) style.tacticalPatterns.promotions++
    }
  }

  // Calculate metrics
  style.averageGameLength = Math.round(totalMoves / playerGames.length)

  // Calculate aggressiveness (captures + checks per game)
  const capturesPerGame = style.tacticalPatterns.captures / playerGames.length
  const checksPerGame = style.tacticalPatterns.checks / playerGames.length
  style.aggressiveness = Math.min(100, Math.max(0, Math.round((capturesPerGame + checksPerGame) * 8)))

  // Calculate positional vs tactical
  const totalPieceMoves = Object.values(style.pieceActivity).reduce((a, b) => a + b, 0)
  if (totalPieceMoves > 0) {
    const minorPieceMoves = style.pieceActivity.bishopMoves + style.pieceActivity.knightMoves
    style.positionalVsTactical = Math.round((minorPieceMoves / totalPieceMoves) * 100)
  }

  return style
}

// Optimized move selection
export function getStyleBasedMove(
  possibleMoves: any[],
  playerStyle: PlayerStyle,
  gamePhase: "opening" | "middlegame" | "endgame",
): any {
  if (possibleMoves.length === 0) return null

  // Quick scoring
  const scoredMoves = possibleMoves.map((move) => {
    let score = Math.random() * 3 // Base randomness

    // Aggressiveness bonus
    if (move.captured) {
      score += (playerStyle.aggressiveness / 100) * 5
    }

    // Piece preference (simplified)
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

  // Sort and pick from top 30%
  scoredMoves.sort((a, b) => b.score - a.score)
  const topCount = Math.max(1, Math.floor(scoredMoves.length * 0.3))
  const topMoves = scoredMoves.slice(0, topCount)

  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}
