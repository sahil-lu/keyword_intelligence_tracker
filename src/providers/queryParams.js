"use client"

import useStore from "@/store"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

const QueryParamsProvider = () => {
	const searchParams = useSearchParams()

	const dispatch = useStore(store => store.dispatch)

	useEffect(() => {
		dispatch({
			type: "SET_STATE",
			payload: { queryParams: Object.fromEntries(searchParams) },
		})

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams])

	return null
}

export default QueryParamsProvider
