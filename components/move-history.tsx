"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, History, Clock } from "lucide-react"
import { useGame } from "@/context/game-context"
import { cn } from "@/lib/utils"

interface MoveHistoryProps {
  compact?: boolean
}

export default function MoveHistory({ compact = false }: MoveHistoryProps) {
  const { state } = useGame()
  const [isExpanded, setIsExpanded] = useState(!compact)

  const formatMoveHistory = () => {
    const moves = state.moveHistory
    const formattedMoves = []

    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1
      const whiteMove = moves[i]
      const blackMove = moves[i + 1]

      formattedMoves.push({
        number: moveNumber,
        white: whiteMove,
        black: blackMove || "",
      })
    }

    return formattedMoves
  }

  const formattedMoves = formatMoveHistory()

  if (compact) {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border-2 border-white/20 text-white shadow-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/30 to-yellow-500/30 rounded-lg">
              <History className="h-4 w-4 text-amber-300" />
            </div>
            <span className="font-medium">Move History</span>
            <div className="bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
              {state.moveHistory.length}
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/70 rounded-xl p-4 border-2 border-slate-600/50 shadow-xl backdrop-blur-sm">
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {formattedMoves.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">No moves yet</p>
                    <p className="text-xs text-slate-400">Make your first move!</p>
                  </div>
                ) : (
                  formattedMoves.map((move, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-white/5",
                        index === formattedMoves.length - 1 &&
                          "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/30 shadow-lg",
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-500/30 to-yellow-500/30 rounded-full border border-amber-400/30">
                        <span className="text-amber-300 font-bold text-sm">{move.number}</span>
                      </div>
                      <div className="flex gap-3 flex-1">
                        <span className="font-mono text-sm bg-gradient-to-br from-white/20 to-white/10 text-white px-3 py-2 rounded-lg border border-white/30 min-w-[3rem] text-center font-bold shadow-sm">
                          {move.white}
                        </span>
                        {move.black && (
                          <span className="font-mono text-sm bg-gradient-to-br from-slate-700/70 to-slate-800/70 text-slate-200 px-3 py-2 rounded-lg border border-slate-600/50 min-w-[3rem] text-center font-bold shadow-sm">
                            {move.black}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <History className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibol text-white">Move History</h3>
          <p className="text-xs text-slate-400">{state.moveHistory.length} moves played</p>
        </div>
      </div>

      <ScrollArea className="h-48">
        <div className="space-y-2">
          {formattedMoves.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">No moves yet</p>
              <p className="text-xs text-slate-500">The game is about to begin!</p>
            </div>
          ) : (
            formattedMoves.map((move, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-white/5",
                  index === formattedMoves.length - 1 && "bg-amber-500/10 border border-amber-500/20 shadow-lg",
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-amber-500/20 rounded-full">
                  <span className="text-amber-400 font-bold text-sm">{move.number}</span>
                </div>
                <div className="flex gap-3 flex-1">
                  <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 min-w-[3.5rem] text-center">
                    <span className="font-mono text-sm text-white font-medium">{move.white}</span>
                  </div>
                  {move.black && (
                    <div className="bg-slate-700/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-600 min-w-[3.5rem] text-center">
                      <span className="font-mono text-sm text-slate-300 font-medium">{move.black}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
