'use client'

import { useEffect } from 'react'

/**
 * Hook to monitor and log performance metrics
 * Useful for development and debugging
 */
export function usePerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

/**
 * Measure and log query performance
 */
export function logQueryPerformance(queryKey: string, startTime: number) {
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Query Performance] ${queryKey} took ${duration.toFixed(2)}ms`)
  }
}

/**
 * Measure and log mutation performance
 */
export function logMutationPerformance(mutationName: string, startTime: number) {
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Mutation Performance] ${mutationName} took ${duration.toFixed(2)}ms`)
  }
}
