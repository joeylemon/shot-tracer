import { ACTIONS } from './actions'

const initialState = {
  loading: false
}

function rootReducer (state = initialState, action) {
  const { payload, type } = action
  switch (type) {
    case ACTIONS.SET_LOADING: {
      return { ...state, loading: payload }
    }
    default: {
      return { ...state }
    }
  }
};

export default rootReducer
