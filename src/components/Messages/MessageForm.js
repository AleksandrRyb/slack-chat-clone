import React from 'react';
import { Segment, Button, Input } from 'semantic-ui-react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import { Picker, emojiIndex } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";

import FileModal from './FileModal';
import ProgressBar from './ProgressBar';



class MessageForm extends React.Component {

    state = {
        typingRef: firebase.database().ref('typing'),
        storageRef: firebase.storage().ref(),
        uploadTask: null,
        uploadState: '',
        percentUploaded: 0,
        message: '',
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        loading: false,
        errors: [],
        modal: false,
        emojiPicker: false
    }

    componentWillUnmount() {
        if( this.state.uploadTask !== null ){
            this.state.uploadTask.cancel();
            this.setState({ uploadTask: null })
        }
    }

    openModal = () => this.setState({ modal: true })

    closeModal = () => this.setState({ modal: false })

    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value })
    } 

    handleTogglePicker = () => {
        this.setState({ emojiPicker: !this.state.emojiPicker })
    }

    handleAddEmoji = emoji => {
        const oldMessage = this.state.message;
        const newMessage = this.colonToUnicode(` ${oldMessage} ${emoji.colons}`);
        this.setState({ message: newMessage, emojiPicker: false });
        setTimeout(() => this.messageInputRef.focus(), 0)
        
    }

    colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
          x = x.replace(/:/g, "");
          let emoji = emojiIndex.emojis[x];
          if (typeof emoji !== "undefined") {
            let unicode = emoji.native;
            if (typeof unicode !== "undefined") {
              return unicode;
            }
          }
          x = ":" + x + ":";
          return x;
        });
      };
    

    createMessage = (fileUrl = null) => {
        const {user, message} = this.state;
        const newMessage = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: user.uid,
                name: user.displayName,
                avatar: user.photoURL
            },
        };

        if(fileUrl !== null){
            newMessage['image'] = fileUrl;
        } else {
            newMessage['content'] = message;
        }

        return newMessage;
    }

    handleKeyDown = event => {
        const { message, typingRef, channel, user } = this.state;

        if(event.ctrlKey && event.keyCode === 13) {
            this.sendMessage();
        }

        if (message) {
            typingRef
            .child(channel.id)
            .child(user.uid)
            .set(user.displayName)
        } else {
            typingRef
                .child(channel.id)
                .child(user.uid)
                .remove()
        }
    };

    uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

        this.setState({
            uploadState: 'uploading',
            uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
        }, () => {
            this.state.uploadTask.on('state_changed', snap => {
                const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                this.props.isProgressBarVis(percentUploaded)
                this.setState({ percentUploaded })
            }, err => {
                console.error(err);
                this.setState({
                    errors: this.state.errors.concat(err),
                    uploadState: 'error',
                    uploadTask: null
                })
            }, () => {
                this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadUrl => {
                    this.sendFileMessage(downloadUrl, ref, pathToUpload);
                })
                .catch(err => {
                    console.error(err);
                    this.setState({
                        errors: this.state.errors.concat(err),
                        uploadState: 'error',
                        uploadTask: null
                    })
                })
            })
        })
    }

    getPath = () => {
        if(this.props.isPrivateChannel) {
            return `chat/private/${this.state.channel.id}`;
        } else {
            return "chat/public";
        }
    };

    sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileUrl))
            .then(() => {
                this.setState({ uploadState: 'Done!'})
            })
            .catch(err => {
                this.setState({ errors: this.state.errors.concat(err)})
            })
    }

    sendMessage = () => {
        const { getMessagesRef } = this.props;
        const { message, channel, user, typingRef } = this.state;

        if(message){
            this.setState({loading: true})
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: '', errors: []});
                    typingRef
                        .child(channel.id)
                        .child(user.uid)
                        .remove();
                })
                .catch(err => {
                    console.error(err);
                    this.setState({ loading: false, errors: this.state.errors.concat(err)})
                })
        } else {
            this.setState({
                 errors: this.state.errors.concat({message: 'Add a message'})
            })
        }
    }


    
    render(){
        const { errors, message, loading, modal, percentUploaded, uploadState, emojiPicker } = this.state;
        return(
            <Segment className='message__form'>
                <ProgressBar 
                        percentUploaded={percentUploaded}
                        uploadState={uploadState}
                />

                {emojiPicker && (
                    <Picker
                        set="apple"
                        onSelect={this.handleAddEmoji}
                        className="emojipicker"
                        title="Pick your emoji"
                        emoji="point_up"
                    />
                )}
                <Input 
                    fluid
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    value={message}
                    name='message'
                    style={{ marginBottom: '0.7em' }}
                    labelPosition='left'
                    ref={node => (this.messageInputRef = node)}
                    className={errors.some(error => error.message.includes('message')) ? 'error' : ''}
                    placeholder='Write your message'
                    label={
                    <Button 
                        icon={emojiPicker ? "close" : "add"} 
                        content={emojiPicker ? "Close" : null}
                        onClick={this.handleTogglePicker}
                    />
                    }   
                />
                <Button.Group icon widths='2'>
                   <Button 
                       color='orange'
                       disabled={loading}
                       onClick={this.sendMessage}
                       content='Add Reeply'
                       labelPosition='left'
                       icon='edit'
                   />
                   <Button 
                       color='teal'
                       disabled={uploadState === 'uploading'}
                       content='Upload Media'
                       labelPosition='right'
                       icon='cloud upload'
                       onClick={this.openModal}
                   /> 
                </Button.Group>
                <FileModal 
                       modal={modal}
                       closeModal={this.closeModal}
                       uploadFile={this.uploadFile}
                />
            </Segment>
        )
    }
}

export default MessageForm;