"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Undo2, Shuffle, Play } from "lucide-react"
import { useGame } from "@/context/game-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GameControlsProps {
  compact?: boolean
}

export default function GameControls({ compact = false }: GameControlsProps) {
  const { state, dispatch } = useGame()

  const handleRestart = () => {
    dispatch({ type: "RESET_GAME" })
  }

  const handleUndo = () => {
    if (state.moveHistory.length > 0) {
      dispatch({ type: "UNDO_MOVE" })
    }
  }

  const handleSwitchColors = () => {
    dispatch({
      type: "SET_PLAYER_COLOR",
      payload: state.playerColor === "white" ? "black" : "white",
    })
    dispatch({ type: "RESET_GAME" })
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={state.moveHistory.length === 0 || state.gameStatus === "thinking"}
          className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Restart Game?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will start a new game and you'll lose the current progress. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestart}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                Restart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
          <Play className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Game Controls</h3>
          <p className="text-xs text-slate-400">Manage your game</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start bg-white/5 hover:bg-white/10 border-white/10 text-white disabled:opacity-50"
          onClick={handleUndo}
          disabled={state.moveHistory.length === 0 || state.gameStatus === "thinking"}
        >
          <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
            <Undo2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-medium">Undo Last Move</div>
            <div className="text-xs text-slate-400">Take back your last move</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start bg-white/5 hover:bg-white/10 border-white/10 text-white"
          onClick={handleSwitchColors}
        >
          <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
            <Shuffle className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="font-medium">Switch Colors</div>
            <div className="text-xs text-slate-400">Play as {state.playerColor === "white" ? "black" : "white"}</div>
          </div>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start bg-white/5 hover:bg-white/10 border-white/10 text-white"
            >
              <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                <RotateCcw className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">Restart Game</div>
                <div className="text-xs text-slate-400">Start a fresh game</div>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-red-400" />
                Restart Game?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will start a completely new game and you'll lose all current progress. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                Keep Playing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestart}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
              >
                Start New Game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
