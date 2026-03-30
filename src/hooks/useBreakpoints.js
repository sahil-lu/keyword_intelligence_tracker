import useMediaQuery from "./useMediaQuery"

const useBreakpoints = () => {
	const isXS = useMediaQuery("(max-width: 639px)")
	const isSM = useMediaQuery("(min-width: 640px)")
	const isMD = useMediaQuery("(min-width: 768px)")
	const isLG = useMediaQuery("(min-width: 1024px)")
	const isXL = useMediaQuery("(min-width: 1280px)")

	let active = null
	if (isXS) active = "xs"
	if (isSM) active = "sm"
	if (isMD) active = "md"
	if (isLG) active = "lg"
	if (isXL) active = "xl"

	return {
		isXS,
		isSM,
		isMD,
		isLG,
		isXL,
		active,
	}
}

export default useBreakpoints
