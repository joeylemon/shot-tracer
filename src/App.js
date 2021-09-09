import React from 'react'
import VideoCanvas from './components/VideoCanvas'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 5px;
`

function App () {
    return (
        <Wrapper>
            <VideoCanvas />
        </Wrapper>
    )
}

export default App
