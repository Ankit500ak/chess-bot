"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Crown, Moon, Sun, Menu, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import Chessboard from "./chessboard"
import MoveHistory from "./move-history"
import GameControls from "./game-controls"
import DifficultySelector from "./difficulty-selector"
import { useGame } from "@/context/game-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function GameScreen() {
  const { state } = useGame()
  const { theme, setTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  const getStatusMessage = () => {
    switch (state.gameStatus) {
      case "checkmate":
        return state.currentTurn === state.playerColor ? "You Lost!" : "You Won!"
      case "stalemate":
        return "Stalemate!"
      case "draw":
        return "Draw!"
      case "thinking":
        return "AI is thinking..."
      default:
        return state.currentTurn === state.playerColor ? "Your Turn" : "AI Turn"
    }
  }

  const getStatusColor = () => {
    switch (state.gameStatus) {
      case "checkmate":
        return state.currentTurn === state.playerColor ? "destructive" : "default"
      case "thinking":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusIcon = () => {
    switch (state.gameStatus) {
      case "checkmate":
        return state.currentTurn === state.playerColor ? "💔" : "🎉"
      case "stalemate":
        return "🤝"
      case "draw":
        return "🤝"
      case "thinking":
        return "🤔"
      default:
        return state.currentTurn === state.playerColor ? "⚡" : "🤖"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Enhanced header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg">
                <Crown className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <Sparkles className="h-5 w-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
                SmartChess
              </h1>
              <p className="text-sm text-slate-300 font-medium">AI-Powered Chess Experience</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm hover:from-white/30 hover:to-white/20 border border-white/30 shadow-lg"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-blue-400" />
              )}
            </Button>

            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm hover:from-white/30 hover:to-white/20 border border-white/30 shadow-lg"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl border-slate-600"
              >
                <div className="space-y-6 pt-6">
                  <DifficultySelector />
                  <GameControls />
                  <MoveHistory />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Enhanced Game Status Card */}
        <Card className="p-5 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-2 border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl">
                <span className="text-3xl">{getStatusIcon()}</span>
              </div>
              <div>
                <Badge variant={getStatusColor()} className="text-base font-semibold px-4 py-2 shadow-lg">
                  {getStatusMessage()}
                </Badge>
                {state.game.inCheck() && state.gameStatus === "playing" && (
                  <div className="text-sm text-red-400 mt-2 animate-pulse font-medium">⚠️ King in Check!</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-200 font-medium">
                Difficulty:{" "}
                <span className="font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1)}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Playing as:{" "}
                <span
                  className={cn(
                    "font-semibold px-2 py-1 rounded-full text-xs",
                    state.playerColor === "white"
                      ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900"
                      : "bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100",
                  )}
                >
                  {state.playerColor}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Chessboard with luxury frame */}
        <div className="relative">
          <Chessboard />

          {/* Multiple decorative glowing rings */}
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 rounded-3xl blur-2xl -z-10 animate-pulse"></div>
          <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-3xl -z-20 animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <GameControls compact />
        </div>

        {/* Enhanced Move History */}
        <Card className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm border-slate-600 shadow-xl">
          <MoveHistory compact />
        </Card>

        {/* Game Statistics */}
        <Card className="p-4 bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm border-slate-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{state.moveHistory.length}</div>
              <div className="text-xs text-slate-400">Moves</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {Math.floor(state.moveHistory.length / 2) + (state.moveHistory.length % 2)}
              </div>
              <div className="text-xs text-slate-400">Turns</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {state.game.inCheck() ? "⚠️" : state.gameStatus === "playing" ? "✅" : "🏁"}
              </div>
              <div className="text-xs text-slate-400">Status</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
