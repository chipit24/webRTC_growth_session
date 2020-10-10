const webSocketConnection = new WebSocket('ws://localhost:3000');
const peerConnection = new RTCPeerConnection();

console.log('opening websocket connection');

webSocketConnection.addEventListener('error', event => {
  console.warn('WebSocket error: ', event);
});

webSocketConnection.addEventListener('open', () => {
  console.log('websocket connection open');
});

webSocketConnection.addEventListener('message', async messageEvent => {
  const {
    text, offer, answer, iceCandidate,
  } = JSON.parse(messageEvent.data);

  if (text) {
    console.log(text);
  }

  if (offer) {
    await peerConnection.setRemoteDescription(offer);
    const answerToOffer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerToOffer);
    webSocketConnection.send(JSON.stringify({ answer: answerToOffer }));
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
let videoSender = null;
let audioSender = null;

async function streamLocalVideo() {
  try {
    const mediaStreamConstraints = { video: true, audio: true };
    localStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    document.getElementById('local-video').srcObject = localStream;

    videoSender = peerConnection.addTrack(localStream.getVideoTracks()[0], localStream);
    audioSender = peerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
  } catch (error) {
    console.warn('Error starting local video', error.message);
  }
}

streamLocalVideo();

peerConnection.addEventListener('track', event => {
  const remoteVideo = document.getElementById('remote-video');

  if (remoteVideo.srcObject) {
    return;
  }

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
  console.log('peer connection changed');
  if (peerConnection.connectionState === 'connected') {
    console.log('peer connected!');
  }
});

document.getElementById('stop-video').addEventListener('click', async () => {
  // console.log('videoSender', videoSender);
  try {
    // peerConnection.removeTrack(videoSender);
    // localStream.getVideoTracks()[0].enabled = false;

    console.log('Before stop getSenders', peerConnection.getSenders());
    // console.log(await peerConnection.getStats(localStream.getVideoTracks()[0]));
    localStream.getVideoTracks()[0].stop();
    peerConnection.removeTrack(videoSender);
    // await videoSender.replaceTrack(null);
    setTimeout(() => {
      console.log('Stopped video track');
      console.log('Stopped video track getSenders', peerConnection.getSenders());
      // console.log(await peerConnection.getStats(localStream.getVideoTracks()[0]));
    }, 1000);

    // peerConnection.removeTrack(audioSender);
    // localStream.getAudioTracks()[0].enabled = false;
    localStream.getAudioTracks()[0].stop();
    // peerConnection.close();
  } catch (error) {
    console.log('Error stopping your video: ', error);
  }
});
