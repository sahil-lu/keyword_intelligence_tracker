import { produce } from "immer"

export const reducer = (state, { type, payload }) => {
	switch (type) {
		case "SET_STATE":
			return produce(state, draft => {
				Object.assign(draft, payload)
			})
		case "SET_USER":
			return produce(state, draft => {
				draft.user = Object.assign(draft.user || {}, payload)
			})
		default:
			return state
	}
}
