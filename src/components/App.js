import React from 'react';
import { connect } from 'react-redux';
import  './App.css';
import { Grid } from 'semantic-ui-react';

import ColorPanel from './ColorPanel/ColorPanel';
import Messages from './Messages/Messages';
import MetaPanel from './MetaPanel/MetaPanel';
import SidePanel from './SidePanel/SidePanel';

const App = ({currentUser, currentChannel, isPrivateChannel, userPosts, secondaryColor, primaryColor }) => {
    return (
     <Grid columns='equal' className='app' style={{ background: secondaryColor}}>
        <ColorPanel
          key={currentUser && currentUser.name}
          currentUser={currentUser}
        />
        <SidePanel 
          currentUser={currentUser} 
          key={currentUser && currentUser.uid}
          primaryColor={primaryColor}
        />
        <Grid.Column style={{ marginLeft: 320 }} >
            <Messages
              currentUser={currentUser}
              currentChannel={currentChannel} 
              key={currentChannel && currentChannel.id}
              isPrivateChannel={isPrivateChannel}
            />
        </Grid.Column>
        <Grid.Column width={4}>
          <MetaPanel
            isPrivateChannel={isPrivateChannel}
            key={currentChannel && currentChannel.id}
            currentChannel={currentChannel}
            userPosts={userPosts}
          />
        </Grid.Column>
     </Grid>
    )
}

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel,
  isPrivateChannel: state.channel.isPrivateChannel,
  userPosts: state.channel.userPosts,
  primaryColor: state.color.primaryColor,
  secondaryColor: state.color.secondaryColor
})
 
export default connect(mapStateToProps)(App); 
