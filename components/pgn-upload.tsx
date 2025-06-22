"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, User, TrendingUp, Target, Brain, X, AlertCircle } from "lucide-react"
import { parsePGN, analyzePlayerStyle, type PlayerStyle } from "@/lib/pgn-parser"
import { cn } from "@/lib/utils"

interface PGNUploadProps {
  onStyleSelected: (style: PlayerStyle) => void
  onClose: () => void
}

export default function PGNUpload({ onStyleSelected, onClose }: PGNUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [playerStyles, setPlayerStyles] = useState<PlayerStyle[]>([])
  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleChooseFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleFile = async (file: File) => {
    // Validate file
    if (!file.name.toLowerCase().endsWith(".pgn")) {
      setError("Please upload a .pgn file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("File too large. Please upload a file smaller than 10MB")
      return
    }

    setProcessing(true)
    setError("")
    setProgress("Reading file...")

    try {
      // Read file efficiently
      const text = await file.text()

      if (!text.trim()) {
        setError("File appears to be empty")
        return
      }

      setProgress("Parsing games...")

      // Parse with timeout to prevent hanging
      const parsePromise = new Promise<any[]>((resolve, reject) => {
        try {
          const games = parsePGN(text)
          resolve(games)
        } catch (err) {
          reject(err)
        }
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Parsing timeout")), 10000)
      })

      const games = (await Promise.race([parsePromise, timeoutPromise])) as any[]

      if (games.length === 0) {
        setError("No valid games found in the PGN file")
        return
      }

      setProgress(`Analyzing ${games.length} games...`)

      // Extract unique players efficiently
      const playerCounts = new Map<string, number>()

      for (const game of games) {
        if (game.white !== "Unknown") {
          playerCounts.set(game.white, (playerCounts.get(game.white) || 0) + 1)
        }
        if (game.black !== "Unknown") {
          playerCounts.set(game.black, (playerCounts.get(game.black) || 0) + 1)
        }
      }

      // Only analyze players with enough games
      const playersToAnalyze = Array.from(playerCounts.entries())
        .filter(([_, count]) => count >= 3)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10) // Limit to top 10 players for performance

      if (playersToAnalyze.length === 0) {
        setError("No players found with enough games for analysis (minimum 3 games)")
        return
      }

      const styles: PlayerStyle[] = []

      // Analyze players with progress updates
      for (let i = 0; i < playersToAnalyze.length; i++) {
        const [playerName] = playersToAnalyze[i]
        setProgress(`Analyzing ${playerName}... (${i + 1}/${playersToAnalyze.length})`)

        try {
          const style = analyzePlayerStyle(games, playerName)
          styles.push(style)
        } catch (error) {
          console.warn(`Failed to analyze ${playerName}:`, error)
        }

        // Small delay to prevent UI blocking
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (styles.length === 0) {
        setError("Failed to analyze any player styles")
        return
      }

      setPlayerStyles(styles)
      setProgress("")
    } catch (error) {
      console.error("Processing error:", error)
      setError(error instanceof Error ? error.message : "Failed to process PGN file")
    } finally {
      setProcessing(false)
    }
  }

  const handlePlayerSelect = (style: PlayerStyle) => {
    onStyleSelected(style)
  }

  const getStyleDescription = (style: PlayerStyle) => {
    const descriptions = []

    if (style.aggressiveness > 70) descriptions.push("Aggressive")
    else if (style.aggressiveness < 30) descriptions.push("Defensive")
    else descriptions.push("Balanced")

    if (style.positionalVsTactical > 60) descriptions.push("Positional")
    else if (style.positionalVsTactical < 40) descriptions.push("Tactical")

    if (style.averageGameLength > 60) descriptions.push("Long games")
    else if (style.averageGameLength < 30) descriptions.push("Quick games")

    return descriptions.join(" • ")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-600">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Upload Player Style</h2>
                <p className="text-sm text-slate-400">Upload a PGN file to analyze playing styles</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Upload Area */}
          {playerStyles.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-purple-400 bg-purple-500/10" : "border-slate-600 hover:border-slate-500",
                processing && "opacity-50 pointer-events-none",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  {processing ? (
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-purple-400" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {processing ? "Processing..." : "Upload PGN File"}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {progress || "Drag and drop your PGN file here, or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500">Supports files up to 10MB • Minimum 3 games per player</p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pgn"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={processing}
                />

                {/* Clickable button */}
                <Button
                  variant="outline"
                  className="bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
                  disabled={processing}
                  onClick={handleChooseFile}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-medium">Upload Error</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Player Styles */}
          {playerStyles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Found {playerStyles.length} Player{playerStyles.length > 1 ? "s" : ""}
                </h3>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {playerStyles.map((style, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-200 border-slate-600 hover:border-purple-500/50",
                      "bg-slate-700/50 hover:bg-slate-700 hover:scale-[1.02]",
                    )}
                    onClick={() => handlePlayerSelect(style)}
                  >
                    <div className="space-y-3">
                      {/* Player Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{style.name}</h4>
                          <p className="text-sm text-slate-400">{style.totalGames} games analyzed</p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                          {style.averageGameLength} moves avg
                        </Badge>
                      </div>

                      {/* Style Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-red-400" />
                          <span className="text-slate-300">Aggressive: {style.aggressiveness}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          <span className="text-slate-300">
                            {style.positionalVsTactical > 50 ? "Positional" : "Tactical"}: {style.positionalVsTactical}%
                          </span>
                        </div>
                      </div>

                      {/* Style Description */}
                      <p className="text-sm text-slate-400">{getStyleDescription(style)}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setPlayerStyles([])
                  setError("")
                  setProgress("")
                }}
                className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                Upload Different File
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
