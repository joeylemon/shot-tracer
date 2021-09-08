export const ACTIONS = {
  SET_LOADING: 'SET_LOADING'
}

export function setLoading (payload) {
  return { type: ACTIONS.SET_LOADING, payload }
}
