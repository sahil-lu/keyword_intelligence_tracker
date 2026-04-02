import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import { reducer } from "./reducer"

export const initialState = {
	user: null,
	authId: null,
	openAuth: false,
	closableAuth: true,
	isAuthenticated: false,
	queryParams: {},
}

const useStore = create(
	devtools(redux(reducer, initialState), {
		name: "useStore",
		enabled:
			(typeof window !== "undefined" &&
				Boolean(window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"])) ||
			process.env.VERCEL_ENV !== "production",
	})
)

export default useStore
