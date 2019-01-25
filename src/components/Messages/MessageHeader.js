import React, { Component } from 'react';
import { Segment, Header, Icon, Input } from 'semantic-ui-react';

class MessageHeader extends Component {
    render() {
        const { 
            channelName,
            numUniqueUsers,
            handleSearchChange,
            searchLoading,
            isPrivateChannel,
            handleStar,
            isChannelStared
            } = this.props;
        return (
        <Segment clearing>
        {/* Header Title */}
            <Header
                    fluid='true' 
                    as='h2' 
                    floated='left' 
                    style={{ marginBottom: 0}}
                >
                    <span> 
                        {channelName}
                        {! isPrivateChannel && 
                        <Icon
                            name={isChannelStared ? "star" : "star outline"}  
                            color={isChannelStared ? "yellow" : "black"}
                            onClick={handleStar}
                         />}
                    </span>
                    <Header.Subheader>{numUniqueUsers}</Header.Subheader>
                </Header>
                {/* Header Search */}
                <Header floated='right'>
                    <Input 
                        onChange={handleSearchChange}
                        loading={searchLoading}
                        size='mini'
                        icon='search'
                        name='searchTerm'
                        placeholder='Search Messages'
                    />
                </Header>
        </Segment> 
        )
    }
}

export default MessageHeader;
