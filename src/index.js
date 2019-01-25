import React from 'react';
import ReactDOM from 'react-dom';
import firebase from './firebase';
import { BrowserRouter as Router, Route, Switch, withRouter } from 'react-router-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import reducers from './components/reducers';
import { setUser, clearUser } from './components/actions';
import 'semantic-ui-css/semantic.min.css';

import App from './components/App';
import Register from './components/auth/Register'; 
import Login from './components/auth/Login'; 
import Spinner from './components/Spinner';

const store = createStore(reducers, composeWithDevTools())

class Root extends React.Component {

    componentDidMount(){
        firebase.auth().onAuthStateChanged(user => {
            if(user){
                this.props.setUser(user)
                this.props.history.push('/')
            } else {
                this.props.history.push('/login');
                this.props.clearUser();
            }
        })
    }

    render(){
        return this.props.isLoading ? <Spinner /> : (
            <Switch>
                <Route path='/' component={App} exact/>
                <Route path='/login' component={Login} />
                <Route path='/register' component={Register} />
            </Switch>
        )
    }
}

const mapStateToProps = state => ({
    isLoading: state.user.isLoading
})

const RootWithAuth = withRouter(connect(mapStateToProps, { setUser, clearUser })(Root))

ReactDOM.render(
    <Provider store={store}>
        <Router>
            <RootWithAuth />
        </Router>
    </Provider>
, document.querySelector('#root'))