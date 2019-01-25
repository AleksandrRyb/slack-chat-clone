import { SET_USER_COLORS } from '../actions/types';

const initialState = {
    primaryColor: "#4c3c4c",
    secondaryColor: "#eee"
}

export default function(state = initialState, action){
    switch(action.type){
        case SET_USER_COLORS:
            return {
                primaryColor: action.payload.primaryColor,
                secondaryColor: action.payload.secondaryColor
            }
        default:
            return state;
    }
}