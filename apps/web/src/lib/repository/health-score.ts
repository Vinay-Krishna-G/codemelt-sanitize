export function calculateHealthScore(
  totalFiles: number,
  criticalCount: number,
  warningCount: number,
  infoCount: number
): number {
  if (totalFiles === 0) return 100;
  
  // Weights: Critical = 20, Warning = 5, Informational = 1
  const penalty = (criticalCount * 20 + warningCount * 5 + infoCount * 1) / totalFiles;
  const score = 100 - penalty;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
