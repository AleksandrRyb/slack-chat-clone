import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Segment, Comment } from 'semantic-ui-react';
import firebase from '../../firebase';
import { setUserPosts } from '../actions';


import MessagesHeader from './MessageHeader';
import MessageForm from './MessageForm';
import Message from './Message'; 
import Typing from './Typing' 
import Skeleton from './Skeleton';


class Messages extends Component {
    state = {
        privateChannel: this.props.isPrivateChannel,
        privateMessagesRef: firebase.database().ref('privateMessages'),
        messagesRef: firebase.database().ref('messages'),
        channel: this.props.currentChannel,
        currentUser: this.props.currentUser,
        usersRef: firebase.database().ref('users'),
        isChannelStared: false,
        messages: [],
        messagesLoading: true,
        progressBar: false,
        numUniqueUsers: '',
        searchTerm: '',
        searchLoading: false,
        searchResult: [],
        typingRef: firebase.database().ref("typing"),
        typingUsers: [],
        connectedRef: firebase.database().ref(".info/connected"),
        listeners: []
    }

    componentDidMount(){
        const { currentUser, channel, listeners } = this.state;
        if(currentUser && channel){
            this.removeListeners(listeners)
            this.addListeners(channel.id);
            this.addUserStarredListener(channel.id, currentUser.uid);
        }   
    };

    componentWillUnmount(){
        this.removeListeners(this.state.listeners);
        this.state.connectedRef.off();
    };

    removeListeners = (listeners) => {
        listeners.forEach(listener => {
            listener.ref.child(listener.id).off(listener.event);
        });
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.messagesEnd) {
            this.scrollToBottom();
        }
    };

    addToListeners = (id, ref, event) => {
        const index = this.state.listeners.findIndex(listener => {
            return (
                listener.id === id && listener.ref === ref && listener.event === event
            )
        })

        if(index === -1){
            const newListener = {id ,ref, event}
            this.setState({ listeners: this.state.listeners.concat(newListener) })
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth'});
    }

    addListeners = (channelId) => {
        this.messageListener(channelId);
        this.addTypingListeners(channelId);
    }

    addTypingListeners = channelId => {
        let typingUsers = [];
        this.state.typingRef.child(channelId).on("child_added", snap => {
            if (snap.key !== this.state.currentUser.uid) {
                typingUsers = typingUsers.concat({
                    id: snap.key,
                    name: snap.val()
                });
                this.setState({ typingUsers });
            }
        })
        this.addToListeners(channelId, this.state.typingRef, "child_added");


        this.state.typingRef.child(channelId).on("child_removed", snap => {
            const index = typingUsers.findIndex(user => user.id === snap.key);
            if(index !== -1) {
                typingUsers = typingUsers.filter(user => user.id !== snap.key);
                this.setState({ typingUsers })
            }
        });
        this.addToListeners(channelId, this.state.typingRef, "child_removed");

        this.state.connectedRef.on("value", snap => {
            if (snap.val() === true) {
                this.state.typingRef
                    .child(channelId)
                    .child(this.state.currentUser.uid)
                    .onDisconnect()
                    .remove(err => {
                        if (err !== null) {
                            console.error(err);
                        }
                    })
            }
        })
    }

    messageListener = (channelId) => {
        let loadedMessages = [];
        const ref = this.getMessagesRef();
        ref.child(channelId).on('child_added', snap => {
            loadedMessages.push(snap.val());
            this.setState({ messages: loadedMessages, messagesLoading: false });
            this.countUniqueUsers(loadedMessages);
            this.countUserPosts(loadedMessages);
        })
    };

    addUserStarredListener = (channelId, userId) => {
        this.state.usersRef
        .child(userId)
        .child("starred")
        .once("value")
        .then(data => {
            if(data.val() !== null){
                const channelIds = Object.keys(data.val());
                const prevStarred = channelIds.includes(channelId);
                this.setState({ isChannelStarred: prevStarred})
            }
        });
    };

    handleStar = () => {
        this.setState(prevState => ({
            isChannelStared: !prevState.isChannelStared
            }),
            () => this.starChannel()
         );
    };

    starChannel = () => {
        if(this.state.isChannelStared) {
           this.state.usersRef
            .child(`${this.state.currentUser.uid}/starred`)
            .update({
                [this.state.channel.id]: {
                    name: this.state.channel.name,
                    details: this.state.channel.details,
                    created_by: {
                        name: this.state.channel.created_by.name,
                        avatar: this.state.channel.created_by.avatar
                    }
                }
            });
        } else {
            this.state.usersRef
            .child(`${this.state.currentUser.uid}/starred`)
            .child(this.state.channel.id)
            .remove(err => {
                if(err !== null) {
                    console.error(err);
                }
            });
        }
    };


    getMessagesRef = () => {
        const { messagesRef, privateChannel, privateMessagesRef } = this.state;
        return privateChannel ? privateMessagesRef : messagesRef;
    };

    handleSearchChange = event => {
        this.setState({
            searchTerm: event.target.value,
            searchLoading: true
        }, () => this.handleSearchMessages());
    };

    handleSearchMessages = () => {
        const channelMessages = [...this.state.messages];
        const regex = new RegExp(this.state.searchTerm, 'gi');
        const searchResult = channelMessages.reduce((acc, message) => {
            if((message.content && message.content.match(regex)) || message.user.name.match(regex)){
                acc.push(message)
            }
            return acc;
        }, [])
        this.setState({searchResult});
        setTimeout(() => this.setState({ searchLoading: false }), 1000)
    }

    displayMessages = (messages) => (
        messages.length > 0 && messages.map(message => (
            <Message
                message={message}
                user={this.state.currentUser}
                key={message.timestamp}
            />
        ))
    )

    isProgressBarVis = progress => {
        if(progress > 0){
            this.setState({ progressBar: true })
        } else { 
            this.setState({ progressBar: false })
        }
    }

    countUniqueUsers = (messages) => {
        const uniqueUsers = messages.reduce((acc, message) => {
            if(!acc.includes(message.user.name)){
                acc.push(message.user.name)
            }
            return acc;
        }, []);
        const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
        const numOfUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
        this.setState({ numUniqueUsers: numOfUsers });
    }

    countUserPosts = messages => {
        let userPosts = messages.reduce((acc, message) => {
            if(message.user.name in acc) {
                acc[message.user.name].count += 1;
            } else {
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1
                };
            }
            return acc;
        }, {});

        this.props.setUserPosts(userPosts);
    }

    displayChannelName = channel => {
        return channel 
            ?  `${this.state.privateChannel ? "@" : "#"}${channel.name}`
            : ""; 
    }

    displayTypingUsers = users => 
        users.length > 0 &&
        users.map(user => (
            <div style={{ display: 'flex', alignItems: 'center' , marginBottom: "0.2em" }}>
                <span className='user__typing'>{user.name} is typing</span> <Typing />
            </div>
        ))

    displaayMessagesSkeleton = loading => (
        loading ? (
            <React.Fragment>
                {[...Array(15)].map((_, i) => (
                    <Skeleton key={i} />
                ))}
            </React.Fragment>
        ) : null
    )
    

    render(){
        const { messagesRef, channel, currentUser, messages, messagesLoading, numUniqueUsers, searchTerm, searchResult, searchLoading, privateChannel, isChannelStared, typingUsers  } = this.state;
        return(
            <React.Fragment>
                <MessagesHeader 
                    channelName={this.displayChannelName(channel)}
                    numUniqueUsers={numUniqueUsers}
                    handleSearchChange={this.handleSearchChange}
                    searchLoading={searchLoading}
                    isPrivateChannel={privateChannel}
                    isChannelStared={isChannelStared}
                    handleStar={this.handleStar}
                />

                <Segment>
                    <Comment.Group className='messages' style={{ maxWidth: '100%'}}>
                        {this.displaayMessagesSkeleton(messagesLoading)}
                        {searchTerm ? this.displayMessages(searchResult) : this.displayMessages(messages)}
                        {this.displayTypingUsers(typingUsers)}
                        <div ref={node => (this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>

                <MessageForm 
                    messagesRef={messagesRef}
                    currentChannel={channel} 
                    currentUser={currentUser}
                    isProgressBarVis={this.isProgressBarVis}
                    isPrivateChannel={privateChannel}
                    getMessagesRef={this.getMessagesRef}
                />
            </React.Fragment>
        )
    }
}

export default connect(null, { setUserPosts })(Messages);

