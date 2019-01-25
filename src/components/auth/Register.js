import React, { Component } from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import md5 from 'md5';

class Register extends Component {
    state = { 
        username: '',
        email: '',
        password: '',
        password2: '',
        errors: [],
        loading: false,
        usersRef: firebase.database().ref('users')
    }

    isFormValid = () => {
        let errors = [];
        let error;

        if(this.isFormEmpty(this.state)){
            //throw error
            error = { message: 'Fill in all fields'}
            this.setState({ errors: errors.concat(error)})
            return false;
        } else if(!this.isPasswordValid(this.state)){
            //throw error 
            error = { message: 'Password is not valid'}
            this.setState({ errors: errors.concat(error)})
            return false;
        } else {
            return true;
        }
    }

    isPasswordValid  = ({ password, password2 }) => {
        if(password.length < 6 || password2.length < 6){
            return false;
        } else if(password !== password2){
            return false;
        } else {
            return true;
        }
    }

    isFormEmpty = ({ username, email, password, password2}) => {
        return !username.length || !email.length || !password.length || !password2.length;
    }

    renderErrors = (errors) => errors.map((error, i) => <p key={i}>{error.message}</p>) 

    handleChange = (event) => {
        this.setState({[event.target.name]: event.target.value })
    }

    onSubmit = event => {
        event.preventDefault();
        if(this.isFormValid()){
            this.setState({ errors:[], loading: true})
            firebase
                .auth()
                .createUserWithEmailAndPassword(this.state.email, this.state.password)
                .then(createdUser => {
                    createdUser.user.updateProfile({
                        displayName: this.state.username,
                        photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
                    })
                    .then(() => {
                        this.saveUser(createdUser).then(() => {
                            console.log('user saved')
                            this.setState({ loading: false })
                        })
                    })
                    .catch(err => this.setState({ errors: this.state.errors.concat(err), loading: false }))
                })
                .catch(err => this.setState({ errors: this.state.errors.concat(err), loading: false }))
        }
    }

    saveUser = createdUser => {
        return this.state.usersRef.child(createdUser.user.uid).set({
            name: createdUser.user.displayName,
            avatar: createdUser.user.photoURL
        })
    }

    handleErrorInput = (errors, inputName) => {
       return errors.some(error => error.message.toLowerCase().includes(inputName))? 'error' : ''
    }

    render() {
        const { username, email, password, password2, errors, loading } = this.state;
        return (
        <Grid textAlign='center' verticalAlign='middle' className='app'>
            <Grid.Column style={{ maxWidth: 450}}>
                <Header as='h2' icon color='orange' textAlign='center'>
                    Register for chat!
                </Header>
                {errors.length > 0 && (
                    <Message error>
                        {this.renderErrors(errors)}
                    </Message>
                )}
                <Form onSubmit={this.onSubmit} size='large'>
                    <Segment stacked>
                        <Form.Input fluid className={this.handleErrorInput(errors, 'username')} name='username' icon='user' iconPosition='left' placeholder='Username' onChange={this.handleChange} type='text' value={username} />
                        <Form.Input fluid className={this.handleErrorInput(errors, 'email')} name='email' icon='mail' iconPosition='left' placeholder='Email' onChange={this.handleChange} type='email' value={email} />
                        <Form.Input fluid className={this.handleErrorInput(errors, 'password')} name='password' icon='lock' iconPosition='left' placeholder='Password' onChange={this.handleChange} type='password' value={password} />
                        <Form.Input fluid className={this.handleErrorInput(errors, 'password2')} name='password2' icon='repeat' iconPosition='left' placeholder='Password Confirm' onChange={this.handleChange} type='password' value={password2} />
                        <Button disabled={loading} className={loading ? 'loading' : ''} color='orange' size='large'>Submit</Button>
                    </Segment>
                </Form>
                <Message>Already a user? <Link to='/login'>Login</Link></Message>
            </Grid.Column>
        </Grid>
        )
    }
}

export default Register;
