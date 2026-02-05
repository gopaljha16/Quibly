import { useState, useEffect } from 'react'

export function useIdle(timeout: number = 60000) {
    const [isIdle, setIsIdle] = useState(false)

    useEffect(() => {
        let timer: NodeJS.Timeout

        const handleActivity = () => {
            setIsIdle(false)
            clearTimeout(timer)
            timer = setTimeout(() => setIsIdle(true), timeout)
        }

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

        events.forEach((event) => {
            window.addEventListener(event, handleActivity)
        })

        // Initialize timer
        handleActivity()

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity)
            })
            clearTimeout(timer)
        }
    }, [timeout])

    return isIdle
}
