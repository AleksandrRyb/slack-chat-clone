import React, { Component } from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message} from 'semantic-ui-react';
import { Link } from 'react-router-dom';


class Login extends Component {
    state = {
        email: '',
        password: '',
        errors: [],
        loading: false,
    }


    renderErrors = (errors) => errors.map((error, i) => <p key={i}>{error.message}</p>) 

    handleChange = (event) => {
        this.setState({[event.target.name]: event.target.value })
    }

    onSubmit = event => {
        event.preventDefault();
        if(this.isFormValid(this.state)){
            this.setState({ loading: true })
            firebase
              .auth()
              .signInWithEmailAndPassword(this.state.email, this.state.password)
              .then(isSignedInUser => {
                console.log(isSignedInUser)
                this.setState({ loading: false })
              })
              .catch(err => {
                this.setState({ errors: this.state.errors.concat(err), loading: false  })
                console.log(this.state.errors)
              })
        }
    }

    isFormValid = ({ email, password }) => email && password;


    handleErrorInput = (errors, inputName) => {
       return errors.some(error => error.message.toLowerCase().includes(inputName))? 'error' : ''
    }

    render() {
        const { email, password, errors, loading } = this.state;
        return (
        <Grid textAlign='center' verticalAlign='middle' className='app'>
            <Grid.Column style={{ maxWidth: 450}}>
                <Header as='h2' icon color='blue' textAlign='center'>
                    Login for chat!
                </Header>
                {errors.length > 0 && (
                    <Message error>
                        {this.renderErrors(errors)}
                    </Message>
                )}
                <Form onSubmit={this.onSubmit} size='large'>
                    <Segment stacked>
                        <Form.Input fluid className={this.handleErrorInput(errors, 'email')} name='email' icon='mail' iconPosition='left' placeholder='Email' onChange={this.handleChange} type='email' value={email} />
                        <Form.Input fluid className={this.handleErrorInput(errors, 'password')} name='password' icon='lock' iconPosition='left' placeholder='Password' onChange={this.handleChange} type='password' value={password} />
                        <Button disabled={loading} className={loading ? 'loading' : ''} color='blue' size='large'>Submit</Button>
                    </Segment>
                </Form>
                <Message>Have no account? <Link to='/register'>Register</Link></Message>
            </Grid.Column>
        </Grid>
        )
    }
}

export default Login;
