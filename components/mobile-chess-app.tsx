"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Undo2, Shuffle, Crown, Menu, X, Upload, Brain, Shield } from "lucide-react"
import { useGame } from "@/context/game-context"
import MobileChessboard from "./mobile-chessboard"
import PGNUpload from "./pgn-upload"
import { cn } from "@/lib/utils"
import type { PlayerStyle } from "@/lib/pgn-parser"

export default function MobileChessApp() {
  const { state, dispatch } = useGame()
  const [showMenu, setShowMenu] = useState(false)
  const [showPGNUpload, setShowPGNUpload] = useState(false)

  const getStatusMessage = () => {
    switch (state.gameStatus) {
      case "checkmate":
        return state.currentTurn === state.playerColor ? "You Lost!" : "You Won!"
      case "stalemate":
        return "Stalemate!"
      case "draw":
        return "Draw!"
      case "thinking":
        if (state.playerStyle) {
          return `${state.playerStyle.name} thinking...`
        }
        return getAIDescription() + " thinking..."
      default:
        return state.currentTurn === state.playerColor
          ? "Your Turn"
          : state.playerStyle
            ? `${state.playerStyle.name}'s Turn`
            : getAIDescription() + "'s Turn"
    }
  }

  const getAIDescription = () => {
    switch (state.difficulty) {
      case "easy":
        return "Defensive AI"
      case "medium":
        return "Balanced AI"
      case "hard":
        return "Aggressive AI"
      default:
        return "Defensive AI"
    }
  }

  const getStatusColor = () => {
    switch (state.gameStatus) {
      case "checkmate":
        return state.currentTurn === state.playerColor ? "bg-red-500" : "bg-green-500"
      case "thinking":
        return "bg-blue-500"
      default:
        return state.currentTurn === state.playerColor ? "bg-emerald-500" : "bg-orange-500"
    }
  }

  const handleRestart = () => {
    dispatch({ type: "RESET_GAME" })
    setShowMenu(false)
  }

  const handleUndo = () => {
    if (state.moveHistory.length > 0) {
      dispatch({ type: "UNDO_MOVE" })
    }
    setShowMenu(false)
  }

  const handleSwitchColors = () => {
    dispatch({
      type: "SET_PLAYER_COLOR",
      payload: state.playerColor === "white" ? "black" : "white",
    })
    dispatch({ type: "RESET_GAME" })
    setShowMenu(false)
  }

  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    dispatch({ type: "SET_DIFFICULTY", payload: difficulty })
    dispatch({ type: "SET_PLAYER_STYLE", payload: null })
    setShowMenu(false)
  }

  const handleStyleSelected = (style: PlayerStyle) => {
    dispatch({ type: "SET_PLAYER_STYLE", payload: style })
    dispatch({ type: "RESET_GAME" })
    setShowPGNUpload(false)
    setShowMenu(false)
  }

  const handleRemoveStyle = () => {
    dispatch({ type: "SET_PLAYER_STYLE", payload: null })
    dispatch({ type: "SET_DIFFICULTY", payload: "easy" }) // Default to defensive tactical
    setShowMenu(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SmartChess</h1>
            <p className="text-xs text-slate-300">
              {state.playerStyle ? `vs ${state.playerStyle.name}` : `vs ${getAIDescription()}`}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="text-white hover:bg-white/10"
        >
          {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Game Status */}
      <div className="px-4 pb-4">
        <Card className="p-3 bg-black/30 backdrop-blur-sm border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full animate-pulse", getStatusColor())} />
              <span className="text-white font-medium">{getStatusMessage()}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-300">
                {state.playerStyle ? (
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span>Style Mode</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>{getAIDescription()}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">Playing as {state.playerColor}</div>
            </div>
          </div>

          {/* Player Style Info */}
          {state.playerStyle && (
            <div className="mt-2 p-2 bg-purple-500/20 rounded border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-purple-300 font-medium">{state.playerStyle.name}</span>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                    {Math.round(state.playerStyle.aggressiveness)}% Aggressive
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Default AI Info */}
          {!state.playerStyle && (
            <div className="mt-2 p-2 bg-blue-500/20 rounded border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-medium">Defensive Tactical AI</span>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300">
                    Balanced Strategy
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Capture indicator */}
          {state.lastMove?.captured && (
            <div className="mt-2 text-center">
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-1 rounded-full text-xs animate-pulse">
                <span>💥</span>
                <span>Piece Captured!</span>
              </div>
            </div>
          )}

          {state.game.inCheck() && state.gameStatus === "playing" && (
            <div className="mt-2 text-center">
              <Badge className="bg-red-500 text-white animate-pulse">⚠️ CHECK!</Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Main Chessboard - Takes most of the screen */}
      <div className="flex-1 flex items-center justify-center px-4">
        <MobileChessboard />
      </div>

      {/* Move History - Compact */}
      <div className="px-4 py-2">
        <Card className="p-3 bg-black/30 backdrop-blur-sm border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Recent Moves</span>
            <span className="text-xs text-slate-400">{state.moveHistory.length} moves</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {state.moveHistory.slice(-6).map((move, index) => (
              <div
                key={index}
                className="bg-slate-700/50 px-2 py-1 rounded text-xs text-white font-mono whitespace-nowrap"
              >
                {move}
              </div>
            ))}
            {state.moveHistory.length === 0 && <div className="text-xs text-slate-400">No moves yet</div>}
          </div>
        </Card>
      </div>

      {/* Slide-up Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-slate-800 rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Game Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Player Style Section */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Opponent</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-purple-600 text-white border-purple-500"
                  onClick={() => setShowPGNUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Player Style (PGN)
                </Button>

                {state.playerStyle && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-slate-700 text-slate-300 border-slate-600"
                    onClick={handleRemoveStyle}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove {state.playerStyle.name}
                  </Button>
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            {!state.playerStyle && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">AI Difficulty</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "easy", label: "Defensive", icon: Shield },
                    { key: "medium", label: "Balanced", icon: Brain },
                    { key: "hard", label: "Aggressive", icon: Crown },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={state.difficulty === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDifficultyChange(key as "easy" | "medium" | "hard")}
                      className={cn(
                        "text-xs flex flex-col gap-1 h-auto py-2",
                        state.difficulty === key
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-300 border-slate-600",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Game Controls */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-700 text-white border-slate-600"
                onClick={handleUndo}
                disabled={state.moveHistory.length === 0 || state.gameStatus === "thinking"}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Undo Move
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-slate-700 text-white border-slate-600"
                onClick={handleSwitchColors}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Switch Colors
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-red-600 text-white border-red-500"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PGN Upload Modal */}
      {showPGNUpload && <PGNUpload onStyleSelected={handleStyleSelected} onClose={() => setShowPGNUpload(false)} />}
    </div>
  )
}
