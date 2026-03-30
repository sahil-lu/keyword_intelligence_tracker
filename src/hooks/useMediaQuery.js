import { useEffect, useState } from "react"

const useMediaQuery = (query) => {
	const [matches, setMatches] = useState(true)

	useEffect(() => {
		const mediaQuery = window.matchMedia(query)

		const updateMatch = () => setMatches(mediaQuery.matches)

		updateMatch() // Check the initial match
		mediaQuery.addEventListener("change", updateMatch)

		// Cleanup listener on component unmount
		return () => mediaQuery.removeEventListener("change", updateMatch)
	}, [query]) // Re-run effect if the query changes

	return matches
}

export default useMediaQuery
