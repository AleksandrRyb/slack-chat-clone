import { combineReducers } from 'redux';
import authReducer from './authReducer';
import channelReducer from './channelReducer';
import colorReducer from './colorReducer';


export default combineReducers({
    user: authReducer,
    channel: channelReducer,
    color: colorReducer
})