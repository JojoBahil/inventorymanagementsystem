'use client'

import { useEffect } from 'react'

export default function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 100)
    return () => clearTimeout(id)
  }, [])
  return null
}


