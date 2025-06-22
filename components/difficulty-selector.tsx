"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Target, Sparkles } from "lucide-react"
import { useGame, type Difficulty } from "@/context/game-context"
import { cn } from "@/lib/utils"

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    description: "Random moves, perfect for learning",
    icon: Zap,
    gradient: "from-emerald-500 to-green-600",
    bgGradient: "from-emerald-500/30 to-green-500/30",
    borderColor: "border-emerald-500/50",
    shadowColor: "shadow-emerald-500/25",
  },
  medium: {
    label: "Medium",
    description: "Smart tactics, balanced challenge",
    icon: Brain,
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-500/30 to-orange-500/30",
    borderColor: "border-amber-500/50",
    shadowColor: "shadow-amber-500/25",
  },
  hard: {
    label: "Hard",
    description: "Advanced strategy, expert level",
    icon: Target,
    gradient: "from-red-500 to-rose-600",
    bgGradient: "from-red-500/30 to-rose-500/30",
    borderColor: "border-red-500/50",
    shadowColor: "shadow-red-500/25",
  },
}

export default function DifficultySelector() {
  const { state, dispatch } = useGame()

  const handleDifficultyChange = (difficulty: Difficulty) => {
    dispatch({ type: "SET_DIFFICULTY", payload: difficulty })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl border border-purple-400/30">
          <Brain className="h-6 w-6 text-purple-300" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">AI Difficulty</h3>
          <p className="text-sm text-slate-300">Choose your challenge level</p>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
          const difficulty = key as Difficulty
          const Icon = config.icon
          const isSelected = state.difficulty === difficulty

          return (
            <Button
              key={difficulty}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-5 transition-all duration-300 hover:scale-105",
                "bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border-2 border-white/20",
                isSelected &&
                  `bg-gradient-to-r ${config.bgGradient} border-2 ${config.borderColor} shadow-xl ${config.shadowColor}`,
              )}
              onClick={() => handleDifficultyChange(difficulty)}
            >
              <div className="flex items-center gap-4 w-full">
                <div className={cn("p-4 rounded-xl bg-gradient-to-br shadow-lg", config.gradient)}>
                  <Icon className="h-6 w-6 text-white drop-shadow-sm" />
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-white text-lg">{config.label}</span>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-200 border-2 border-amber-400/30 font-bold"
                        >
                          Active
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{config.description}</p>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full animate-pulse shadow-lg border-2 border-amber-300"></div>
                )}
              </div>
            </Button>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-2 border-blue-500/30 p-5 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg">
            <Sparkles className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-blue-200 font-bold mb-2">Pro Tip</p>
            <p className="text-sm text-slate-300">
              Difficulty affects AI thinking time and strategy depth. You can change it anytime during the game!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
