import React from 'react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../actions';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';
import firebase from '../../firebase';


class Channels extends React.Component {

    state = {
        user: this.props.currentUser,
        activeChannel: '',
        channel: null,
        notifications: [],
        channels: [],
        modal: false ,
        channelName: '',
        channelDetails: '',
        channelsRef: firebase.database().ref('channels'),
        messagesRef: firebase.database().ref('messages'),
        typingRef: firebase.database().ref('typing'),
        firstLoad: true
    }

    componentDidMount(){
        this.addListeners();
    }

    componentWillUnmount(){
        /* remove listeners */
        this.removeListeners();
    }

    removeListeners = () => {
        this.state.channelsRef.off();
    }

    addListeners = () => {
        let loadedChannels = []

        this.state.channelsRef.on('child_added', snap => {
            loadedChannels.push(snap.val());
            this.setState({ channels: loadedChannels },() => this.setFirstChannel())
            this.addNotificationListener(snap.key);
        });
    };

    addNotificationListener = channelId => {
        this.state.messagesRef.child(channelId).on("value", snap => {
            if (this.state.channel){
                this.handleNotifications(
                    channelId,
                    this.state.channel.id,
                    this.state.notifications,
                    snap
                );
            }
        });
    };

    handleNotifications = (channelId, currentChannelId, notifications, snap) => {
        let lastTotal = 0;

        let index = notifications.findIndex(
            notification => notification.id === channelId
        );

        if(index !== -1) {
            if(channelId !== currentChannelId){
                lastTotal = notifications[index].total;

                if(snap.numChildren() - lastTotal > 0) {
                    notifications[index].count = snap.numChildren() - lastTotal;
                }
            }
            notifications[index].lastKnownTotal = snap.numChildren();
        } else {
            notifications.push({
                id: channelId,
                total: snap.numChildren(),
                lastKnownTotal: snap.numChildren(),
                count: 0
            })
        };
        this.setState({ notifications });
    }

    getNotificationCount = channel => {
        let count = 0;

        this.state.notifications.forEach(notification => {
            if(notification.id === channel.id) {
                count = notification.count;
            }
        });

        if(count > 0) return count;
    };

    setFirstChannel = () => {
        const { channels, firstLoad } = this.state;
        const  firstChannel = channels[0];
        if(firstLoad && channels.length > 0){
            this.props.setCurrentChannel(firstChannel)
            this.setState({ activeChannel: firstChannel.id})
            this.setState({channel: firstChannel})
        }
        this.setState({ firstLoad: false });
    }

    displayChannels = channels => (
        channels.length > 0 && channels.map(channel => (
            <Menu.Item
                key={channel.id}
                onClick={() => this.getChannelInfo(channel)}
                name={channel.name}
                style={{opacity: 0.6}}
                active={channel.id === this.state.activeChannel}
            >
            {this.getNotificationCount(channel) && (
                <Label color="red">{this.getNotificationCount(channel)}</Label>
            )}
                # {channel.name}
            </Menu.Item>
        ))
    )

    getChannelInfo = channel => {
        this.setState({activeChannel: channel.id});
        this.state.typingRef
            .child(this.state.channel.id)
            .child(this.state.user.uid)
            .remove()
        this.clearNotifications();
        this.props.setCurrentChannel(channel)
        this.props.setPrivateChannel(false);
        this.setState({ channel });
    }

    clearNotifications = () => {
        let index = this.state.notifications.findIndex(
          notification => notification.id === this.state.channel.id
        );
    
        if (index !== -1) {
          let updatedNotifications = [...this.state.notifications];
          updatedNotifications[index].total = this.state.notifications[
            index
          ].lastKnownTotal;
          updatedNotifications[index].count = 0;
          this.setState({ notifications: updatedNotifications });
        }
      };

    closeModal = () => {
        this.setState({ modal: false })
    }

    openModal = () => {
        this.setState({ modal: true });
    }

    handleChange = event => {
        this.setState({[event.target.name]: event.target.value});
    }

    isFormValid = ({channelDetails, channelName}) => channelDetails && channelName ;

    addChannel = () => {
        const { channelsRef, channelDetails, channelName, user } = this.state;
        
        const key = channelsRef.push().key;

        const newChannel = {
            id: key,
            name: channelName,
            details: channelDetails,
            created_by: {
                name: user.displayName,
                avatar: user.photoURL
            }
        };

        channelsRef
            .child(key)
            .update(newChannel)
            .then(() => {
                this.setState({ channelDetails: '', channelName: ''})
                this.closeModal()
            })
            .catch(err => console.log(err))

    }

    submitHandler = event => {
        event.preventDefault();
        if(this.isFormValid(this.state)){
            this.addChannel()
        }
    } 



    render(){
        const { channels, modal } = this.state;
        return (
            <React.Fragment>
                <Menu.Menu style={{ paddingBottom: '2em'}}>
                    <Menu.Item>
                        <span>
                            <Icon name='exchange' /> Channels
                        </span>
                        ({channels.length}) <Icon name='add' onClick={this.openModal} />
                    </Menu.Item>
                    {this.displayChannels(channels)}
                </Menu.Menu>

                {/* Add channel modal! */}
                <Modal basic open={modal} onClose={this.closeModal}>
                    <Modal.Header>Add a Channel</Modal.Header>
                    <Modal.Content>
                        <Form onSubmit={this.submitHandler}>
                            <Form.Field>
                                <Input
                                    fluid
                                    label='Name of Channel'
                                    name='channelName'
                                    onChange={this.handleChange}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Input
                                    fluid
                                    label='Details of Channel'
                                    name='channelDetails'
                                    onChange={this.handleChange}
                                />
                            </Form.Field>
                        </Form>
                    </Modal.Content>

                    <Modal.Actions>
                        <Button color='blue' onClick={this.submitHandler}>
                            <Icon name='checkmark' /> Add
                        </Button>
                        <Button color='red' onClick={this.closeModal} >
                            <Icon name='remove' /> Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </React.Fragment>
        )
    }
}


export default connect ( null, { setCurrentChannel, setPrivateChannel })(Channels);