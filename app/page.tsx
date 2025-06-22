"use client"

import { GameProvider } from "@/context/game-context"
import { ThemeProvider } from "@/components/theme-provider"
import MobileChessApp from "@/components/mobile-chess-app"

export default function Home() {
  return (
    <ThemeProvider>
      <GameProvider>
        <MobileChessApp />
      </GameProvider>
    </ThemeProvider>
  )
}
