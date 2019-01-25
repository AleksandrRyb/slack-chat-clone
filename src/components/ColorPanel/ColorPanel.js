import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Segment, Sidebar, Menu, Divider, Button, Modal, Icon, Label } from 'semantic-ui-react';
import  { TwitterPicker }  from "react-color";
import firebase from '../../firebase';
import { setColors } from '../actions';

class ColorPanel extends Component {

    state = {
        modal: false,
        primary: '',
        secondary: '',
        usersRef: firebase.database().ref("users"),
        user: this.props.currentUser,
        userColors: []
    };

    componentWillUnmount(){
        this.removeListeners();
    }

    removeListeners = () => {
        this.state.usersRef.child(`${this.state.user.uid}/colors`).off();
    }

    componentDidMount(){
        const { user } = this.state;
        if(user){
            this.addListener(user.uid);
        };
    };

    addListener = userId => {
        let userColors = [];
        this.state.usersRef.child(`${userId}/colors`)
            .on("child_added", snap => {
                userColors.unshift(snap.val());
                this.setState({ userColors });
            });
    };

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    handleChangePrimary = color => this.setState({ primary: color.hex });

    handleChangeSecondary = color => this.setState({ secondary: color.hex });

    handleColors = () => {
        const { primary, secondary } = this.state;
        if(primary && secondary){
            this.saveColors(primary, secondary)
        }
    };

    saveColors = (primary, secondary) => {
        this.state.usersRef
            .child(`${this.state.user.uid}/colors`)
            .push()
            .update({
                primary,
                secondary
            })
            .then(() => {
                console.log("Colors Added");
                this.closeModal();
            })
            .catch(err => console.error(err));
    };

    displayUserColors = colors => 
        colors.length > 0 &&
        colors.map((color, i) => (
            <React.Fragment key={i}>
                <Divider />
                <div
                    className="color__container"
                    onClick={() => this.props.setColors(color.primary, color.secondary)}
                >
                    <div className="color__squire" style={{background: color.primary}}>
                        <div className="color__overlay" style={{background: color.secondary}}></div>
                    </div>
                </div>
            </React.Fragment>
        )
    );



    render(){
        const { modal, secondary, primary, userColors } = this.state;
        return(
            <Sidebar
                as={Menu}
                icon="labeled"
                inverted
                vertical
                visible
                width='very thin'
            >
                <Divider />
                <Button icon='add' size='small' color='blue' onClick={this.openModal} />
                {this.displayUserColors(userColors)}
                {/* Color Picker Modal */}

                <Modal basic open={modal} onClose={this.closeModal}>
                    <Modal.Header>Choose App Colors</Modal.Header>
                    <Modal.Content>
                        <Segment inverted>
                            <Label content="Primary Color" style={{marginBottom: "12px"}} />
                            <TwitterPicker
                                color={primary}
                                onChange={this.handleChangePrimary}
                            />
                        </Segment>

                        <Segment inverted>
                            <Label content="Secondary Color" style={{marginBottom: "12px"}} />
                            <TwitterPicker  
                                color={secondary}
                                onChange={this.handleChangeSecondary}
                            />
                        </Segment>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color="green" onClick={this.handleColors} inverted>
                            <Icon name="checkmark" /> Save Color
                        </Button>
                        <Button color="red" inverted onClick={this.closeModal}>
                            <Icon name="remove" /> Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </Sidebar>
        );
    }
}

export default connect( null, { setColors })(ColorPanel);

