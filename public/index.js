const webSocketConnection = new WebSocket('ws://localhost:3000');
const peerConnection = new RTCPeerConnection();

webSocketConnection.addEventListener('error', event => {
  console.warn('WebSocket error: ', event);
});

webSocketConnection.addEventListener('open', () => {
  console.log('Websocket connection open');
});

webSocketConnection.addEventListener('message', async messageEvent => {
  const { text, offer, answer, iceCandidate } = JSON.parse(messageEvent.data);

  if (text) {
    console.log(text);
  }

  if (offer) {
    await peerConnection.setRemoteDescription(offer);
    const answerToOffer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerToOffer);
    webSocketConnection.send(JSON.stringify({ answer: peerConnection.localDescription }));
    console.log('Recieved offer, sendinig answer, setting peerConnection.setLocalDescription');
  }

  if (answer) {
    await peerConnection.setRemoteDescription(answer);
    console.log('Recieved answer, setting peerConnection.setRemoteDescription');
  }

  if (iceCandidate) {
    try {
      await peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Error adding received ice candidate', error);
    }
  }
});

let localStream = null;

async function streamLocalVideo() {
  try {
    const mediaStreamConstraints = { video: true };
    localStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    document.getElementById('local-video').srcObject = localStream;
    peerConnection.addTrack(localStream.getVideoTracks()[0], localStream);

    console.log('streamLocalVideo: ', peerConnection.getSenders()[0]);
  } catch (error) {
    console.warn('Error starting local video: ', error.message);
  }
}

streamLocalVideo();

peerConnection.addEventListener('track', event => {
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = event.streams[0];
});

peerConnection.addEventListener('negotiationneeded', async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  webSocketConnection.send(JSON.stringify({ offer: peerConnection.localDescription }));
});

peerConnection.addEventListener('icecandidate', event => {
  if (!event.candidate) {
    return;
  }

  webSocketConnection.send(JSON.stringify({ iceCandidate: event.candidate }));
});

peerConnection.addEventListener('connectionstatechange', () => {
  console.log('Peer connection changed');
  if (peerConnection.connectionState === 'connected') {
    console.log('Peer connected');
  }
});

function muteVideo() {
  localStream.getVideoTracks()[0].stop();
  peerConnection.removeTrack(peerConnection.getSenders()[0]);
}

async function unmuteVideo() {
  const mediaStreamConstraints = { video: true };
  localStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
  document.getElementById('local-video').srcObject = localStream;
  await peerConnection.getSenders()[0].replaceTrack(localStream.getVideoTracks()[0]);
  peerConnection.getSenders()[0].setStreams(localStream);
  peerConnection.getTransceivers()[0].direction = 'sendrecv';
}

let videoMuted = false;
document.getElementById('stop-video').addEventListener('click', async () => {
  if (videoMuted) {
    await unmuteVideo();
    videoMuted = false;
    return;
  }

  await muteVideo();
  videoMuted = true;
});
